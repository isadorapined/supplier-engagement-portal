import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'
import FilePicker from '@/components/FilePicker'
import {
  FlowShell,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
} from '@/components/Chrome'
import { ecovadisUploadProblems } from '@/lib/rules'

// View 3a — Path A door one.
export default function EcoVadisUpload({ state, update, onSubmit, onBack }) {
  const [problems, setProblems] = useState([])

  const identity = state.identity
  const answers = state.ecovadisAnswers
  const file = state.ecovadisFile

  const setIdentity = (key, value) =>
    update((draft) => ({ ...draft, identity: { ...draft.identity, [key]: value } }))

  const setAnswer = (key, value) =>
    update((draft) => ({ ...draft, ecovadisAnswers: { ...draft.ecovadisAnswers, [key]: value } }))

  const submit = () => {
    const found = ecovadisUploadProblems(identity, answers, file)
    setProblems(found)
    if (found.length === 0) onSubmit()
  }

  return (
    <FlowShell>
      <Button variant="back" size="sm" onClick={onBack} className="-ml-3">
        ← Back
      </Button>

      <SectionHeading
        overline="Path A · Door one"
        title="Upload your scorecard"
        lead="Attach your EcoVadis scorecard and confirm the headline details. The file stays in your browser — we read the values you type below, not the document."
        className="mt-6"
      />

      <Card className="mt-8 space-y-6">
        <FilePicker
          accept="application/pdf,.pdf"
          file={file}
          label="Attach your EcoVadis scorecard (PDF)"
          hint="Held in your browser. Never read or uploaded."
          onSelect={(selected) => update((draft) => ({ ...draft, ecovadisFile: selected }))}
          onRemove={() => update((draft) => ({ ...draft, ecovadisFile: null }))}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ev-company" required>
              Company legal name
            </Label>
            <Input
              id="ev-company"
              className="mt-2"
              value={identity.company}
              onChange={(event) => setIdentity('company', event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ev-name" required>
              Primary contact name
            </Label>
            <Input
              id="ev-name"
              className="mt-2"
              value={identity.contactName}
              onChange={(event) => setIdentity('contactName', event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ev-title" required>
              Primary contact title
            </Label>
            <Input
              id="ev-title"
              className="mt-2"
              value={identity.contactTitle}
              onChange={(event) => setIdentity('contactTitle', event.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="ev-email" required>
              Primary contact email
            </Label>
            <Input
              id="ev-email"
              type="email"
              className="mt-2"
              value={identity.contactEmail}
              onChange={(event) => setIdentity('contactEmail', event.target.value)}
            />
          </div>

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
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="submit" size="lg" onClick={submit} className="w-full sm:w-auto">
            Submit
          </Button>
          <Button size="lg" variant="back" onClick={onBack} className="w-full sm:w-auto">
            Back
          </Button>
        </div>
      </div>
    </FlowShell>
  )
}
