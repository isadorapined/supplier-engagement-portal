import fs from 'node:fs/promises'
import path from 'node:path'
import { parseTemplateFile, MESSAGES } from '../src/lib/parseTemplate.js'
import { TEMPLATE_ROWS } from '../src/lib/questions.js'
import { countAnswered, uploadProblems, pfasState, waterStressState } from '../src/lib/rules.js'
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
check('blank .xlsx parses 30 rows', r1.ok && Object.keys(r1.answers).length, 30)
check('blank template counts 0 answered', r1.ok && countAnswered(r1.answers, TEMPLATE_ROWS.map(r => r.id)), 0)

const csv = await load('template.csv')
const r2 = await parseTemplateFile(csv)
check('csv export accepted (sheet-name check skipped)', r2.ok, true)
check('csv parses 30 rows', r2.ok && Object.keys(r2.answers).length, 30)

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
check('answered count', r3.ok && countAnswered(r3.answers, TEMPLATE_ROWS.map(r => r.id)), 8)

// --- Criteria 14 & 15: conditionals behave in the review table ---
check('PFAS Yes shows the notice', pfasState(r3.answers).notice, 'Answering yes flags this submission for PFAS risk review by The Corporate’s EHS team.')
check('PFAS Yes makes S3-3 required', pfasState(r3.answers).requiresRoadmap, true)
check('Under investigation wording', pfasState({ 'S3-2': 'Under investigation' }).notice, 'This answer flags your submission for PFAS risk review.')
check('Under investigation leaves S3-3 optional', pfasState({ 'S3-2': 'Under investigation' }).requiresRoadmap, false)
check('No shows no notice', pfasState({ 'S3-2': 'No' }).notice, null)
check('water stress Yes makes S4-5 required', waterStressState(r3.answers).requiresContingency, true)

// --- Criteria 16 & 17: submit gating on the reviewed answers ---
const dec = { signatory: 'Marta Vogel', date: '2026-09-04', confirmed: true }
const blocked = uploadProblems(r3.answers, dec)
check('blocked while S3-3 and S4-5 blank', blocked.map(p => p.id).join(','), 'S3-3,S4-5')
const completed = { ...r3.answers, 'S3-3': 'Phase-out by 2029.', 'S4-5': 'Dual-source contingency.' }
check('submits once conditionals answered, gaps allowed', uploadProblems(completed, dec).length, 0)
check('declaration gate — unticked box blocks', uploadProblems(completed, { ...dec, confirmed: false }).length, 1)
check('declaration gate — no signatory blocks', uploadProblems(completed, { ...dec, signatory: '' }).length, 1)
check('declaration gate — bad date blocks', uploadProblems(completed, { ...dec, date: '' }).length, 1)

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
