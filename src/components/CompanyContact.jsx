import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'
import { ProblemList, SectionHeading } from '@/components/Chrome'
import { IDENTITY_FIELDS } from '@/lib/questions'

// Spec v3.0 Section 8 — the universal Company & Contact step.
//
// One component, rendered as the first step of all four doors (Views 3a, 3b,
// 5 and 6). Acceptance criterion 2 asks that the five fields be identical in
// wording and order everywhere, and criterion 3 that the gate behave the same
// everywhere; defining it once is what makes both true by construction rather
// than by remembering. The field list itself lives in questions.js beside the
// resolve_company() argument names.
//
// Visual treatment is v2.1 Section 10.4 exactly, via Card and Input — no new
// pattern is introduced here (criterion 16).
export default function CompanyContact({
  identity,
  onChange,
  onNext,
  onBack,
  breadcrumb,
  stepLabel,
  problems = [],
  showProblems = false,
  // View 5 renders this inside its own eight-step shell, which already draws
  // the breadcrumb, progress indicator and Back/Next controls.
  embedded = false,
}) {
  const fields = (
    <div className="grid gap-5 sm:grid-cols-2">
      {IDENTITY_FIELDS.map((field, index) => (
        <div
          key={field.key}
          // The email field runs full width: addresses are long and wrap badly
          // in a half-width field on a narrow screen (criterion 19).
          className={field.type === 'email' ? 'sm:col-span-2' : undefined}
        >
          <Label htmlFor={`identity-${field.key}`} required>
            {field.label}
          </Label>
          <Input
            id={`identity-${field.key}`}
            data-identity={field.key}
            type={field.type}
            autoComplete={field.autoComplete}
            autoFocus={index === 0 && !embedded}
            className="mt-2"
            value={identity[field.key] ?? ''}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </div>
      ))}
    </div>
  )

  if (embedded) {
    return (
      <>
        <p className="max-w-prose font-body text-base text-ink">
          Tell us who this submission is from.
        </p>
        <div className="mt-6">{fields}</div>
        {showProblems ? <ProblemList problems={problems} className="mt-6" /> : null}
      </>
    )
  }

  return (
    <>
      {breadcrumb ? (
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-clay">
          {breadcrumb}
        </p>
      ) : null}

      <SectionHeading
        className="mt-4"
        title="Before you begin"
        lead="Tell us who this submission is from."
      />

      {stepLabel ? (
        <p className="mt-4 font-body text-sm text-ink">{stepLabel}</p>
      ) : null}

      <Card className="mt-8">{fields}</Card>

      {showProblems ? <ProblemList problems={problems} className="mt-6" /> : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* "Next" is Burnt Clay: this step navigates, it does not submit
            anything. Spec 10.5's behavioural hierarchy. */}
        <Button variant="nav" size="lg" onClick={onNext} className="w-full sm:w-auto">
          Next
        </Button>
        <Button variant="back" onClick={onBack} className="w-full sm:w-auto">
          Back
        </Button>
      </div>
    </>
  )
}
