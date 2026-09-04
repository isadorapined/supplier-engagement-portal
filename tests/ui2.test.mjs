import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = fileURLToPath(new URL('../', import.meta.url))

const DIR = process.argv[2]
const BASE = 'http://localhost:4173'
let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`)
}

const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : null) })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })
const page = await context.newPage()
const escaped = []
page.on('request', (r) => {
  const u = r.url()
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return
  if (u.includes('fonts.g')) return
  escaped.push(`${r.method()} ${u}`)
})
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

const openPathB = async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Start Full Assessment' }).click()
}

// ============ Criterion 7: Path B door chooser ============
await openPathB()
check('View 4 opens', await page.getByRole('heading', { name: 'Full Assessment' }).isVisible(), true)
check('one-sitting warning on door one',
  (await page.content()).includes('set aside enough time to finish in one sitting'), true)

// ============ Criterion 8: guided form, 8 steps, 33 fields ============
await page.getByRole('button', { name: 'Fill it in here' }).click()

const seen = []
const notesCounts = []
for (let step = 0; step < 7; step += 1) {
  const heading = await page.locator('h2').first().innerText()
  const ids = await page.locator('span.rounded.bg-teal\\/10').allInnerTexts()
  seen.push({ heading, ids })
  notesCounts.push(await page.getByLabel('Notes / evidence').count())
  if (step === 0) {
    // fill S1 as we pass through
    await page.fill('#q-S1-1', 'Northwind Components GmbH')
    await page.fill('#q-S1-2', 'Germany')
    await page.fill('#q-S1-3', 'Marta Vogel')
    await page.fill('#q-S1-4', 'Head of Sustainability')
    await page.fill('#q-S1-5', 'marta.vogel@northwind-components.de')
  }
  await page.getByRole('button', { name: 'Next' }).click()
}
const totalFields = seen.reduce((n, s) => n + s.ids.length, 0)
check('33 fields across seven sections', totalFields, 33)
check('section order and counts', seen.map((s) => `${s.heading.split(' — ')[0]}:${s.ids.length}`),
  ['S1:5','S2:7','S3:4','S4:5','S5:4','S6:3','S7:5'])
check('every field carries a notes box', notesCounts, [5,7,4,5,4,3,5])
check('step 8 is the declaration', await page.locator('h2').first().innerText(), 'Declaration')

// Criterion 9: the two corrected template defects.
const s4 = seen[3]
check('S4 heading is Water & Marine Resources', s4.heading, 'S4 — Water & Marine Resources')
check('"Specify source" sits in S4 as S4-2', s4.ids, ['S4-1','S4-2','S4-3','S4-4','S4-5'])
const s2 = seen[1]
check('"Specify scope 3 categories" is S2-4', s2.ids.includes('S2-4'), true)

// Criterion 8: back/next preserve answers.
for (let i = 0; i < 7; i += 1) await page.getByRole('button', { name: 'Back' }).first().click()
check('S1 answers survived the round trip', await page.inputValue('#q-S1-1'), 'Northwind Components GmbH')
check('back from S1 leaves the form',
  await (async () => { await page.getByRole('button', { name: 'Back' }).first().click()
    return page.getByRole('heading', { name: 'Full Assessment' }).isVisible() })(), true)

// ============ Criterion 9 cont: S2-4 has a working long-text field ============
await page.getByRole('button', { name: 'Fill it in here' }).click()
await page.getByRole('button', { name: 'Next' }).click()
await page.fill('#q-S2-4', 'Categories 1, 4, 6 and 11')
check('S2-4 accepts text', await page.inputValue('#q-S2-4'), 'Categories 1, 4, 6 and 11')

// ============ Criterion 14: PFAS conditional in the guided form ============
await page.getByRole('button', { name: 'Next' }).click() // S3
check('no PFAS notice before answering', await page.locator('[role="status"]').count(), 0)
await page.selectOption('#q-S3-2', 'No')
check('"No" shows no notice', await page.locator('[role="status"]').count(), 0)
await page.selectOption('#q-S3-2', 'Under investigation')
check('"Under investigation" wording', await page.locator('[role="status"]').innerText(),
  'This answer flags your submission for PFAS risk review.')
check('S3-3 still optional', (await page.locator('label[for="q-S3-3"]').innerText()).includes('(required)'), false)
await page.selectOption('#q-S3-2', 'Yes')
check('"Yes" wording', await page.locator('[role="status"]').innerText(),
  'Answering yes flags this submission for PFAS risk review by The Corporate’s EHS team.')
check('S3-3 becomes required', (await page.locator('label[for="q-S3-3"]').innerText()).includes('(required)'), true)

// ============ Criterion 15: water-stress conditional ============
await page.getByRole('button', { name: 'Next' }).click() // S4
await page.selectOption('#q-S4-3', 'Yes')
check('S4-5 becomes required', (await page.locator('label[for="q-S4-5"]').innerText()).includes('(required)'), true)

// ============ Criteria 16 + gating jump ============
for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Next' }).click()
check('on the declaration step', await page.locator('h2').first().innerText(), 'Declaration')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.waitForTimeout(600)
check('blocked submission jumped to S3 (first problem)',
  (await page.locator('h2').first().innerText()).startsWith('S3'), true)

// Answer the two conditionals, leave plenty of genuine gaps (criterion 17).
await page.fill('#q-S3-3', 'Non-PFAS alternatives qualified for two product lines. Full phase-out target 2029.')
await page.getByRole('button', { name: 'Next' }).click()
await page.fill('#q-S4-5', 'Dual-source water supply agreement plus a 14-day on-site reserve.')
for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Next' }).click()

// Declaration gate.
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.waitForTimeout(400)
check('declaration gate blocks', await page.getByRole('alert').isVisible(), true)
await page.fill('#dec-signatory', 'Marta Vogel')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.waitForTimeout(400)
check('unticked checkbox still blocks', await page.getByRole('alert').isVisible(), true)
await page.locator('input[type="checkbox"]').check()
await page.getByRole('button', { name: 'Submit', exact: true }).click()

// ============ Criterion 18: guided confirmation ============
check('guided submission reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)
const guidedSummary = (await page.locator('dl').innerText())
check('path is Full Assessment', guidedSummary.includes('Full Assessment'), true)
check('door is "Filled in here"', guidedSummary.includes('Filled in here'), true)
check('denominator is 33', /(\d+) of 33/.test(guidedSummary), true)
check('counts the 10 answered', guidedSummary.includes('10 of 33'), true)
check('signatory shown', guidedSummary.includes('Marta Vogel'), true)
check('declaration date shown', /Declaration date\s*\n?\s*\d{1,2} \w+ \d{4}/.test(guidedSummary), true)

// ============ Criteria 10-13: download and upload door ============
await page.getByRole('button', { name: 'Start another submission' }).click()
await page.getByRole('button', { name: 'Start Full Assessment' }).click()
await page.getByRole('button', { name: 'Download and upload' }).click()

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('link', { name: 'Download Assessment' }).click(),
])
check('criterion 10 — downloads the official template',
  download.suggestedFilename(), 'The_Corporate_Supplier_Questionnaire_2026.xlsx')
const dl = await download.path()
const { statSync } = await import('node:fs')
check('downloaded file is the real workbook',
  statSync(dl).size, statSync(ROOT + 'public/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx').size)

// Criterion 12: rejections, each with its own message.
const reject = async (file, expected) => {
  await page.setInputFiles('input[type=file]', path.join(DIR, file))
  await page.waitForTimeout(500)
  check(`rejects ${file}`, await page.getByRole('alert').innerText(), expected)
  check(`  no review table after ${file}`, await page.locator('table').count(), 0)
}
await reject('notes.txt', 'This portal accepts the official template as an Excel workbook (.xlsx) or its CSV export. Please upload one of those.')
await reject('renamed-sheet.xlsx', 'This doesn’t look like the official template — we couldn’t find the ‘Supplier Assessment 2026’ sheet. Download the template above and use that file.')
await reject('other-workbook.xlsx', 'This doesn’t look like the official template — we couldn’t find the ‘Supplier Assessment 2026’ sheet. Download the template above and use that file.')
await reject('bad-headers.xlsx', 'This doesn’t look like the official template — the column headings don’t match. Download the template above and use that file.')
await reject('altered-question.xlsx', 'This file doesn’t match the official 2026 template. 1 of the 30 questions are missing or have been changed. Download a fresh copy of the template above and transfer your answers into it.')

// Criterion 11: the CSV export is accepted.
await page.setInputFiles('input[type=file]', path.join(DIR, 'template.csv'))
await page.waitForTimeout(700)
check('criterion 11 — csv export reaches the review table', await page.locator('table').count(), 7)
check('a blank template marks everything "Not answered"',
  await page.getByText('Not answered', { exact: true }).count(), 30)

// Criterion 13: a filled workbook, second file replaces the first.
await page.setInputFiles('input[type=file]', path.join(DIR, 'filled.xlsx'))
await page.waitForTimeout(700)
check('30 answer fields in the review table', await page.locator('table tbody tr').count(), 30)
check('parsed answer shown against its question', await page.inputValue('#r-S2-1'), '12,400 tCO2e — verified by TUV Rheinland')
check('parsed notes carried across', await page.inputValue('#rn-S2-1'), 'ISO 14064-1 assurance report, 2025')
check('defect 2 row is editable and filled', await page.inputValue('#r-S2-4'), 'Categories 1, 4, 6 and 11')
check('defect 1 row appears under S4', await page.inputValue('#r-S4-2'), 'Groundwater')
check('Status column ignored', (await page.content()).includes('DO NOT READ'), false)
check('blanks still marked Not answered', await page.getByText('Not answered', { exact: true }).count(), 22)
check('review answered count', (await page.locator('text=/of 30 questions answered/').innerText()), '8 of 30 questions answered.')
const s4Table = await page.locator('section', { has: page.getByRole('heading', { name: /S4 — Water/ }) }).locator('table').innerText()
check('review table groups the mis-tagged row under S4', s4Table.includes('S4-2') && s4Table.includes('Specify source.'), true)

// Criteria 14/15 in the review table.
check('PFAS notice in the review table', await page.locator('[role="status"]').innerText(),
  'Answering yes flags this submission for PFAS risk review by The Corporate’s EHS team.')
check('S3-3 flagged required in the table',
  await page.locator('text=Required by your earlier answer').count(), 2)

await page.fill('#dec-signatory', 'Marta Vogel')
await page.locator('input[type="checkbox"]').check()
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.waitForTimeout(400)
check('blocked while the two conditionals are blank',
  (await page.getByRole('alert').innerText()).includes('2 fields need attention'), true)
await page.fill('#r-S3-3', 'Phase-out target 2029.')
await page.fill('#r-S4-5', 'Dual-source supply agreement.')
await page.getByRole('button', { name: 'Submit', exact: true }).click()

const uploadSummary = await page.locator('dl').innerText()
check('upload door reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)
check('door is "Uploaded"', uploadSummary.includes('Uploaded'), true)
check('denominator is 30', uploadSummary.includes('10 of 30'), true)
check('company read from the combined S1 cell',
  uploadSummary.includes('Northwind Components GmbH, Germany'), true)
check('email extracted from the combined contact cell',
  uploadSummary.includes('marta.vogel@northwind-components.de'), true)
check('uploaded filename shown', uploadSummary.includes('filled.xlsx'), true)

// ============ Criterion 22: mobile ============
await page.setViewportSize({ width: 375, height: 800 })
await page.goto(BASE, { waitUntil: 'networkidle' })
// The real test is whether the visitor can scroll the page sideways.
// documentElement.scrollWidth counts descendants clipped inside their own
// scroll containers, so it reports overflow the user cannot reach.
const noSideScroll = async (where) => {
  const result = await page.evaluate(() => {
    window.scrollTo(500, 0)
    const scrolled = window.scrollX
    window.scrollTo(0, 0)
    return { scrolled, bodyOverflow: document.body.scrollWidth - document.body.clientWidth }
  })
  check(`  ${where} does not scroll sideways`, result, { scrolled: 0, bodyOverflow: 0 })
}
await noSideScroll('landing')
check('stats collapse to two columns',
  await page.evaluate(() => getComputedStyle(document.querySelector('dl')).gridTemplateColumns.split(' ').length), 2)
const btn = await page.getByRole('button', { name: 'Go to step 1' }).boundingBox()
check('primary button is full width and tappable', btn.width > 300 && btn.height >= 44, true)

await page.getByRole('button', { name: 'Start Full Assessment' }).click()
await page.getByRole('button', { name: 'Download and upload' }).click()
await page.setInputFiles('input[type=file]', path.join(DIR, 'filled.xlsx'))
await page.waitForTimeout(700)
await noSideScroll('review table')
const tableScrolls = await page.evaluate(() => {
  const el = document.querySelector('table').parentElement
  return el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto'
})
check('the table scrolls inside its own container', tableScrolls, true)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Start Full Assessment' }).click()
await page.getByRole('button', { name: 'Fill it in here' }).click()
await noSideScroll('guided form')
check('guided form shows one section per screen',
  (await page.locator('h2').first().innerText()).startsWith('S1'), true)

console.log(`\n--- requests that left the page: ${escaped.length ? escaped.join(', ') : 'none'}`)
check('criterion 19 — nothing left the page', escaped, [])
check('no page errors', errors, [])

await browser.close()
console.log(failures === 0 ? '\nAll Path B / responsive checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
