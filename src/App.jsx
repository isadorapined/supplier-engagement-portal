import { useState, useCallback, useRef, useEffect } from 'react'
import Landing from '@/views/Landing'
import VerifyEmail from '@/views/VerifyEmail'
import CheckInbox from '@/views/CheckInbox'
import LinkInvalid from '@/views/LinkInvalid'
import PathSelection from '@/views/PathSelection'
import EcoVadisChooser from '@/views/EcoVadisChooser'
import EcoVadisUpload from '@/views/EcoVadisUpload'
import EcoVadisForm from '@/views/EcoVadisForm'
import AssessmentChooser from '@/views/AssessmentChooser'
import GuidedForm from '@/views/GuidedForm'
import UploadReview from '@/views/UploadReview'
import Confirmation from '@/views/Confirmation'
import { todayValue } from '@/lib/format'
import { submitToSupabase } from '@/lib/submit'
import { supabase, landedWith } from '@/lib/supabase'
import { sendMagicLink, endVerifiedSession, clearAuthFromUrl } from '@/lib/auth'
import { FlowShell } from '@/components/Chrome'

// The whole in-progress session lives here, in React state — no localStorage,
// no sessionStorage, no cookies. Closing the tab mid-submission discards it.
//
// What changed in v3.0: a completed submission is no longer discarded. On
// submit it is written to Supabase (see lib/submit.js), which is why the
// transparency notice now says the information is stored. Nothing is written
// before submit, and nothing is ever read back — see spec Sections 2, 5 and 7.
//
// What changed in v3.1: a verified email gates every door. The verified
// session itself is held apart from this object (see `session` below), in
// memory only, and ends once the submission is saved.
const emptyState = (view = 'landing') => ({
  view,
  // The address Verify Your Email sent a link to, for Check Your Inbox and
  // its resend action.
  pendingEmail: '',
  path: null,
  door: null,
  // The five fields of the universal Company & Contact step, spec Section 8.
  // `registeredCountry` is new in v3.0 — Path A did not previously ask for it.
  // `contactEmail` is filled from the verified session, never typed (v3.1).
  identity: {
    company: '',
    registeredCountry: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
  },
  ecovadisAnswers: { Q1: '', Q2: '', Q3: '', Q4: '', Q5: '', Q6: '', Q7: '', Q8: '', Q9: '' },
  ecovadisFile: null,
  assessmentAnswers: {},
  assessmentNotes: {},
  uploadAccepted: false,
  uploadedFileName: '',
  uploadedFileSize: null,
  declaration: { signatory: '', date: todayValue(), confirmed: false },
  submittedAt: null,
  // Spec 9.5 — set while a write is in flight, and to the failure message if
  // it does not succeed. Never persisted anywhere.
  saving: false,
  saveError: null,
})

// Every view past the verification gate. Reached without a verified session,
// any of these renders Verify Your Email instead (spec v3.1 Section 8).
const GATED_VIEWS = new Set([
  'path-selection',
  'ecovadis-chooser',
  'ecovadis-upload',
  'ecovadis-form',
  'assessment-chooser',
  'assessment-form',
  'assessment-upload',
])

// An expired or reused link lands on Link No Longer Valid, never on an error.
const firstView = () => (landedWith === 'error' ? 'link-invalid' : 'landing')

