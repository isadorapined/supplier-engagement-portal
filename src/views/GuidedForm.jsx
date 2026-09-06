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
import { SECTIONS, guidedFieldsFor } from '@/lib/questions'
import {
  guidedProblems,
  conditionallyRequiredIds,
  pfasState,
  stepForSection,
} from '@/lib/rules'

const TOTAL_STEPS = SECTIONS.length + 1 // S1–S7 plus Declaration

function ProgressIndicator({ step }) {
  const label = step < SECTIONS.length ? SECTIONS[step].id : 'Declaration'
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

  const onDeclarationStep = step === SECTIONS.length

  const submit = () => {
    const found = guidedProblems(answers, declaration)
    setProblems(found)
    if (found.length === 0) {
      onSubmit()
      return
    }
    // Jump to the section holding the first field needing attention.
    const target = stepForSection(found[0].section)
    if (target !== step) goToStep(target)
  }

  const section = onDeclarationStep ? null : SECTIONS[step]
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

      {section ? (
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

          {section.id === 'S1' ? (
            <Hint className="mt-4">
              Every question outside this section may be left blank. A documented gap is a valid
              answer.
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="submit" size="lg" onClick={submit} className="w-full sm:w-auto">
                Submit
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
