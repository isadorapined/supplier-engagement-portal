import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TRANSPARENCY_NOTICE } from '@/lib/rules'
import { cn } from '@/lib/utils'

// No logo file exists for Data Leaf. The wordmark renders as DM Sans Medium
// type in Deep Space Blue — flagged in PROGRESS.md for replacement if a logo
// is ever supplied.
export function Wordmark({ className }) {
  return (
    <span className={cn('font-heading text-lg font-medium tracking-tight text-ink', className)}>
      Data Leaf
    </span>
  )
}

export function Nav() {
  return (
    <header className="bg-mint">
      <div className="mx-auto flex max-w-6xl items-center px-5 py-5 sm:px-8">
        <Wordmark />
      </div>
    </header>
  )
}

export const SCOPE3_NOTE =
  'Scope 3 is 71% of the total footprint (location-based, 2023 base year).'

export function Footer() {
  return (
    <footer className="mt-20 bg-silver">
      <div className="mx-auto max-w-6xl space-y-3 px-5 py-10 sm:px-8">
        <Wordmark />
        <p className="font-body text-sm text-ink">
          © 2026 The Corporate. Confidential — for authorised Tier 1 suppliers only.
        </p>
        <p className="font-body text-xs text-ink">{SCOPE3_NOTE}</p>
      </div>
    </footer>
  )
}

// Spec Section 7. Body text, above every submit control and on the
// confirmation screen. Never a modal, never a checkbox, no panel, no icon.
export function TransparencyNotice({ className }) {
  return (
    <p className={cn('max-w-prose font-body text-sm text-ink', className)}>
      {TRANSPARENCY_NOTICE}
    </p>
  )
}

// Spec 10.6 — every notice, rejection, and conditional message in the build.
// Burnt Clay body text, no panel, no icon, no modal.
export function Notice({ children, role = 'status', className }) {
  if (!children) return null
  return (
    <p role={role} className={cn('font-body text-sm text-clay', className)}>
      {children}
    </p>
  )
}

export function SectionHeading({ overline, title, lead, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {overline ? (
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          {overline}
        </p>
      ) : null}
      <h2 className="font-heading text-2xl font-medium sm:text-3xl">{title}</h2>
      {lead ? <p className="max-w-prose font-body text-base text-ink">{lead}</p> : null}
    </div>
  )
}

// Spec 10.3 — one card, six uses: the two Step 1 path cards and the two door
// cards on each chooser. Defined once so the treatment cannot drift apart.
export function ChoiceCard({ overline, title, body, note, action, onOpen }) {
  return (
    <Card tone="dark" className="flex flex-col">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-silver">
        {overline}
      </p>
      <h3 className="mt-4 font-heading text-xl font-medium text-mint">{title}</h3>
      <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-silver">{body}</p>
      {note ? <p className="mt-3 font-body text-sm text-silver">{note}</p> : null}
      <Button variant="nav" onClick={onOpen} className="mt-6 w-full sm:w-auto sm:self-start">
        {action}
      </Button>
    </Card>
  )
}

// The shell every submission view sits inside.
export function FlowShell({ children }) {
  return (
    <div className="min-h-screen bg-mint">
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
      <Footer />
    </div>
  )
}

// A blocked submission names the fields that need attention. Burnt Clay body
// text, no panel — spec 10.6.
export function ProblemList({ problems, className }) {
  if (!problems || problems.length === 0) return null
  return (
    <div role="alert" className={cn('font-body text-sm text-clay', className)}>
      <p className="font-medium">
        {problems.length === 1
          ? 'One field needs attention before you can submit.'
          : `${problems.length} fields need attention before you can submit.`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {problems.map((problem) => (
          <li key={`${problem.id}-${problem.label}`}>{problem.label}</li>
        ))}
      </ul>
    </div>
  )
}
