import { chromium } from 'playwright'
import { mockSupabase, fillIdentity } from './support/supabase-mock.mjs'
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
  if (u.includes('/rest/v1/')) return // Supabase, asserted separately
  escaped.push(`${r.method()} ${u}`)
})
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

// The page now legitimately talks to Supabase on submit. Intercept both calls
// so this suite stays offline and deterministic, and so criterion 11 can be
// checked on the request bodies themselves.
const sb = await mockSupabase(page)

const openPathB = async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Start Full Assessment' }).click()
}

// ============ Criterion 7: Path B door chooser ============
await openPathB()
check('View 4 opens', await page.getByRole('heading', { name: 'Full Assessment' }).isVisible(), true)
check('one-sitting warning on door one',
  (await page.content()).includes('set aside enough time to finish in one sitting'), true)

// ====== Criteria 2, 3, 8: eight steps, identity first, 28 fields ======
await page.getByRole('button', { name: 'Fill it in here' }).click()

// Criterion 2 — the door opens on Company & Contact, before any question.
check('door one opens on Company & Contact',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('all five identity fields present, in spec order',
  await page.locator('[data-identity]').evaluateAll((els) => els.map((e) => e.dataset.identity)),
  ['company','registeredCountry','contactName','contactTitle','contactEmail'])
check('no assessment question on the identity step',
  await page.locator('[data-qid]').count(), 0)
check('progress indicator reads step 1 of 8',
  (await page.locator('text=/Step 1 of 8/').count()) > 0, true)

// Criterion 3 — the gate.
await page.getByRole('button', { name: 'Next' }).click()
check('cannot advance with all five empty',
  await page.locator('h2').first().innerText(), 'Before you begin')
await fillIdentity(page, { contactEmail: 'not-an-email' })
await page.getByRole('button', { name: 'Next' }).click()
check('cannot advance with an invalid email',
  await page.locator('h2').first().innerText(), 'Before you begin')
await page.fill('[data-identity="contactEmail"]', 'marta.vogel@northwind-components.de')
await page.getByRole('button', { name: 'Next' }).click()
check('advances once all five are valid',
  (await page.locator('h2').first().innerText()).startsWith('S2'), true)

const seen = []
const notesCounts = []
for (let step = 0; step < 6; step += 1) {
  const heading = await page.locator('h2').first().innerText()
  const ids = await page.locator('[data-qid]').evaluateAll((els) => els.map((el) => el.dataset.qid))
  seen.push({ heading, ids })
  notesCounts.push(await page.getByLabel('Notes / evidence').count())
  await page.getByRole('button', { name: 'Next' }).click()
}
const totalFields = seen.reduce((n, s) => n + s.ids.length, 0)
check('28 fields across six assessment sections', totalFields, 28)
check('section order and counts', seen.map((s) => `${s.heading.split(' — ')[0]}:${s.ids.length}`),
  ['S2:7','S3:4','S4:5','S5:4','S6:3','S7:5'])
check('every field carries a notes box', notesCounts, [7,4,5,4,3,5])
check('step 8 is the declaration', await page.locator('h2').first().innerText(), 'Declaration')
// Criterion 8 — "S1" is gone as a numbered section anywhere in the door.
check('no S1 question id anywhere in the guided form',
  seen.some((s) => s.ids.some((id) => id.startsWith('S1'))), false)
check('no S1 section heading anywhere',
  seen.some((s) => s.heading.startsWith('S1')), false)

// Criterion 9: the two corrected template defects.
const s4 = seen[2]
check('S4 heading is Water & Marine Resources', s4.heading, 'S4 — Water & Marine Resources')
check('"Specify source" sits in S4 as S4-2', s4.ids, ['S4-1','S4-2','S4-3','S4-4','S4-5'])
const s2 = seen[0]
check('"Specify scope 3 categories" is S2-4', s2.ids.includes('S2-4'), true)

// Criterion 8: back/next preserve answers.
for (let i = 0; i < 7; i += 1) await page.getByRole('button', { name: 'Back' }).first().click()
check('back through every step reaches Company & Contact',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('identity answers survived the round trip',
  await page.inputValue('[data-identity="company"]'), 'Northwind Components GmbH')
check('back from Company & Contact leaves the door',
  await (async () => { await page.getByRole('button', { name: 'Back' }).first().click()
    return page.getByRole('heading', { name: 'Full Assessment' }).isVisible() })(), true)

// ============ Criterion 9 cont: S2-4 has a working long-text field ============
await page.getByRole('button', { name: 'Fill it in here' }).click()
await page.getByRole('button', { name: 'Next' }).click() // identity is still filled
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
// Submit now awaits two database writes, so wait for the view to change.
await page.getByRole('heading', { name: 'Submission complete.' }).waitFor({ timeout: 5000 })
check('guided submission reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)
const guidedSummary = (await page.locator('dl').innerText())
check('path is Full Assessment', guidedSummary.includes('Full Assessment'), true)
check('door is "Filled in here"', guidedSummary.includes('Filled in here'), true)
check('denominator is 28', /(\d+) of 28/.test(guidedSummary), true)
check('counts the 5 answered', guidedSummary.includes('5 of 28'), true)
check('registered country shown on the confirmation',
  guidedSummary.includes('Germany'), true)
check('signatory shown', guidedSummary.includes('Marta Vogel'), true)
check('declaration date shown', /Declaration date\s*\n?\s*\d{1,2} \w+ \d{4}/.test(guidedSummary), true)

// ============ Criteria 10-13: download and upload door ============
await page.getByRole('button', { name: 'Start another submission' }).click()
await page.getByRole('button', { name: 'Start Full Assessment' }).click()
await page.getByRole('button', { name: 'Download and upload' }).click()

// Criterion 2 — door two opens on the same Company & Contact step, before the
// download panel, so identity is on record even if the supplier leaves after
// downloading the template.
check('door two opens on Company & Contact',
  await page.locator('h2').first().innerText(), 'Before you begin')
check('the download panel is not reachable until identity is given',
  await page.getByRole('link', { name: 'Download Assessment' }).count(), 0)
check('door two shows the identical five fields, in the same order',
  await page.locator('[data-identity]').evaluateAll((els) => els.map((e) => e.dataset.identity)),
  ['company','registeredCountry','contactName','contactTitle','contactEmail'])
await page.getByRole('button', { name: 'Next' }).click()
check('gate blocks door two as well',
  await page.locator('h2').first().innerText(), 'Before you begin')
await fillIdentity(page)
await page.getByRole('button', { name: 'Next' }).click()
check('door two advances to the download panel',
  await page.getByRole('link', { name: 'Download Assessment' }).count(), 1)

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
await reject('altered-question.xlsx', 'This file doesn’t match the official 2026 template. 1 of the 28 questions are missing or have been changed. Download a fresh copy of the template above and transfer your answers into it.')

// Criterion 11: the CSV export is accepted.
await page.setInputFiles('input[type=file]', path.join(DIR, 'template.csv'))
await page.waitForTimeout(700)
check('criterion 11 — csv export reaches the review table', await page.locator('table').count(), 6)
check('a blank template marks everything "Not answered"',
  await page.getByText('Not answered', { exact: true }).count(), 28)

// Criterion 13: a filled workbook, second file replaces the first.
await page.setInputFiles('input[type=file]', path.join(DIR, 'filled.xlsx'))
await page.waitForTimeout(700)
check('criterion 9 — exactly 28 rows in the review table', await page.locator('table tbody tr').count(), 28)
check('criterion 9 — no S1 row in the review table',
  (await page.locator('table').allInnerTexts()).join(' ').includes('Northwind Components GmbH, Germany'), false)
check('parsed answer shown against its question', await page.inputValue('#r-S2-1'), '12,400 tCO2e — verified by TUV Rheinland')
check('parsed notes carried across', await page.inputValue('#rn-S2-1'), 'ISO 14064-1 assurance report, 2025')
check('defect 2 row is editable and filled', await page.inputValue('#r-S2-4'), 'Categories 1, 4, 6 and 11')
check('defect 1 row appears under S4', await page.inputValue('#r-S4-2'), 'Groundwater')
check('Status column ignored', (await page.content()).includes('DO NOT READ'), false)
check('blanks still marked Not answered', await page.getByText('Not answered', { exact: true }).count(), 22)
check('review answered count', (await page.locator('text=/of 28 questions answered/').innerText()), '6 of 28 questions answered.')
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
await page.getByRole('heading', { name: 'Submission complete.' }).waitFor({ timeout: 5000 })

const uploadSummary = await page.locator('dl').innerText()
check('upload door reaches the confirmation',
  await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)
check('door is "Uploaded"', uploadSummary.includes('Uploaded'), true)
check('denominator is 28', /(\d+) of 28/.test(uploadSummary), true)
// v3.0: identity comes from Step 1, not from unpicking the template's S1
// cells. The combined cell text must not appear on the confirmation at all.
check('company comes from Step 1, not the template',
  uploadSummary.includes('Northwind Components GmbH'), true)
check('the combined S1 cell text is not shown',
  uploadSummary.includes('Northwind Components GmbH, Germany'), false)
check('registered country shown as its own field', uploadSummary.includes('Germany'), true)
check('contact email shown', uploadSummary.includes('marta.vogel@northwind-components.de'), true)

// ====== Criterion 11: what actually left the page on submit ======
const sentRow = sb.lastSubmission()
check('criterion 4 — the submission carried the right door',
  sentRow.door, 'assessment_upload')
check('criterion 11 — filename and size only', 
  [sentRow.attached_file_name, sentRow.attached_file_size !== null], ['filled.xlsx', true])
const allBodies = sb.calls.map((c) => c.body ?? '').join('')
check('criterion 11 — no workbook bytes in any request body',
  allBodies.includes('PK') || allBodies.includes('xl/worksheets'), false)
check('criterion 11 — request bodies are small (no file payload)',
  allBodies.length < 20000, true)
check('criterion 11 — identity never inside answers',
  JSON.stringify(sentRow.answers).includes('Marta Vogel'), false)
check('the company call sent all five identity fields',
  Object.keys(sb.lastCompany()).sort(),
  ['p_contact_email','p_contact_name','p_contact_title','p_legal_name','p_registered_country'])
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
// Criterion 19 — the new step must be usable on a narrow screen too.
await noSideScroll('Company & Contact step')
const identityFull = await page.evaluate(() => {
  const field = document.querySelector('[data-identity="company"]')
  const container = field.closest('div').parentElement
  // Within a pixel of its container: one field per row, no side-by-side pair.
  return Math.abs(field.getBoundingClientRect().width - container.getBoundingClientRect().width) <= 1
})
check('identity fields stack full width on mobile', identityFull, true)
await fillIdentity(page)
await page.getByRole('button', { name: 'Next' }).click()
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
check('guided form opens on the Company & Contact step',
  await page.locator('h2').first().innerText(), 'Before you begin')

console.log(`\n--- non-Supabase requests that left the page: ${escaped.length ? escaped.join(', ') : 'none'}`)
// Supabase calls are expected now and are asserted on their bodies above.
// Nothing *else* may leave the page.
check('nothing but Supabase leaves the page', escaped, [])
check('no page errors', errors, [])

await browser.close()
console.log(failures === 0 ? '\nAll Path B / responsive checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
