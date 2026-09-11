// v3.0 persistence suite — acceptance criteria 4, 5, 6, 7, 11, 13.
//
// Exercises src/lib/submit.js against the real Supabase project through the
// anon key, exactly as the browser does. Verification of what landed is done
// with the service role, because the anon key cannot read either table back —
// which is itself the point of criterion 11.
//
//   SUPABASE_SERVICE_ROLE_KEY=... npx vite-node tests/persistence.test.mjs
//
// Every row it writes is removed again at the end.

import { createClient } from '@supabase/supabase-js'
import { submitToSupabase } from '../src/lib/submit.js'

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const URL = process.env.VITE_SUPABASE_URL

if (!SERVICE_KEY || !URL) {
  console.log('SKIP — set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run this suite.')
  process.exit(0)
}

const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`)
}

// A name unique to this run, so a failed run never poisons the next one.
const STAMP = `ZZ Test Co ${Date.now()}`

const identity = (over = {}) => ({
  company: STAMP,
  registeredCountry: 'Germany',
  contactName: 'Dana Roth',
  contactTitle: 'EHS Lead',
  contactEmail: 'dana@example.test',
  ...over,
})

const baseState = (over = {}) => ({
  identity: identity(),
  ecovadisAnswers: {},
  assessmentAnswers: {},
  assessmentNotes: {},
  declaration: { signatory: '', date: '', confirmed: false },
  ecovadisFile: null,
  uploadedFileName: '',
  uploadedFileSize: null,
  ...over,
})

// --- Criterion 4: every door writes a company row and a submission row ------
const guided = await submitToSupabase(baseState({
  path: 'full',
  door: 'form',
  assessmentAnswers: { 'S2-1': '12,400 tCO2e', 'S3-2': 'No' },
  assessmentNotes: { 'S2-1': 'ISO 14064-1' },
  declaration: { signatory: 'Dana Roth', date: '2026-09-11', confirmed: true },
}))
check('guided assessment submits', guided.ok, true)

const evUpload = await submitToSupabase(baseState({
  path: 'ecovadis',
  door: 'upload',
  ecovadisAnswers: { Q1: '2026-01-05', Q2: '2027-01-05', Q3: '68' },
  // A File-like object: name and size only, as the browser supplies.
  ecovadisFile: { name: 'scorecard.pdf', size: 482913 },
}))
check('ecovadis upload submits', evUpload.ok, true)

const evForm = await submitToSupabase(baseState({
  path: 'ecovadis',
  door: 'form',
  ecovadisAnswers: { Q1: '2026-01-05', Q2: '2027-01-05', Q3: '68', Q8: 'Bronze' },
}))
check('ecovadis form submits', evForm.ok, true)

const upload = await submitToSupabase(baseState({
  path: 'full',
  door: 'upload',
  assessmentAnswers: { 'S2-1': 'From the workbook' },
  uploadedFileName: 'completed.xlsx',
  uploadedFileSize: 91234,
  declaration: { signatory: 'Dana Roth', date: '2026-09-11', confirmed: true },
}))
check('upload review submits', upload.ok, true)

// --- Criterion 5: four submissions, one company row -------------------------
const { data: companies } = await admin
  .from('companies').select('*').eq('legal_name', STAMP)
check('criterion 5 — one company row for four submissions', companies?.length, 1)

const companyId = companies[0].id
const { data: subs } = await admin
  .from('submissions').select('*').eq('company_id', companyId).order('door')
check('criterion 4 — four submission rows, all linked', subs?.length, 4)
check('criterion 4 — the four door values are distinct and correct',
  subs.map((s) => s.door),
  ['assessment_guided', 'assessment_upload', 'ecovadis_form', 'ecovadis_upload'])

// --- Criterion 11: only filename and size, never file content ---------------
const evRow = subs.find((s) => s.door === 'ecovadis_upload')
check('criterion 11 — filename recorded', evRow.attached_file_name, 'scorecard.pdf')
check('criterion 11 — size recorded', evRow.attached_file_size, 482913)
const upRow = subs.find((s) => s.door === 'assessment_upload')
check('criterion 11 — workbook filename recorded', upRow.attached_file_name, 'completed.xlsx')
check('criterion 11 — workbook size recorded', upRow.attached_file_size, 91234)

// Path A has no declaration; Path B does.
check('path A carries no signatory', evRow.signatory_name, null)
check('path B carries the signatory',
  subs.find((s) => s.door === 'assessment_guided').signatory_name, 'Dana Roth')

// Answers: door-scoped, notes suffixed, identity never included.
const guidedRow = subs.find((s) => s.door === 'assessment_guided')
check('answers hold the door’s questions and notes',
  guidedRow.answers, { 'S2-1': '12,400 tCO2e', 'S3-2': 'No', 'S2-1__notes': 'ISO 14064-1' })
check('answers never contain identity',
  JSON.stringify(guidedRow.answers).includes('Dana Roth'), false)

// --- Criteria 6 & 7: matching and contact refresh ---------------------------
// Same company, differing by case and surrounding whitespace, new contact.
const repeat = await submitToSupabase(baseState({
  path: 'ecovadis',
  door: 'form',
  identity: identity({
    company: `   ${STAMP.toLowerCase()}   `,
    contactName: 'Priya Nair',
    contactTitle: 'Head of Sustainability',
    contactEmail: 'priya@example.test',
  }),
  ecovadisAnswers: { Q1: '2026-02-01', Q2: '2027-02-01', Q3: '71' },
}))
check('repeat submission succeeds', repeat.ok, true)

const { data: after } = await admin.from('companies').select('*').eq('legal_name', STAMP)
check('criterion 5 — still exactly one company row', after?.length, 1)
check('criterion 5 — and the same id', after[0].id, companyId)
check('criterion 7 — contact name refreshed', after[0].contact_name, 'Priya Nair')
check('criterion 7 — contact email refreshed', after[0].contact_email, 'priya@example.test')
check('criterion 7 — contact title refreshed', after[0].contact_title, 'Head of Sustainability')
check('criterion 7 — updated_at moved', after[0].updated_at > after[0].created_at, true)

const { count: total } = await admin
  .from('submissions').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
check('criterion 13 — earlier submissions untouched, now five', total, 5)

// --- Criterion 6: a new name creates a new company --------------------------
const otherName = `${STAMP} Subsidiary`
const other = await submitToSupabase(baseState({
  path: 'ecovadis', door: 'form',
  identity: identity({ company: otherName }),
  ecovadisAnswers: { Q1: '2026-03-01', Q2: '2027-03-01', Q3: '55' },
}))
check('criterion 6 — an unseen name submits', other.ok, true)
const { data: others } = await admin.from('companies').select('id').eq('legal_name', otherName)
check('criterion 6 — and creates its own company row', others?.length, 1)
check('criterion 6 — distinct from the first', others[0].id !== companyId, true)

// --- Cleanup ---------------------------------------------------------------
await admin.from('companies').delete().in('legal_name', [STAMP, otherName])
const { count: left } = await admin
  .from('companies').select('*', { count: 'exact', head: true }).eq('legal_name', STAMP)
check('test rows cleaned up', left, 0)

console.log(failures === 0 ? '\nAll persistence checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
