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
    <header className="border-b border-ink/10 bg-mint">
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
    <footer className="mt-20 border-t border-ink/10 bg-silver">
      <div className="mx-auto max-w-6xl space-y-3 px-5 py-10 sm:px-8">
        <Wordmark />
        <p className="font-body text-sm text-ink/75">
          © 2026 The Corporate. Confidential — for authorised Tier 1 suppliers only.
        </p>
        <p className="font-body text-xs text-ink/60">{SCOPE3_NOTE}</p>
      </div>
    </footer>
  )
}

// Spec Section 7. Body text, above every submit control and on the
// confirmation screen. Never a modal, never a checkbox.
export function TransparencyNotice({ className }) {
  return (
    <p className={cn('max-w-prose font-body text-sm text-ink/80', className)}>
      {TRANSPARENCY_NOTICE}
    </p>
  )
}

export function SectionHeading({ overline, title, lead, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {overline ? (
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-clay">
          {overline}
        </p>
      ) : null}
      <h2 className="font-heading text-2xl font-medium sm:text-3xl">{title}</h2>
      {lead ? <p className="max-w-prose font-body text-base text-ink/80">{lead}</p> : null}
    </div>
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

// A blocked submission names the fields that need attention.
export function ProblemList({ problems, className }) {
  if (!problems || problems.length === 0) return null
  return (
    <div
      role="alert"
      className={cn('rounded-md border border-clay/40 bg-clay/5 p-4', className)}
    >
      <p className="font-body text-sm font-medium text-ink">
        {problems.length === 1
          ? 'One field needs attention before you can submit.'
          : `${problems.length} fields need attention before you can submit.`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 font-body text-sm text-ink/80">
        {problems.map((problem) => (
          <li key={`${problem.id}-${problem.label}`}>{problem.label}</li>
        ))}
      </ul>
    </div>
  )
}
