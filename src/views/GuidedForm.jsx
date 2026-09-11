import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label, Textarea, Select, Hint, QuestionMeta } from '@/components/ui/Field'
import {
  FlowShell,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
  Notice,
} from '@/components/Chrome'
import Declaration from '@/components/Declaration'
import CompanyContact from '@/components/CompanyContact'
import { SECTIONS, guidedFieldsFor } from '@/lib/questions'
import {
  guidedProblems,
  identityProblems,
  conditionallyRequiredIds,
  pfasState,
  stepForSection,
  IDENTITY_STEP,
  FIRST_SECTION_STEP,
  DECLARATION_STEP,
} from '@/lib/rules'

// Spec View 5 — eight steps: Company & Contact, S2–S7, Declaration. "S1" was
// retired as a numbered assessment section in v3.0; its five fields are the
// Company & Contact step, so they are asked once rather than twice.
const TOTAL_STEPS = SECTIONS.length + 2

function ProgressIndicator({ step }) {
  const label =
    step === IDENTITY_STEP
      ? 'Company & Contact'
      : step === DECLARATION_STEP
        ? 'Declaration'
        : SECTIONS[step - FIRST_SECTION_STEP].id
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-body text-sm font-medium text-ink">
          Step {step + 1} of {TOTAL_STEPS}
          <span className="ml-2 font-normal">{label}</span>
        </p>
        <p className="font-body text-xs text-ink">
          {Math.round(((step + 1) / TOTAL_STEPS) * 100)}% through
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index === step ? 'bg-clay' : 'bg-silver'}`}
          />
        ))}
      </div>
    </div>
  )
}

// View 5 — Path B door one.
export default function GuidedForm({ state, update, onSubmit, onBack }) {
  const [step, setStep] = useState(0)
  const [problems, setProblems] = useState([])

  const answers = state.assessmentAnswers
  const notes = state.assessmentNotes
  const declaration = state.declaration

  const pfas = pfasState(answers)
  const conditionallyRequired = new Set(conditionallyRequiredIds(answers))

  const setAnswer = (id, value) =>
    update((draft) => ({
      ...draft,
      assessmentAnswers: { ...draft.assessmentAnswers, [id]: value },
    }))

  const setNote = (id, value) =>
    update((draft) => ({ ...draft, assessmentNotes: { ...draft.assessmentNotes, [id]: value } }))

  const setDeclaration = (next) => update((draft) => ({ ...draft, declaration: next }))

  const goToStep = (next) => {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onIdentityStep = step === IDENTITY_STEP
  const onDeclarationStep = step === DECLARATION_STEP

  const setIdentity = (key, value) =>
    update((draft) => ({ ...draft, identity: { ...draft.identity, [key]: value } }))

  // The Company & Contact step cannot be advanced past until all five fields
  // are filled and the email is valid (spec 9.3, acceptance criterion 3).
  const nextFromIdentity = () => {
    const found = identityProblems(state.identity)
    setProblems(found)
    if (found.length === 0) {
      setProblems([])
      goToStep(FIRST_SECTION_STEP)
    }
  }

  const submit = () => {
    const found = guidedProblems(state.identity, answers, declaration)
    setProblems(found)
    if (found.length === 0) {
      onSubmit()
      return
    }
    // Jump to the section holding the first field needing attention.
    const target = stepForSection(found[0].section)
    if (target !== step) goToStep(target)
  }

  const section = onIdentityStep || onDeclarationStep ? null : SECTIONS[step - FIRST_SECTION_STEP]
  const fields = section ? guidedFieldsFor(section.id) : []

  return (
    <FlowShell>
      <Button
        variant="back"
        size="sm"
        onClick={step === 0 ? onBack : () => goToStep(step - 1)}
        className="-ml-3"
      >
        ← Back
      </Button>

      <div className="mt-6">
        <ProgressIndicator step={step} />
      </div>

      {onIdentityStep ? (
        <>
          <SectionHeading
            title="Before you begin"
            className="mt-8"
          />

          <Card className="mt-8">
            <CompanyContact
              embedded
              identity={state.identity}
              onChange={setIdentity}
              problems={problems}
              showProblems={problems.length > 0}
            />
          </Card>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button variant="nav" size="lg" onClick={nextFromIdentity} className="w-full sm:w-auto">
              Next
            </Button>
            <Button size="lg" variant="back" onClick={onBack} className="w-full sm:w-auto">
              Back
            </Button>
          </div>
        </>
      ) : section ? (
        <>
          <SectionHeading
            overline={section.esrs}
            title={`${section.id} — ${section.title}`}
            className="mt-8"
          />

          <div className="mt-8 space-y-6">
            {fields.map((field) => {
              const required = field.required || conditionallyRequired.has(field.id)
              const inputId = `q-${field.id}`
              return (
                <Card key={field.id} tone="silver">
                  <QuestionMeta
                    id={field.id}
                    esrs={field.esrs}
                    kind={
                      field.type === 'longtext'
                        ? 'Open-ended'
                        : field.type === 'select'
                          ? 'Dropdown'
                          : field.type === 'number'
                            ? 'Quantitative'
                            : 'Text'
                    }
                  />

                  <Label htmlFor={inputId} required={required} className="mt-3">
                    {field.label}
                  </Label>

                  {field.type === 'longtext' ? (
                    <Textarea
                      id={inputId}
                      className="mt-3"
                      value={answers[field.id] ?? ''}
                      onChange={(event) => setAnswer(field.id, event.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      id={inputId}
                      className="mt-3"
                      options={field.options}
                      value={answers[field.id] ?? ''}
                      onChange={(event) => setAnswer(field.id, event.target.value)}
                    />
                  ) : (
                    <Input
                      id={inputId}
                      className="mt-3"
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      {...(field.min != null ? { min: String(field.min) } : null)}
                      {...(field.max != null ? { max: String(field.max) } : null)}
                      value={answers[field.id] ?? ''}
                      onChange={(event) => setAnswer(field.id, event.target.value)}
                    />
                  )}

                  {field.id === 'S3-2' ? <Notice className="mt-3">{pfas.notice}</Notice> : null}

                  <div className="mt-4">
                    <Label htmlFor={`n-${field.id}`}>
                      Notes / evidence
                    </Label>
                    <Textarea
                      id={`n-${field.id}`}
                      rows={2}
                      className="mt-2"
                      value={notes[field.id] ?? ''}
                      onChange={(event) => setNote(field.id, event.target.value)}
                    />
                  </div>
                </Card>
              )
            })}
          </div>

          {section.id === SECTIONS[0].id ? (
            <Hint className="mt-4">
              Every assessment question may be left blank. A documented gap is a valid answer.
            </Hint>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button variant="nav" size="lg" onClick={() => goToStep(step + 1)} className="w-full sm:w-auto">
              Next
            </Button>
            <Button
              size="lg"
              variant="back"
              onClick={step === 0 ? onBack : () => goToStep(step - 1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
          </div>
        </>
      ) : (
        <>
          <SectionHeading
            overline="Final step"
            title="Declaration"
            lead="Confirm who is signing this assessment off."
            className="mt-8"
          />

          <div className="mt-8">
            <Declaration declaration={declaration} onChange={setDeclaration} />
          </div>

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
              <Button
                size="lg"
                variant="back"
                onClick={() => goToStep(step - 1)}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
            </div>
          </div>
        </>
      )}
    </FlowShell>
  )
}
