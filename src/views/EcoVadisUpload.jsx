import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'
import FilePicker from '@/components/FilePicker'
import CompanyContact from '@/components/CompanyContact'
import {
  FlowShell,
  Notice,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
} from '@/components/Chrome'
import { ecovadisUploadProblems, identityProblems } from '@/lib/rules'

// View 3a — Path A door one. Two steps in v3.0: the universal Company &
// Contact step, then the scorecard details. The four identity fields that
// used to sit inside this door's own form have moved to Step 1, which is what
// acceptance criterion 10 checks — Step 2 has exactly three fields plus the
// file picker.
export default function EcoVadisUpload({ state, update, onSubmit, onBack }) {
  const [step, setStep] = useState(1)
  const [problems, setProblems] = useState([])
  const [showIdentityProblems, setShowIdentityProblems] = useState(false)

  const identity = state.identity
  const answers = state.ecovadisAnswers
  const file = state.ecovadisFile

  const setIdentity = (key, value) =>
    update((draft) => ({ ...draft, identity: { ...draft.identity, [key]: value } }))

  const setAnswer = (key, value) =>
    update((draft) => ({ ...draft, ecovadisAnswers: { ...draft.ecovadisAnswers, [key]: value } }))

  const next = () => {
    const found = identityProblems(identity)
    setShowIdentityProblems(true)
    if (found.length === 0) {
      setShowIdentityProblems(false)
      setStep(2)
      window.scrollTo({ top: 0 })
    }
  }

  const submit = () => {
    const found = ecovadisUploadProblems(identity, answers, file)
    setProblems(found)
    if (found.length === 0) onSubmit()
  }

  if (step === 1) {
    return (
      <FlowShell>
        <CompanyContact
          identity={identity}
          onChange={setIdentity}
          onNext={next}
          onBack={onBack}
          breadcrumb="Path A · Door one"
          stepLabel="Step 1 of 2"
          problems={identityProblems(identity)}
          showProblems={showIdentityProblems}
        />
      </FlowShell>
    )
  }

  return (
    <FlowShell>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-clay">
        Path A · Door one
      </p>

      <SectionHeading
        className="mt-4"
        title="Upload your scorecard"
        lead="Attach your EcoVadis scorecard and confirm the headline details. The file stays in your browser — we record its name and size, and read the values you type below, never the document itself."
      />

      <p className="mt-4 font-body text-sm text-ink">Step 2 of 2</p>

      <Card className="mt-8 space-y-6">
        <FilePicker
          accept="application/pdf,.pdf"
          file={file}
          label="Attach your EcoVadis scorecard (PDF)"
          hint="Held in your browser. Never read or uploaded — only its name and size are recorded."
          onSelect={(selected) => update((draft) => ({ ...draft, ecovadisFile: selected }))}
          onRemove={() => update((draft) => ({ ...draft, ecovadisFile: null }))}
        />

        {/* Exactly three fields — identity lives in Step 1 (criterion 10). */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="ev-published" required>
              Publication date
            </Label>
            <Input
              id="ev-published"
              type="date"
              className="mt-2"
              value={answers.Q1}
              onChange={(event) => setAnswer('Q1', event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ev-valid" required>
              Valid until
            </Label>
            <Input
              id="ev-valid"
              type="date"
              className="mt-2"
              value={answers.Q2}
              onChange={(event) => setAnswer('Q2', event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ev-score" required>
              Overall EcoVadis score
            </Label>
            <Input
              id="ev-score"
              type="number"
              min="0"
              max="100"
              className="mt-2"
              value={answers.Q3}
              onChange={(event) => setAnswer('Q3', event.target.value)}
            />
          </div>
        </div>
      </Card>

      <ProblemList problems={problems} className="mt-8" />

      <div className="mt-8 space-y-5">
        <TransparencyNotice />
        {/* Spec 9.5 — a failed write never reaches View 7. */}
        <Notice role="alert">{state.saveError}</Notice>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="submit"
            size="lg"
            onClick={submit}
            disabled={state.saving}
            className="w-full sm:w-auto"
          >
            {state.saving ? 'Saving…' : 'Submit'}
          </Button>
          {/* Back returns to Step 1, not out of the door. */}
          <Button
            size="lg"
            variant="back"
            onClick={() => setStep(1)}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
        </div>
      </div>
    </FlowShell>
  )
}
