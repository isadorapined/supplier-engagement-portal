import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label, Select, Hint } from '@/components/ui/Field'
import {
  FlowShell,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
} from '@/components/Chrome'
import { ECOVADIS_QUESTIONS } from '@/lib/ecovadis'
import { ecovadisFormProblems } from '@/lib/rules'

// View 3b — Path A door two. The nine EcoVadis questions, no file.
export default function EcoVadisForm({ state, update, onSubmit, onBack }) {
  const [problems, setProblems] = useState([])

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

  return (
    <FlowShell>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
        ← Back
      </Button>

      <SectionHeading
        overline="Path A · Door two"
        title="Enter your scorecard details"
        lead="Nine questions about your most recent EcoVadis cycle."
        className="mt-6"
      />

      <Card className="mt-8 space-y-5">
        <h3 className="font-heading text-lg font-medium">Your organisation</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="evf-company" required>
              Company legal name
            </Label>
            <Input
              id="evf-company"
              className="mt-2"
              value={identity.company}
              onChange={(event) => setIdentity('company', event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="evf-name" required>
              Primary contact name
            </Label>
            <Input
              id="evf-name"
              className="mt-2"
              value={identity.contactName}
              onChange={(event) => setIdentity('contactName', event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="evf-title" required>
              Primary contact title
            </Label>
            <Input
              id="evf-title"
              className="mt-2"
              value={identity.contactTitle}
              onChange={(event) => setIdentity('contactTitle', event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="evf-email" required>
              Primary contact email
            </Label>
            <Input
              id="evf-email"
              type="email"
              className="mt-2"
              value={identity.contactEmail}
              onChange={(event) => setIdentity('contactEmail', event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6 space-y-6">
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={submit} className="w-full sm:w-auto">
            Submit
          </Button>
          <Button size="lg" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Back
          </Button>
        </div>
      </div>
    </FlowShell>
  )
}
