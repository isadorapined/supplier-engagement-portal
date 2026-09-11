import fs from 'node:fs/promises'
import path from 'node:path'
import { parseTemplateFile, MESSAGES } from '../src/lib/parseTemplate.js'
import { TEMPLATE_ROWS } from '../src/lib/questions.js'
import { countAnswered, uploadProblems, pfasState, waterStressState, identityProblems } from '../src/lib/rules.js'
import { fileURLToPath } from 'node:url'
const ROOT = fileURLToPath(new URL('../', import.meta.url))

const DIR = process.argv[2]
const load = async (name) => new File([await fs.readFile(path.join(DIR, name))], name)

let failures = 0
const check = (label, actual, expected) => {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${expected}\n        actual:   ${actual}`)
}

// --- Acceptance criterion 11: the official template, as .xlsx and as .csv ---
const blank = new File(
  [await fs.readFile(ROOT + 'public/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx')],
  'The_Corporate_Supplier_Questionnaire_2026.xlsx',
)
const r1 = await parseTemplateFile(blank)
check('blank .xlsx template accepted', r1.ok, true)
check('blank .xlsx parses 28 S2–S7 rows', r1.ok && Object.keys(r1.answers).length, 28)
check('blank template counts 0 answered', r1.ok && countAnswered(r1.answers, TEMPLATE_ROWS.map(r => r.id)), 0)

const csv = await load('template.csv')
const r2 = await parseTemplateFile(csv)
check('csv export accepted (sheet-name check skipped)', r2.ok, true)
check('csv parses 28 S2–S7 rows', r2.ok && Object.keys(r2.answers).length, 28)

// --- Criterion 13: answers, notes, ignored Status, tolerated defects ---
const filled = await load('filled.xlsx')
const r3 = await parseTemplateFile(filled)
check('filled template accepted', r3.ok, true)
check('reads column E', r3.ok && r3.answers['S2-1'], '12,400 tCO2e — verified by TUV Rheinland')
check('reads column F', r3.ok && r3.notes['S2-1'], 'ISO 14064-1 assurance report, 2025')
check('defect 2 — row ending at column D reads its answer', r3.ok && r3.answers['S2-4'], 'Categories 1, 4, 6 and 11')
check('defect 2 — and its notes', r3.ok && r3.notes['S2-4'], 'Screening completed March 2026')
check('defect 1 — S5-tagged row lands under S4-2', r3.ok && r3.answers['S4-2'], 'Groundwater')
check('Status column is ignored', r3.ok && JSON.stringify(r3).includes('DO NOT READ'), false)
check('declaration signatory prefilled', r3.ok && r3.declaration.signatory, 'Marta Vogel')
check('declaration label is not read as a value', r1.ok && r1.declaration.signatory, '')
// 6, not v2.1's 8: the fixture's two S1 rows ("Northwind Components GmbH,
// Germany" and Marta Vogel's contact line) are no longer read or counted.
check('answered count over the 28 S2–S7 rows', r3.ok && countAnswered(r3.answers, TEMPLATE_ROWS.map(r => r.id)), 6)

// --- Criterion 9 (v3.0): the template's two S1 rows are not read ---
check('no T1/T2 key in parsed answers', r1.ok && ('T1' in r1.answers || 'T2' in r1.answers), false)
check('no S1-* key in parsed answers', r1.ok && Object.keys(r1.answers).some(k => k.startsWith('S1')), false)
check('every parsed id is an S2–S7 id', r1.ok && Object.keys(r1.answers).every(k => /^S[2-7]-\d+$/.test(k)), true)
check('filled template does not read the S1 company cell',
  r3.ok && JSON.stringify(r3.answers).includes('Northwind Components GmbH'), false)
check('filled template does not read the S1 contact cell',
  r3.ok && JSON.stringify(r3.answers).includes('marta.vogel@northwind-components.de'), false)
// Proves the two assertions above test exclusion by the parser rather than
// absence from the file: the cells are demonstrably still in the workbook.
const XLSX = await import('xlsx')
const rawRows = XLSX.utils.sheet_to_json(
  XLSX.read(await fs.readFile(path.join(DIR, 'filled.xlsx')), { type: 'buffer' })
    .Sheets['Supplier Assessment 2026'],
  { header: 1, defval: '', raw: false },
)
check('…but those S1 cells are still present in the fixture itself',
  JSON.stringify(rawRows).includes('Northwind Components GmbH') &&
    JSON.stringify(rawRows).includes('marta.vogel@northwind-components.de'), true)

// --- Criterion 3 (v3.0): the shared Company & Contact gate ---
const goodIdentity = {
  company: 'Acme Widgets GmbH', registeredCountry: 'Germany',
  contactName: 'Dana Roth', contactTitle: 'EHS Lead', contactEmail: 'dana@acme.example',
}
check('identity gate — all five present passes', identityProblems(goodIdentity).length, 0)
check('identity gate — empty blocks on all five', identityProblems({}).length, 5)
check('identity gate — invalid email blocks', identityProblems({ ...goodIdentity, contactEmail: 'nope' }).length, 1)
check('identity gate — whitespace-only name blocks', identityProblems({ ...goodIdentity, company: '   ' }).length, 1)
check('identity gate — registered country is required',
  identityProblems({ ...goodIdentity, registeredCountry: '' }).length, 1)

// --- Criteria 14 & 15: conditionals behave in the review table ---
check('PFAS Yes shows the notice', pfasState(r3.answers).notice, 'Answering yes flags this submission for PFAS risk review by The Corporate’s EHS team.')
check('PFAS Yes makes S3-3 required', pfasState(r3.answers).requiresRoadmap, true)
check('Under investigation wording', pfasState({ 'S3-2': 'Under investigation' }).notice, 'This answer flags your submission for PFAS risk review.')
check('Under investigation leaves S3-3 optional', pfasState({ 'S3-2': 'Under investigation' }).requiresRoadmap, false)
check('No shows no notice', pfasState({ 'S3-2': 'No' }).notice, null)
check('water stress Yes makes S4-5 required', waterStressState(r3.answers).requiresContingency, true)

// --- Criteria 16 & 17: submit gating on the reviewed answers ---
const dec = { signatory: 'Marta Vogel', date: '2026-09-04', confirmed: true }
const blocked = uploadProblems(goodIdentity, r3.answers, dec)
check('blocked while S3-3 and S4-5 blank', blocked.map(p => p.id).join(','), 'S3-3,S4-5')
const completed = { ...r3.answers, 'S3-3': 'Phase-out by 2029.', 'S4-5': 'Dual-source contingency.' }
check('submits once conditionals answered, gaps allowed', uploadProblems(goodIdentity, completed, dec).length, 0)
check('upload door is blocked by an incomplete identity step', uploadProblems({}, completed, dec).length, 5)
check('declaration gate — unticked box blocks', uploadProblems(goodIdentity, completed, { ...dec, confirmed: false }).length, 1)
check('declaration gate — no signatory blocks', uploadProblems(goodIdentity, completed, { ...dec, signatory: '' }).length, 1)
check('declaration gate — bad date blocks', uploadProblems(goodIdentity, completed, { ...dec, date: '' }).length, 1)

// --- Criterion 12: everything else is rejected, with the exact message ---
const cases = [
  ['notes.txt', MESSAGES.extension],
  ['corrupt.xlsx', MESSAGES.unreadable],
  ['renamed-sheet.xlsx', MESSAGES.sheet],
  ['other-workbook.xlsx', MESSAGES.sheet],
  ['bad-headers.xlsx', MESSAGES.headers],
  ['altered-question.xlsx', MESSAGES.questions(1)],
]
for (const [name, expected] of cases) {
  const result = await parseTemplateFile(await load(name))
  check(`rejects ${name}`, result.ok === false && result.message, expected)
}

// Over 10 MB.
const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'pack.xlsx')
const rBig = await parseTemplateFile(big)
check('rejects a file over 10 MB', rBig.message, MESSAGES.tooLarge)

console.log(failures === 0 ? '\nAll parser checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