export default function App() {
  const [state, setState] = useState(() => emptyState(firstView()))

  // The verified Supabase Auth session, or null. Arrives only through a magic
  // link opened in this tab; never restored from storage.
  const [session, setSession] = useState(null)
  // False only while a link that just landed is being exchanged for a session.
  const [authReady, setAuthReady] = useState(landedWith !== 'session')
  const sessionRef = useRef(session)
  sessionRef.current = session
  const verifiedEmail = session?.user?.email ?? ''

  useEffect(() => {
    if (landedWith === 'error') clearAuthFromUrl()
    if (!supabase) {
      setAuthReady(true)
      return undefined
    }
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event !== 'INITIAL_SESSION') return
      setAuthReady(true)
      if (landedWith === 'session') {
        clearAuthFromUrl()
        // Criterion 23: a valid link lands on Path Selection, not Landing.
        // A link that returned tokens Supabase then rejected is treated as
        // no longer valid (criterion 24).
        setState((current) => ({ ...current, view: next ? 'path-selection' : 'link-invalid' }))
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Criterion 26: the contact email on every door is the verified address.
  useEffect(() => {
    if (!verifiedEmail) return
    setState((current) =>
      current.identity.contactEmail === verifiedEmail
        ? current
        : { ...current, identity: { ...current.identity, contactEmail: verifiedEmail } },
    )
  }, [verifiedEmail])

  // The submit callback is created once, so it reads the current state through
  // a ref rather than closing over a stale copy.
  const stateRef = useRef(state)
  stateRef.current = state

  const update = useCallback((recipe) => setState((current) => recipe(current)), [])

  const go = useCallback((view, extra = {}) => {
    setState((current) => ({ ...current, view, ...extra }))
    window.scrollTo({ top: 0 })
  }, [])

  // A ref, not state: this guards the write itself and must be accurate the
  // instant it is read, before any re-render. The `saving` flag in state is
  // only for disabling the control.
  const inFlight = useRef(false)

  // Every door ends here. Spec 9.5: the view advances to the confirmation only
  // once both writes have succeeded. On failure the supplier stays on the door
  // with every answer intact and a Burnt Clay notice, and may retry.
  const submit = useCallback(async () => {
    if (inFlight.current) return // a double-click must not write two rows
    inFlight.current = true
    setState((current) => ({ ...current, saving: true, saveError: null }))

    let result
    try {
      result = await submitToSupabase(stateRef.current)
    } finally {
      inFlight.current = false
    }

    setState((current) =>
      result.ok
        ? {
            ...current,
            saving: false,
            saveError: null,
            view: 'confirmation',
            submittedAt: result.submittedAt,
          }
        : { ...current, saving: false, saveError: result.message },
    )

    if (result.ok) {
      window.scrollTo({ top: 0 })
      // One verification, one submission (CLAUDE.md Business Rules). View 7
      // renders from in-browser state, so it does not need the session.
      endVerifiedSession()
    }
  }, [])

  // Spec v3.1 Section 8 — Verify Your Email and the resend action.
  const sendLink = useCallback(
    async (email) => {
      const result = await sendMagicLink(email)
      if (result.ok) go('check-inbox', { pendingEmail: email })
      return result
    },
    [go],
  )

  // The path cards. Without a verified session they open the gate instead.
  const choosePath = useCallback(
    (path) => {
      if (!sessionRef.current) return go('verify-email')
      return go(path === 'ecovadis' ? 'ecovadis-chooser' : 'assessment-chooser', { path, door: null })
    },
    [go],
  )

  const backToPaths = () =>
    go(sessionRef.current ? 'path-selection' : 'landing', { path: null, door: null })

  // Spec View 7 — clears in-browser state only. The row already written to
  // Supabase is untouched and cannot be undone from here. The verified
  // session already ended on save, so the next submission verifies afresh.
  const restart = useCallback(() => {
    inFlight.current = false
    setState(emptyState())
    window.scrollTo({ top: 0 })
  }, [])

  if (!authReady) {
    return (
      <FlowShell>
        <p role="status" className="font-body text-base text-ink">
          Confirming your link…
        </p>
      </FlowShell>
    )
  }

  const view = GATED_VIEWS.has(state.view) && !session ? 'verify-email' : state.view

  switch (view) {
    case 'verify-email':
      return (
        <VerifyEmail
          initialEmail={state.pendingEmail}
          onSend={sendLink}
          onBack={() => go('landing', { path: null, door: null })}
        />
      )

    case 'check-inbox':
      return (
        <CheckInbox
          email={state.pendingEmail}
          onResend={sendMagicLink}
          onChangeEmail={() => go('verify-email')}
        />
      )

    case 'link-invalid':
      return <LinkInvalid onRestart={() => go('verify-email')} />

    case 'path-selection':
      return (
        <PathSelection
          email={verifiedEmail}
          onEcoVadis={() => choosePath('ecovadis')}
          onFullAssessment={() => choosePath('full')}
          onBack={() => go('landing', { path: null, door: null })}
        />
      )

    case 'ecovadis-chooser':
      return (
        <EcoVadisChooser
          onUpload={() => go('ecovadis-upload', { door: 'upload' })}
          onForm={() => go('ecovadis-form', { door: 'form' })}
          onBack={backToPaths}
        />
      )

    case 'ecovadis-upload':
      return (
        <EcoVadisUpload
          state={state}
          update={update}
          onSubmit={submit}
          onBack={() => go('ecovadis-chooser')}
        />
      )

    case 'ecovadis-form':
      return (
        <EcoVadisForm
          state={state}
          update={update}
          onSubmit={submit}
          onBack={() => go('ecovadis-chooser')}
        />
      )

    case 'assessment-chooser':
      return (
        <AssessmentChooser
          onGuided={() => go('assessment-form', { door: 'form' })}
          onUpload={() => go('assessment-upload', { door: 'upload' })}
          onBack={backToPaths}
        />
      )

    case 'assessment-form':
      return (
        <GuidedForm
          state={state}
          update={update}
          onSubmit={submit}
          onBack={() => go('assessment-chooser')}
        />
      )

    case 'assessment-upload':
      return (
        <UploadReview
          state={state}
          update={update}
          onSubmit={submit}
          onBack={() => go('assessment-chooser')}
        />
      )

    case 'confirmation':
      return <Confirmation state={state} onRestart={restart} />

    default:
      return (
        <Landing
          onEcoVadis={() => choosePath('ecovadis')}
          onFullAssessment={() => choosePath('full')}
        />
      )
  }
}
