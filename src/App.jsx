import { useState, useCallback, useRef } from 'react'
import Landing from '@/views/Landing'
import EcoVadisChooser from '@/views/EcoVadisChooser'
import EcoVadisUpload from '@/views/EcoVadisUpload'
import EcoVadisForm from '@/views/EcoVadisForm'
import AssessmentChooser from '@/views/AssessmentChooser'
import GuidedForm from '@/views/GuidedForm'
import UploadReview from '@/views/UploadReview'
import Confirmation from '@/views/Confirmation'
import { todayValue } from '@/lib/format'
import { submitToSupabase } from '@/lib/submit'

// The whole in-progress session lives here, in React state — no localStorage,
// no sessionStorage, no cookies. Closing the tab mid-submission discards it.
//
// What changed in v3.0: a completed submission is no longer discarded. On
// submit it is written to Supabase (see lib/submit.js), which is why the
// transparency notice now says the information is stored. Nothing is written
// before submit, and nothing is ever read back — see spec Sections 2, 5 and 7.
const emptyState = () => ({
  view: 'landing',
  path: null,
  door: null,
  // The five fields of the universal Company & Contact step, spec Section 8.
  // `registeredCountry` is new in v3.0 — Path A did not previously ask for it.
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

export default function App() {
  const [state, setState] = useState(emptyState)

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

    if (result.ok) window.scrollTo({ top: 0 })
  }, [])

  // Spec View 7 — clears in-browser state only. The row already written to
  // Supabase is untouched and cannot be undone from here.
  const restart = useCallback(() => {
    inFlight.current = false
    setState(emptyState())
    window.scrollTo({ top: 0 })
  }, [])

  switch (state.view) {
    case 'ecovadis-chooser':
      return (
        <EcoVadisChooser
          onUpload={() => go('ecovadis-upload', { door: 'upload' })}
          onForm={() => go('ecovadis-form', { door: 'form' })}
          onBack={() => go('landing', { path: null, door: null })}
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
          onBack={() => go('landing', { path: null, door: null })}
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
          onEcoVadis={() => go('ecovadis-chooser', { path: 'ecovadis', door: null })}
          onFullAssessment={() => go('assessment-chooser', { path: 'full', door: null })}
        />
      )
  }
}
