import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const DIR = process.argv[2]
const BASE = 'http://localhost:4173'
let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`)
}

// A small stand-in scorecard PDF.
const pdfPath = path.join(DIR, 'scorecard.pdf')
fs.writeFileSync(pdfPath, Buffer.concat([
  Buffer.from('%PDF-1.4\n% EcoVadis scorecard stand-in\n'),
  Buffer.alloc(41_000, 0x20),
  Buffer.from('\n%%EOF\n'),
]))

const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : null) })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const escaped = []
page.on('request', (r) => {
  const u = r.url()
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') || u.includes('fonts.g')) return
  escaped.push(`${r.method()} ${u}`)
})

// ===== Criterion 5: Path A door one =====
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Upload your scorecard' }).click()

await page.getByRole('button', { name: 'Submit', exact: true }).click()
const blocked = await page.getByRole('alert').innerText()
check('submit blocked with everything empty', blocked.includes('8 fields need attention'), true)
check('the missing file is named', blocked.includes('EcoVadis scorecard file'), true)

await page.setInputFiles('input[type=file]', pdfPath)
check('filename displays', await page.getByText('scorecard.pdf').isVisible(), true)
check('file size displays', await page.getByText('40 KB').isVisible(), true)

await page.fill('#ev-company', 'Northwind Components GmbH')
await page.fill('#ev-name', 'Marta Vogel')
await page.fill('#ev-title', 'Head of Sustainability')
await page.fill('#ev-email', 'not-an-email')
await page.fill('#ev-published', '2026-02-11')
await page.fill('#ev-valid', '2027-02-11')
await page.fill('#ev-score', '140')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
const partial = await page.getByRole('alert').innerText()
check('invalid email is caught', partial.includes('Contact email address'), true)
check('out-of-range score is caught', partial.includes('a number from 0 to 100'), true)

await page.fill('#ev-email', 'marta.vogel@northwind-components.de')
await page.fill('#ev-score', '68')

// The Remove control clears the attachment and re-blocks the submission.
await page.getByRole('button', { name: 'Remove' }).click()
check('Remove clears the file', await page.getByText('scorecard.pdf').count(), 0)
await page.getByRole('button', { name: 'Submit', exact: true }).click()
check('submit blocked again without a file',
  (await page.getByRole('alert').innerText()).includes('EcoVadis scorecard file'), true)

await page.setInputFiles('input[type=file]', pdfPath)
await page.getByRole('button', { name: 'Submit', exact: true }).click()
check('complete form reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)

const summary = await page.locator('dl').innerText()
check('door is "Scorecard attached"', summary.includes('Scorecard attached'), true)
check('no answered-count for this door', /of \d+$/m.test(summary), false)
check('lists the five headline fields', [
  summary.includes('Northwind Components GmbH'),
  summary.includes('Marta Vogel'),
  summary.includes('Head of Sustainability'),
  summary.includes('11 February 2026'),
  summary.includes('11 February 2027'),
  summary.includes('68'),
], [true, true, true, true, true, true])
check('lists the attached filename', summary.includes('scorecard.pdf'), true)

// ===== Criterion 19: nothing is retained =====
const storage = await page.evaluate(() => ({
  local: window.localStorage.length,
  session: window.sessionStorage.length,
  cookies: document.cookie,
}))
check('nothing written to localStorage', storage.local, 0)
check('nothing written to sessionStorage', storage.session, 0)
check('no cookies set', storage.cookies, '')

await page.reload({ waitUntil: 'networkidle' })
check('reload lands on a clean landing page',
  await page.getByRole('heading', { name: 'Two Routes. One Destination.' }).isVisible(), true)
check('no submission is retained after reload',
  await page.getByRole('heading', { name: 'Submission complete.' }).count(), 0)
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Upload your scorecard' }).click()
check('no retained company name', await page.inputValue('#ev-company'), '')
check('no retained file', await page.getByText('scorecard.pdf').count(), 0)

console.log(`\n--- requests that left the page: ${escaped.length ? escaped.join(', ') : 'none'}`)
check('nothing left the page across the whole flow', escaped, [])

await browser.close()
console.log(failures === 0 ? '\nAll Path A / persistence checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
