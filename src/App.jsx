import { useState, useCallback } from 'react'
import Landing from '@/views/Landing'
import EcoVadisChooser from '@/views/EcoVadisChooser'
import EcoVadisUpload from '@/views/EcoVadisUpload'
import EcoVadisForm from '@/views/EcoVadisForm'
import AssessmentChooser from '@/views/AssessmentChooser'
import GuidedForm from '@/views/GuidedForm'
import UploadReview from '@/views/UploadReview'
import Confirmation from '@/views/Confirmation'
import { todayValue } from '@/lib/format'

// The whole session lives here, in React state. Nothing is written to a
// database, to localStorage, or to sessionStorage, and no request leaves the
// page. Closing the tab discards all of it. See spec Sections 2, 5 and 7.
const emptyState = () => ({
  view: 'landing',
  path: null,
  door: null,
  identity: {
    company: '',
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
  declaration: { signatory: '', date: todayValue(), confirmed: false },
  submittedAt: null,
})

export default function App() {
  const [state, setState] = useState(emptyState)

  const update = useCallback((recipe) => setState((current) => recipe(current)), [])

  const go = useCallback((view, extra = {}) => {
    setState((current) => ({ ...current, view, ...extra }))
    window.scrollTo({ top: 0 })
  }, [])

  // Every door ends here. The timestamp is the only thing generated at submit;
  // no network request fires.
  const submit = useCallback(() => {
    setState((current) => ({ ...current, view: 'confirmation', submittedAt: new Date() }))
    window.scrollTo({ top: 0 })
  }, [])

  const restart = useCallback(() => {
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
