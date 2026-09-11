import { chromium } from 'playwright'
import { mockSupabase, fillIdentity } from './support/supabase-mock.mjs'
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
  if (u.includes('/rest/v1/')) return // Supabase, asserted on its bodies below
  escaped.push(`${r.method()} ${u}`)
})

const sb = await mockSupabase(page)

// ===== Criterion 5: Path A door one =====
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Upload your scorecard' }).click()

// ===== Criteria 2, 3, 10: Step 1 is the shared Company & Contact step =====
check('door one opens on Company & Contact',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('the same five fields, in the same order',
  await page.locator('[data-identity]').evaluateAll((els) => els.map((e) => e.dataset.identity)),
  ['company','registeredCountry','contactName','contactTitle','contactEmail'])
check('no file picker on the identity step', await page.locator('input[type=file]').count(), 0)

await page.getByRole('button', { name: 'Next' }).click()
check('gate blocks with all five empty',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('all five are named as needing attention',
  (await page.getByRole('alert').innerText()).includes('5 fields need attention'), true)

await fillIdentity(page, { contactEmail: 'not-an-email' })
await page.getByRole('button', { name: 'Next' }).click()
check('gate blocks on an invalid email',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('the email is the field named',
  (await page.getByRole('alert').innerText()).includes('valid email address'), true)

await page.fill('[data-identity="contactEmail"]', 'marta.vogel@northwind-components.de')
await page.getByRole('button', { name: 'Next' }).click()
check('advances to step 2',
  await page.locator('h2').first().innerText(), 'Upload your scorecard')

// Criterion 10 — step 2 has exactly three fields plus the file picker.
check('step 2 has exactly three inputs besides the file picker',
  await page.locator('input:not([type=file])').count(), 3)
check('no identity field survives on step 2',
  await page.locator('[data-identity]').count(), 0)

await page.getByRole('button', { name: 'Submit', exact: true }).click()
const blocked = await page.getByRole('alert').innerText()
check('submit blocked with the door’s own fields empty',
  blocked.includes('4 fields need attention'), true)
check('the missing file is named', blocked.includes('EcoVadis scorecard file'), true)

await page.setInputFiles('input[type=file]', pdfPath)
check('filename displays', await page.getByText('scorecard.pdf').isVisible(), true)
check('file size displays', await page.getByText('40 KB').isVisible(), true)

await page.fill('#ev-published', '2026-02-11')
await page.fill('#ev-valid', '2027-02-11')
await page.fill('#ev-score', '140')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
const partial = await page.getByRole('alert').innerText()
check('out-of-range score is caught', partial.includes('a number from 0 to 100'), true)

await page.fill('#ev-score', '68')

// The Remove control clears the attachment and re-blocks the submission.
await page.getByRole('button', { name: 'Remove' }).click()
check('Remove clears the file', await page.getByText('scorecard.pdf').count(), 0)
await page.getByRole('button', { name: 'Submit', exact: true }).click()
check('submit blocked again without a file',
  (await page.getByRole('alert').innerText()).includes('EcoVadis scorecard file'), true)

await page.setInputFiles('input[type=file]', pdfPath)
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.getByRole('heading', { name: 'Submission complete.' }).waitFor({ timeout: 5000 })
check('complete form reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)

// ===== Criterion 11: only the filename and size left the page =====
const row = sb.lastSubmission()
check('criterion 4 — door recorded as ecovadis_upload', row.door, 'ecovadis_upload')
check('criterion 4 — path recorded as ecovadis', row.path, 'ecovadis')
check('criterion 11 — filename sent', row.attached_file_name, 'scorecard.pdf')
check('criterion 11 — size sent, and it is the real size', row.attached_file_size > 40000, true)
check('criterion 11 — the PDF itself is not in any request body',
  sb.calls.map((c) => c.body ?? '').join('').includes('%PDF'), false)
check('criterion 11 — no declaration on a Path A door',
  [row.signatory_name, row.declaration_date], [null, null])
check('answers hold only the three headline fields',
  Object.keys(row.answers).sort(), ['Q1','Q2','Q3'])

const summary = await page.locator('dl').innerText()
check('door is "Scorecard attached"', summary.includes('Scorecard attached'), true)
check('no answered-count for this door', /of \d+$/m.test(summary), false)
check('lists the headline fields and the identity from step 1', [
  summary.includes('Northwind Components GmbH'),
  summary.includes('Germany'),
  summary.includes('Marta Vogel'),
  summary.includes('Head of Sustainability'),
  summary.includes('11 February 2026'),
  summary.includes('11 February 2027'),
  summary.includes('68'),
], [true, true, true, true, true, true, true])
check('lists the attached filename', summary.includes('scorecard.pdf'), true)

// ===== Criterion 13: "Start another submission" clears the browser only =====
const writesBefore = sb.calls.length
await page.getByRole('button', { name: 'Start another submission' }).click()
check('restart returns to the landing page',
  await page.getByRole('heading', { name: 'Step 1 — Choose a path.' }).isVisible(), true)
check('restart issues no database call of its own', sb.calls.length, writesBefore)
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Upload your scorecard' }).click()
check('restart cleared the identity step',
  await page.inputValue('[data-identity="company"]'), '')

// ===== Criterion 19: nothing is retained in the browser =====
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
  await page.getByRole('heading', { name: 'Step 1 — Choose a path.' }).isVisible(), true)
check('no submission is retained after reload',
  await page.getByRole('heading', { name: 'Submission complete.' }).count(), 0)
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Upload your scorecard' }).click()
check('no retained company name', await page.inputValue('[data-identity="company"]'), '')
await page.getByRole('button', { name: 'Next' }).click()
check('no retained file', await page.getByText('scorecard.pdf').count(), 0)

// ===== Spec 9.5: a failed write must not reach the confirmation =====
sb.setFail(true)
await fillIdentity(page)
await page.getByRole('button', { name: 'Next' }).click()
await page.setInputFiles('input[type=file]', pdfPath)
await page.fill('#ev-published', '2026-02-11')
await page.fill('#ev-valid', '2027-02-11')
await page.fill('#ev-score', '68')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.waitForTimeout(1200)
check('9.5 — a failed write does not reach the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).count(), 0)
check('9.5 — the supplier is told nothing was sent',
  (await page.getByRole('alert').innerText()).includes('Nothing has been sent'), true)
check('9.5 — the typed answers are still on screen',
  await page.inputValue('#ev-score'), '68')
check('9.5 — the attached file is still attached',
  await page.getByText('scorecard.pdf').count() > 0, true)

// And a retry after the outage succeeds.
sb.setFail(false)
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.getByRole('heading', { name: 'Submission complete.' }).waitFor({ timeout: 5000 })
check('9.5 — retrying after the failure succeeds',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)

console.log(`\n--- non-Supabase requests that left the page: ${escaped.length ? escaped.join(', ') : 'none'}`)
check('nothing but Supabase leaves the page', escaped, [])

await browser.close()
console.log(failures === 0 ? '\nAll Path A / persistence checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
