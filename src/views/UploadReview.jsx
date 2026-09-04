import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea, Label } from '@/components/ui/Field'
import {
  FlowShell,
  SectionHeading,
  TransparencyNotice,
  ProblemList,
} from '@/components/Chrome'
import Declaration from '@/components/Declaration'
import PfasNotice from '@/components/PfasNotice'
import FilePicker from '@/components/FilePicker'
import { TEMPLATE_ROWS, SECTIONS, sectionById } from '@/lib/questions'
import { parseTemplateFile } from '@/lib/parseTemplate'
import {
  uploadProblems,
  conditionallyRequiredIds,
  pfasState,
  countAnswered,
  UPLOAD_TOTAL,
} from '@/lib/rules'
import { isFilled } from '@/lib/format'

const TEMPLATE_PATH = '/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx'

// Template rows grouped by the section they belong to, not the section the
// workbook tags them with.
const GROUPED = SECTIONS.map((section) => ({
  section,
  rows: TEMPLATE_ROWS.filter((row) => row.displaySection === section.id),
})).filter((group) => group.rows.length > 0)

// View 6 — Path B door two.
export default function UploadReview({ state, update, onSubmit, onBack }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [problems, setProblems] = useState([])

  const answers = state.assessmentAnswers
  const notes = state.assessmentNotes
  const declaration = state.declaration
  const reviewing = state.uploadAccepted

  const pfas = pfasState(answers)
  const conditionallyRequired = new Set(conditionallyRequiredIds(answers))
  const answered = countAnswered(answers, TEMPLATE_ROWS.map((row) => row.id))

  const setAnswer = (id, value) =>
    update((draft) => ({
      ...draft,
      assessmentAnswers: { ...draft.assessmentAnswers, [id]: value },
    }))

  const setNote = (id, value) =>
    update((draft) => ({ ...draft, assessmentNotes: { ...draft.assessmentNotes, [id]: value } }))

  const handleSelect = async (file) => {
    setError(null)
    setBusy(true)

    // Selecting a second file replaces the first entirely — no answer from a
    // previous file, accepted or rejected, survives.
    update((draft) => ({
      ...draft,
      assessmentAnswers: {},
      assessmentNotes: {},
      uploadAccepted: false,
      uploadedFileName: '',
    }))
    setProblems([])

    let result
    try {
      result = await parseTemplateFile(file)
    } catch {
      result = { ok: false, message: 'We couldn’t read that file. Try re-saving it and uploading again.' }
    }
    setBusy(false)

    if (!result.ok) {
      // No partial data carries forward from a rejection.
      setError(result.message)
      return
    }

    update((draft) => ({
      ...draft,
      assessmentAnswers: result.answers,
      assessmentNotes: result.notes,
      uploadAccepted: true,
      uploadedFileName: file.name,
      declaration: {
        ...draft.declaration,
        signatory: result.declaration.signatory || draft.declaration.signatory,
      },
    }))
  }

  const clearUpload = () => {
    setError(null)
    setProblems([])
    update((draft) => ({
      ...draft,
      assessmentAnswers: {},
      assessmentNotes: {},
      uploadAccepted: false,
      uploadedFileName: '',
    }))
  }

  const submit = () => {
    const found = uploadProblems(answers, declaration)
    setProblems(found)
    if (found.length === 0) onSubmit()
    else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <FlowShell>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
        ← Back
      </Button>

      <SectionHeading
        overline="Path B · Door two"
        title="Download and upload"
        className="mt-6"
      />

      {/* Step one — download */}
      <Card className="mt-8">
        <h3 className="font-heading text-lg font-medium">Step one — download the template</h3>
        <p className="mt-3 max-w-prose font-body text-sm text-ink/80">
          Complete it with whoever needs to contribute, then come back to this page and upload it.
        </p>
        <Button as="a" href={TEMPLATE_PATH} download className="mt-5 w-full sm:w-auto">
          Download Assessment
        </Button>
      </Card>

      {/* Step two — upload */}
      <Card className="mt-6">
        <h3 className="font-heading text-lg font-medium">Step two — upload the completed file</h3>
        <p className="mt-3 max-w-prose font-body text-sm text-ink/80">
          Only the official template above is accepted. Upload the workbook itself, or its CSV
          export.
        </p>

        <div className="mt-5">
          <FilePicker
            accept=".xlsx,.csv"
            file={
              reviewing && state.uploadedFileName
                ? { name: state.uploadedFileName, size: NaN }
                : null
            }
            label={busy ? 'Reading your file…' : 'Choose your completed template (.xlsx or .csv)'}
            hint="Read in your browser. Nothing is uploaded to a server."
            onSelect={handleSelect}
            onRemove={clearUpload}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-clay/40 bg-clay/5 px-4 py-3 font-body text-sm text-ink"
          >
            {error}
          </p>
        ) : null}
      </Card>

      {reviewing ? (
        <>
          <div className="mt-12">
            <SectionHeading
              title="Review your answers"
              lead="Everything we read from your file is below, grouped by section. Correct or complete anything before you submit."
            />
            <p className="mt-3 font-body text-sm text-ink/70">
              {answered} of {UPLOAD_TOTAL} questions answered.
            </p>
          </div>

          {/* The table scrolls inside its own container so the page never
              scrolls sideways on a phone. */}
          <div className="mt-8 space-y-10">
            {GROUPED.map(({ section, rows }) => (
              <section key={section.id}>
                <h3 className="font-heading text-lg font-medium">
                  {section.id} — {section.title}
                  <span className="ml-3 font-body text-xs font-normal uppercase tracking-wide text-teal">
                    {section.esrs}
                  </span>
                </h3>

                <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="bg-silver">
                        <th className="w-[40%] px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-ink/70">
                          Question / metric
                        </th>
                        <th className="w-[32%] px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-ink/70">
                          Supplier response
                        </th>
                        <th className="w-[28%] px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-ink/70">
                          Notes / evidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => {
                        const required = conditionallyRequired.has(row.id)
                        const empty = !isFilled(answers[row.id])
                        const AnswerControl = row.long ? Textarea : Input
                        return (
                          <tr
                            key={row.id}
                            className={index % 2 === 1 ? 'bg-silver/45' : 'bg-mint'}
                          >
                            <td className="border-t border-ink/10 px-4 py-4 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-teal/10 px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-wide text-teal">
                                  {row.displayId}
                                </span>
                                <span className="font-body text-xs text-ink/60">
                                  ESRS {row.esrs}
                                </span>
                              </div>
                              <p className="mt-2 font-body text-sm text-ink">{row.templateText}</p>
                              {empty ? (
                                <p className="mt-2 font-body text-xs font-medium text-clay">
                                  Not answered
                                </p>
                              ) : null}
                              {required ? (
                                <p className="mt-1 font-body text-xs text-clay">
                                  Required by your earlier answer
                                </p>
                              ) : null}
                            </td>
                            <td className="border-t border-ink/10 px-4 py-4 align-top">
                              <Label htmlFor={`r-${row.id}`} className="sr-only">
                                {row.templateText}
                              </Label>
                              <AnswerControl
                                id={`r-${row.id}`}
                                {...(row.long ? { rows: 3 } : null)}
                                value={answers[row.id] ?? ''}
                                onChange={(event) => setAnswer(row.id, event.target.value)}
                              />
                              {row.id === 'S3-2' ? <PfasNotice text={pfas.notice} /> : null}
                            </td>
                            <td className="border-t border-ink/10 px-4 py-4 align-top">
                              <Label htmlFor={`rn-${row.id}`} className="sr-only">
                                Notes and evidence
                              </Label>
                              <Textarea
                                id={`rn-${row.id}`}
                                rows={row.long ? 3 : 2}
                                value={notes[row.id] ?? ''}
                                onChange={(event) => setNote(row.id, event.target.value)}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12">
            <Declaration
              declaration={declaration}
              onChange={(next) => update((draft) => ({ ...draft, declaration: next }))}
            />
          </div>

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
        </>
      ) : null}
    </FlowShell>
  )
}
