// Spec Sections 7, 9.2, 9.3 and 9.4 — the notice, the conditionals, the submit
// gates, and the answered-question count. Everything here is shared by the
// guided form and the upload review so the two behave identically.

import { GUIDED_FIELDS, GUIDED_IDS, UPLOAD_IDS, SECTIONS, IDENTITY_FIELDS } from './questions.js'
import { ECOVADIS_IDS } from './ecovadis.js'
import { isFilled, isValidEmail, isValidDate, isValidScore } from './format.js'

// Spec Section 7. Worded exactly as written — never reworded.
//
// Changed in v3.0, in the same commit that added the database write. The v2.1
// wording ("Your answers stay in your browser…") became false the moment this
// portal started persisting submissions, so the two changes must never be
// separated: a build with one and not the other lies to the supplier.
export const TRANSPARENCY_NOTICE =
  'Your information is stored for The Corporate’s review.'

// --- 9.2 Conditional questions ---------------------------------------------

const norm = (value) => String(value ?? '').trim().toLowerCase()

// The upload review accepts whatever the supplier typed against a dropdown
// question, so the triggers are matched on normalised text rather than on an
// exact option value.
export function pfasState(answers) {
  const value = norm(answers['S3-2'])
  if (value === 'yes') {
    return {
      notice: 'Answering yes flags this submission for PFAS risk review by The Corporate’s EHS team.',
      requiresRoadmap: true,
    }
  }
  if (value === 'under investigation') {
    return {
      notice: 'This answer flags your submission for PFAS risk review.',
      requiresRoadmap: false,
    }
  }
  return { notice: null, requiresRoadmap: false }
}

export function waterStressState(answers) {
  return { requiresContingency: norm(answers['S4-3']) === 'yes' }
}

// The ids that 9.2 has turned into required questions for this answer set.
export function conditionallyRequiredIds(answers) {
  const ids = []
  if (pfasState(answers).requiresRoadmap) ids.push('S3-3')
  if (waterStressState(answers).requiresContingency) ids.push('S4-5')
  return ids
}

// --- 9.4 Answered-question count -------------------------------------------

// A question counts as answered if its response field holds any non-whitespace
// character. Notes fields never count.
export function countAnswered(answers, ids) {
  return ids.reduce((total, id) => (isFilled(answers[id]) ? total + 1 : total), 0)
}

// Spec 9.4 denominators. Identity is never counted — it is mandatory and is
// shown separately on View 7.
export const GUIDED_TOTAL = GUIDED_IDS.length // 28 — S2–S7
export const UPLOAD_TOTAL = UPLOAD_IDS.length // 28 — the same S2–S7 rows
export const ECOVADIS_TOTAL = ECOVADIS_IDS.length // 9 — Q1–Q9

// --- 9.3 Submit gating ------------------------------------------------------
//
// Every gate returns a list of { id, label, section } problems. An empty list
// means the door can submit. Nothing is silently dropped: each problem names a
// field, and the guided form uses `section` to jump to the first of them.

const guidedLabel = (id) => GUIDED_FIELDS.find((f) => f.id === id)?.label ?? id
const guidedSection = (id) => GUIDED_FIELDS.find((f) => f.id === id)?.section ?? SECTIONS[0].id

// Spec 9.3, first row — the one gate shared by all four doors. All five fields
// filled, and the contact email a valid address. Defined once so the doors
// cannot drift apart, which is what acceptance criterion 3 checks.
export function identityProblems(identity) {
  const problems = []
  for (const field of IDENTITY_FIELDS) {
    const value = identity?.[field.key]
    if (!isFilled(value)) {
      problems.push({ id: field.key, label: field.label, section: 'identity' })
    } else if (field.type === 'email' && !isValidEmail(value)) {
      problems.push({
        id: field.key,
        label: `${field.label} — enter a valid email address`,
        section: 'identity',
      })
    }
  }
  return problems
}

export const identityComplete = (identity) => identityProblems(identity).length === 0

function declarationProblems(declaration, sectionId) {
  const problems = []
  if (!isFilled(declaration.signatory)) {
    problems.push({ id: 'signatory', label: 'Authorised signatory name', section: sectionId })
  }
  if (!isValidDate(declaration.date)) {
    problems.push({ id: 'declarationDate', label: 'Declaration date', section: sectionId })
  }
  if (!declaration.confirmed) {
    problems.push({ id: 'confirmed', label: 'Accuracy confirmation', section: sectionId })
  }
  return problems
}

// View 5 — guided assessment.
export function guidedProblems(identity, answers, declaration) {
  // Step 1 gates before the supplier can reach S2, so this should already be
  // satisfied. Re-checked here so a submit can never outrun the step.
  const problems = identityProblems(identity)

  for (const id of conditionallyRequiredIds(answers)) {
    if (!isFilled(answers[id])) {
      problems.push({ id, label: guidedLabel(id), section: guidedSection(id) })
    }
  }

  problems.push(...declarationProblems(declaration, 'declaration'))
  return problems
}

// View 6 — upload review. Identical rules to View 5, applied to the reviewed
// answers. v2.1 had to unpick the template's two combined S1 cells here; v3.0
// does not read those rows at all, so identity comes from Step 1 like every
// other door and the two doors now share one gate exactly.
export function uploadProblems(identity, answers, declaration) {
  const problems = identityProblems(identity)

  for (const id of conditionallyRequiredIds(answers)) {
    if (!isFilled(answers[id])) {
      problems.push({ id, label: guidedLabel(id), section: guidedSection(id) })
    }
  }

  problems.push(...declarationProblems(declaration, 'declaration'))
  return problems
}

// View 3a — EcoVadis scorecard upload.
export function ecovadisUploadProblems(identity, answers, file) {
  const problems = identityProblems(identity)
  if (!file) problems.push({ id: 'file', label: 'EcoVadis scorecard file' })
  if (!isValidDate(answers['Q1'])) problems.push({ id: 'Q1', label: 'Publication date' })
  if (!isValidDate(answers['Q2'])) problems.push({ id: 'Q2', label: 'Valid until' })
  if (!isFilled(answers['Q3']) || !isValidScore(answers['Q3'])) {
    problems.push({ id: 'Q3', label: 'Overall EcoVadis score — a number from 0 to 100' })
  }
  return problems
}

// View 3b — EcoVadis form. Scores may be left blank where the scorecard does
// not carry that theme; any score that is present must be 0–100.
export function ecovadisFormProblems(identity, answers) {
  const problems = identityProblems(identity)
  if (!isValidDate(answers['Q1'])) problems.push({ id: 'Q1', label: 'Publication date' })
  if (!isValidDate(answers['Q2'])) problems.push({ id: 'Q2', label: 'Valid until' })
  for (const id of ['Q3', 'Q4', 'Q5', 'Q6', 'Q7']) {
    if (!isValidScore(answers[id])) {
      problems.push({ id, label: `${id} score — enter a number from 0 to 100` })
    }
  }
  return problems
}

// The step index a blocked guided submission should jump to. Spec View 5's
// eight steps: Company & Contact is 0, S2–S7 are 1–6, the declaration is 7.
export const IDENTITY_STEP = 0
export const FIRST_SECTION_STEP = 1
export const DECLARATION_STEP = SECTIONS.length + 1 // 7

export function stepForSection(sectionId) {
  if (sectionId === 'identity') return IDENTITY_STEP
  if (sectionId === 'declaration') return DECLARATION_STEP
  const index = SECTIONS.findIndex((s) => s.id === sectionId)
  return index === -1 ? IDENTITY_STEP : index + FIRST_SECTION_STEP
}
