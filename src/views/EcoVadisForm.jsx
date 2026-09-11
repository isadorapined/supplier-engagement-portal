import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label, Select, Hint } from '@/components/ui/Field'
import CompanyContact from '@/components/CompanyContact'
import {
  FlowShell,
  Notice,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
} from '@/components/Chrome'
import { ECOVADIS_QUESTIONS } from '@/lib/ecovadis'
import { ecovadisFormProblems, identityProblems } from '@/lib/rules'

// View 3b — Path A door two. Two steps in v3.0: the universal Company &
// Contact step, then the nine EcoVadis questions. Step 2 is exactly Q1–Q9 and
// carries no identity fields of its own (acceptance criterion 10).
export default function EcoVadisForm({ state, update, onSubmit, onBack }) {
  const [step, setStep] = useState(1)
  const [problems, setProblems] = useState([])
  const [showIdentityProblems, setShowIdentityProblems] = useState(false)

  const identity = state.identity
  const answers = state.ecovadisAnswers

  const setIdentity = (key, value) =>
    update((draft) => ({ ...draft, identity: { ...draft.identity, [key]: value } }))

  const setAnswer = (key, value) =>
    update((draft) => ({ ...draft, ecovadisAnswers: { ...draft.ecovadisAnswers, [key]: value } }))

  const submit = () => {
    const found = ecovadisFormProblems(identity, answers)
    setProblems(found)
    if (found.length === 0) onSubmit()
  }

  const next = () => {
    const found = identityProblems(identity)
    setShowIdentityProblems(true)
    if (found.length === 0) {
      setShowIdentityProblems(false)
      setStep(2)
      window.scrollTo({ top: 0 })
    }
  }

  if (step === 1) {
    return (
      <FlowShell>
        <CompanyContact
          identity={identity}
          onChange={setIdentity}
          onNext={next}
          onBack={onBack}
          breadcrumb="Path A · Door two"
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
        Path A · Door two
      </p>

      <SectionHeading
        className="mt-4"
        title="Enter your scorecard details"
        lead="Nine questions about your most recent EcoVadis cycle."
      />

      <p className="mt-4 font-body text-sm text-ink">Step 2 of 2</p>

      <Card className="mt-8 space-y-6">
        <div>
          <h3 className="font-heading text-lg font-medium">Your scorecard</h3>
          <Hint className="mt-1">
            Leave a theme score blank if your scorecard does not carry it.
          </Hint>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {ECOVADIS_QUESTIONS.map((question) => (
            <div
              key={question.id}
              className={question.type === 'select' ? 'sm:col-span-2' : undefined}
            >
              <Label htmlFor={`ev-${question.id}`}>
                <span className="mr-2 font-body text-xs font-semibold uppercase tracking-wide text-teal">
                  {question.id}
                </span>
                {question.label}
              </Label>

              {question.type === 'select' ? (
                <Select
                  id={`ev-${question.id}`}
                  className="mt-2"
                  options={question.options}
                  value={answers[question.id]}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                />
              ) : (
                <Input
                  id={`ev-${question.id}`}
                  className="mt-2"
                  type={question.type === 'date' ? 'date' : 'number'}
                  {...(question.type === 'score' ? { min: '0', max: '100' } : null)}
                  value={answers[question.id]}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                />
              )}
            </div>
          ))}
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
