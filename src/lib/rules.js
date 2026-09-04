// Spec Sections 7, 9.2, 9.3 and 9.4 — the notice, the conditionals, the submit
// gates, and the answered-question count. Everything here is shared by the
// guided form and the upload review so the two behave identically.

import { GUIDED_FIELDS, GUIDED_IDS, UPLOAD_IDS, SECTIONS } from './questions.js'
import { ECOVADIS_IDS } from './ecovadis.js'
import { isFilled, isValidEmail, isValidDate, isValidScore, findEmail } from './format.js'

// Spec Section 7. Worded exactly as written — never reworded.
export const TRANSPARENCY_NOTICE =
  'Your answers stay in your browser. This portal does not store, transmit, or email anything you enter. Closing this tab clears it.'

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

export const GUIDED_TOTAL = GUIDED_IDS.length // 33
export const UPLOAD_TOTAL = UPLOAD_IDS.length // 30
export const ECOVADIS_TOTAL = ECOVADIS_IDS.length // 9

// --- 9.3 Submit gating ------------------------------------------------------
//
// Every gate returns a list of { id, label, section } problems. An empty list
// means the door can submit. Nothing is silently dropped: each problem names a
// field, and the guided form uses `section` to jump to the first of them.

const guidedLabel = (id) => GUIDED_FIELDS.find((f) => f.id === id)?.label ?? id
const guidedSection = (id) => GUIDED_FIELDS.find((f) => f.id === id)?.section ?? 'S1'

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
export function guidedProblems(answers, declaration) {
  const problems = []

  for (const field of GUIDED_FIELDS) {
    if (field.section !== 'S1') continue
    if (!isFilled(answers[field.id])) {
      problems.push({ id: field.id, label: field.label, section: 'S1' })
    } else if (field.type === 'email' && !isValidEmail(answers[field.id])) {
      problems.push({
        id: field.id,
        label: `${field.label} — enter a valid email address`,
        section: 'S1',
      })
    }
  }

  for (const id of conditionallyRequiredIds(answers)) {
    if (!isFilled(answers[id])) {
      problems.push({ id, label: guidedLabel(id), section: guidedSection(id) })
    }
  }

  problems.push(...declarationProblems(declaration, 'declaration'))
  return problems
}

// View 6 — upload review. The same rules, applied to the reviewed answers. The
// template combines S1 into two cells, so the five discrete checks become two:
// both S1 rows must be filled, and the contact row must contain an address.
export function uploadProblems(answers, declaration) {
  const problems = []

  if (!isFilled(answers['T1'])) {
    problems.push({
      id: 'T1',
      label: 'Legal name and registered country of the responding entity',
      section: 'S1',
    })
  }
  if (!isFilled(answers['T2'])) {
    problems.push({
      id: 'T2',
      label: 'Primary contact name, title, and email address',
      section: 'S1',
    })
  } else if (!isValidEmail(findEmail(answers['T2']))) {
    problems.push({
      id: 'T2',
      label: 'Primary contact row — include a valid email address',
      section: 'S1',
    })
  }

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
  const problems = []
  if (!file) problems.push({ id: 'file', label: 'EcoVadis scorecard file' })
  if (!isFilled(identity.company)) problems.push({ id: 'company', label: 'Company legal name' })
  if (!isFilled(identity.contactName)) problems.push({ id: 'contactName', label: 'Contact name' })
  if (!isFilled(identity.contactTitle)) problems.push({ id: 'contactTitle', label: 'Contact title' })
  if (!isValidEmail(identity.contactEmail)) {
    problems.push({ id: 'contactEmail', label: 'Contact email address' })
  }
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
  const problems = []
  if (!isFilled(identity.company)) problems.push({ id: 'company', label: 'Company legal name' })
  if (!isFilled(identity.contactName)) problems.push({ id: 'contactName', label: 'Contact name' })
  if (!isFilled(identity.contactTitle)) problems.push({ id: 'contactTitle', label: 'Contact title' })
  if (!isValidEmail(identity.contactEmail)) {
    problems.push({ id: 'contactEmail', label: 'Contact email address' })
  }
  if (!isValidDate(answers['Q1'])) problems.push({ id: 'Q1', label: 'Publication date' })
  if (!isValidDate(answers['Q2'])) problems.push({ id: 'Q2', label: 'Valid until' })
  for (const id of ['Q3', 'Q4', 'Q5', 'Q6', 'Q7']) {
    if (!isValidScore(answers[id])) {
      problems.push({ id, label: `${id} score — enter a number from 0 to 100` })
    }
  }
  return problems
}

// The step index a blocked guided submission should jump to: S1–S7 are 0–6 and
// the declaration is 7.
export function stepForSection(sectionId) {
  if (sectionId === 'declaration') return SECTIONS.length
  const index = SECTIONS.findIndex((s) => s.id === sectionId)
  return index === -1 ? 0 : index
}
