import { supabase, isConfigured } from './supabase.js'
import { GUIDED_IDS, UPLOAD_IDS } from './questions.js'
import { ECOVADIS_IDS } from './ecovadis.js'

// Spec Section 5 and 9.5 — the only code in the build that writes to Supabase.
//
// Two writes per submission:
//   1. resolve_company(...)  — a SECURITY DEFINER function that does the
//      match-or-insert on lower(btrim(legal_name)) server-side and returns
//      only the company id. `companies` has no anon RLS policy, so this
//      function is the client's sole route to it, and no other company's
//      details can ever come back.
//   2. insert into submissions — insert-only for anon. Note there is no
//      .select() chained: the policy would refuse it. View 7 is rendered from
//      in-browser state, never from a read-back.

// Spec 9.5. The message a supplier sees when a write fails. Burnt Clay body
// text, no panel, no icon (10.6). Says plainly that nothing was sent, because
// the transparency notice sitting directly above it claims the opposite.
export const SAVE_FAILED_MESSAGE =
  'Your submission could not be saved. Nothing has been sent. Check your ' +
  'connection and try again — your answers are still here.'

// Spec Section 5: `submissions.door`. The v2.1 build stored 'upload' / 'form',
// which collided across the two paths — 'full:form' and 'ecovadis:form' were
// indistinguishable in the row itself. These four values are unambiguous.
export const DOOR_VALUES = {
  'ecovadis:upload': 'ecovadis_upload',
  'ecovadis:form': 'ecovadis_form',
  'full:form': 'assessment_guided',
  'full:upload': 'assessment_upload',
}

// Only the ids that belong to this door, so `answers` carries no stray keys
// from a door the supplier opened, typed into, and backed out of.
function pick(source, ids) {
  const out = {}
  for (const id of ids) {
    const value = source?.[id]
    if (typeof value === 'string' ? value.trim() !== '' : value != null && value !== '') {
      out[id] = typeof value === 'string' ? value.trim() : value
    }
  }
  return out
}

// Build the `answers` JSON for whichever door is submitting. Identity never
// appears here — it lives on the company record (spec 9.4).
function buildAnswers(state) {
  const { path, door } = state

  if (path === 'ecovadis') {
    return pick(state.ecovadisAnswers, ECOVADIS_IDS)
  }

  const ids = door === 'upload' ? UPLOAD_IDS : GUIDED_IDS
  const answers = pick(state.assessmentAnswers, ids)

  // Notes/evidence travel alongside their question, suffixed, so one JSON
  // object holds both without a second column. They never count as answers.
  const notes = pick(state.assessmentNotes, ids)
  for (const [id, value] of Object.entries(notes)) {
    answers[`${id}__notes`] = value
  }
  return answers
}

// The file the supplier attached, if this door has one. Filename and size
// only — the bytes are never read and never leave the browser (Section 5,
// Section 12, acceptance criterion 11).
function fileMeta(state) {
  if (state.path === 'ecovadis' && state.door === 'upload') {
    return { name: state.ecovadisFile?.name ?? null, size: state.ecovadisFile?.size ?? null }
  }
  if (state.path === 'full' && state.door === 'upload') {
    return { name: state.uploadedFileName || null, size: state.uploadedFileSize ?? null }
  }
  return { name: null, size: null }
}

/**
 * Persist one submission. Resolves to { ok: true, submittedAt } on success, or
 * { ok: false, message } on any failure. Never throws, and never advances the
 * view on its own — the caller decides, and per 9.5 only advances on ok.
 */
export async function submitToSupabase(state) {
  if (!isConfigured || !supabase) {
    console.error('Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
    return { ok: false, message: SAVE_FAILED_MESSAGE }
  }

  const { identity, path, door, declaration } = state
  const doorValue = DOOR_VALUES[`${path}:${door}`]
  if (!doorValue) {
    console.error(`Unknown path/door combination: ${path}:${door}`)
    return { ok: false, message: SAVE_FAILED_MESSAGE }
  }

  try {
    // 1 — company, matched or created server-side.
    const { data: companyId, error: companyError } = await supabase.rpc('resolve_company', {
      p_legal_name: identity.company,
      p_registered_country: identity.registeredCountry,
      p_contact_name: identity.contactName,
      p_contact_title: identity.contactTitle,
      p_contact_email: identity.contactEmail,
    })

    if (companyError || !companyId) {
      console.error('resolve_company failed', companyError)
      return { ok: false, message: SAVE_FAILED_MESSAGE }
    }

    // 2 — the submission itself. Path B carries the declaration; Path A does
    // not have one, so those columns stay null.
    const isPathB = path === 'full'
    const file = fileMeta(state)

    const { error: submissionError } = await supabase.from('submissions').insert({
      company_id: companyId,
      path,
      door: doorValue,
      answers: buildAnswers(state),
      attached_file_name: file.name,
      attached_file_size: file.size,
      signatory_name: isPathB ? declaration.signatory.trim() || null : null,
      declaration_date: isPathB ? declaration.date || null : null,
    })

    if (submissionError) {
      // The company row may now exist without a submission. That is acceptable
      // and self-correcting: the next successful submission from this company
      // matches the same row rather than creating another (spec 9.5).
      console.error('submission insert failed', submissionError)
      return { ok: false, message: SAVE_FAILED_MESSAGE }
    }

    return { ok: true, submittedAt: new Date() }
  } catch (error) {
    // Offline, DNS failure, a paused Free-plan project — all land here.
    console.error('submit failed', error)
    return { ok: false, message: SAVE_FAILED_MESSAGE }
  }
}
