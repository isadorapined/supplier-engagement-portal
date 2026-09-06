import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Nav, Footer, ChoiceCard, SCOPE3_NOTE } from '@/components/Chrome'

const STATS = [
  { figure: '690,000', label: 'tCO₂e Total Footprint (2023, location-based)' },
  { figure: '71%', label: 'Scope 3, Value Chain (location-based, 2023 base year)' },
  { figure: '2045', label: 'Net-Zero Target Year' },
  { figure: '500+', label: 'Tier 1 Suppliers' },
]

// Spec Section 8 View 1 — drafted by Claude Code in the Data Leaf voice,
// covering the ESRS/CSRD context, the 71% Scope 3 exposure, and the
// shared-responsibility framing. Flagged in PROGRESS.md for builder review
// before deployment.
const CONTEXT = [
  'The European Sustainability Reporting Standards require us to report the emissions, resource use, and social impacts of our full value chain, not only our own sites. Under CSRD those figures are audited. They have to come from the companies that generate them.',
  'Scope 3 is 71% of our total footprint, location-based, against a 2023 base year. Our own factories account for the rest. That arithmetic sets the terms of the programme: we cannot reach net-zero by 2045 on our own operations alone, and the accuracy of our disclosure depends on the quality of what our suppliers report.',
  'This assessment is how that data reaches us. It is ESRS-aligned, so the work you do here maps to the disclosures your own reporting will need. Where you find a gap, record it — a documented gap is more useful to both of us than an estimate. Our EHS and Procurement teams review every submission and return to prioritised suppliers with joint improvement plans, not with a score alone.',
]

const TIMELINE = [
  {
    step: '01',
    title: 'Portal Launch',
    body: 'You receive this link and select your submission path.',
    when: 'April 2026',
  },
  {
    step: '02',
    title: 'Data Submission',
    body: 'Submit scorecard or complete the assessment. 100% Tier 1 response required.',
    when: 'Deadline: 30 Sep 2026',
  },
  {
    step: '03',
    title: 'Review & Scoring',
    body: 'Our EHS and Procurement teams review submissions and flag gaps.',
    when: 'Q4 2026',
  },
  {
    step: '04',
    title: 'Partnership Plans',
    body: 'Joint decarbonisation and improvement plans agreed with prioritised suppliers.',
    when: 'Q1 2027',
  },
]

const RESOURCES = [
  {
    kind: 'Document',
    title: 'Supplier Code of Conduct',
    body: "The Corporate's standards for ethical business conduct, labour rights, and environmental responsibility. All Tier 1 suppliers must have a signed copy on file.",
    action: 'View Document',
    href: '/assets/The_Corporate_Supplier_Code_of_Conduct_2026.pdf',
    external: true,
  },
  {
    kind: 'Policy',
    title: 'Global Environmental Policy',
    body: "The Corporate's commitments on climate, water, PFAS, and circular economy — the framework that defines what we expect from our value chain partners.",
    action: 'View Policy',
    href: '/assets/The_Corporate_Global_Environmental_Policy.pdf',
    external: true,
  },
  {
    kind: 'Support',
    title: 'EHS Help Desk',
    body: 'Questions about specific ESRS requirements, measurement methodology, or technical aspects of the assessment? Contact our Environment, Health & Safety team directly.',
    action: 'Contact EHS',
    href: 'mailto:sustainability@thecorporate.com?subject=Supplier%20Portal%20Help%20Desk%20Query',
    external: false,
  },
]

export default function Landing({ onEcoVadis, onFullAssessment }) {
  // "Go to step 1" does one thing: it scrolls. It opens nothing and selects
  // no path.
  const goToStepOne = () => {
    document.getElementById('step-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-mint">
      <Nav />

      {/* Hero — spec 10.2. The only full-width dark band on the page. */}
      <section className="bg-ink">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-silver">
            Supplier Programme 2026
          </p>
          <h1 className="mt-5 max-w-4xl font-heading text-3xl font-medium leading-tight text-mint sm:text-5xl">
            We don&rsquo;t just manufacture products. We engineer a sustainable future.
          </h1>
          <p className="mt-6 max-w-prose font-body text-base text-mint sm:text-lg">
            Our 2045 Net-Zero goal is a shared journey. This portal is your starting point —
            understand what we are asking, why it matters, and which submission path applies to
            you.
          </p>

          {/* The one place in the build where Silver panels sit on a dark
              surface. Everywhere else they sit on Mint Cream. */}
          <dl className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-silver p-5">
                <dt className="font-stat text-3xl text-ink sm:text-4xl">{stat.figure}</dt>
                <dd className="mt-2 font-body text-sm leading-snug text-ink">{stat.label}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-body text-sm text-mint">{SCOPE3_NOTE}</p>

          <div className="mt-8">
            <Button variant="nav" size="lg" onClick={goToStepOne} className="w-full sm:w-auto">
              Go to step 1
            </Button>
          </div>
        </div>
      </section>

      {/* Why We Are Asking. — spec Section 8 View 1. Three separated paragraphs,
          each on a thick Deep Teal left border, directly on the Silver section. */}
      <section className="bg-silver">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Programme Context
          </p>
          <h2 className="mt-4 font-heading text-2xl font-medium sm:text-3xl">
            Why We Are Asking.
          </h2>
          <div className="mt-8 max-w-prose space-y-8">
            {CONTEXT.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="border-l-4 border-teal pl-5 font-body text-base leading-relaxed text-ink"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Step 1 — Choose a path. The hero button scrolls here. */}
      <section id="step-1" className="scroll-mt-6 bg-mint">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">Step 1 — Choose a path.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <ChoiceCard
              overline="Path A"
              title="You hold a current EcoVadis scorecard"
              body="If your scorecard was issued within the last 12 months, submit its details here and skip the full questionnaire. We accept the scorecard as evidence in place of the ESRS-aligned assessment."
              action="Submit EcoVadis Scorecard"
              onOpen={onEcoVadis}
            />
            <ChoiceCard
              overline="Path B"
              title="You do not hold a current scorecard"
              body="Complete the ESRS-aligned assessment: seven sections covering climate, pollution, water, waste, biodiversity, and social governance. Fill it in on this page, or download the template, complete it internally, and upload it back."
              action="Start Full Assessment"
              onOpen={onFullAssessment}
            />
          </div>
        </div>
      </section>

      {/* What Happens Next. The section sits on Mint Cream so the Silver hover
          state in spec 10.6 has something to read against. */}
      <section className="bg-mint">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">What Happens Next.</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {TIMELINE.map((item) => (
              <li
                key={item.step}
                className="border-t-2 border-clay p-5 transition-colors duration-200 ease-out hover:bg-silver"
              >
                <p className="font-stat text-2xl text-clay">{item.step}</p>
                <h3 className="mt-2 font-heading text-lg font-medium">{item.title}</h3>
                <p className="mt-2 font-body text-sm text-ink">{item.body}</p>
                <p className="mt-3 font-body text-xs font-medium uppercase tracking-wide text-teal">
                  {item.when}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Key Resources — v2.0 light card treatment, unchanged. */}
      <section className="bg-mint">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">Key Resources</h2>
          <p className="mt-2 font-body text-base text-ink">Everything you need.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {RESOURCES.map((resource) => (
              <Card key={resource.title} tone="mint" className="flex flex-col">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                  {resource.kind}
                </p>
                <h3 className="mt-4 font-heading text-lg font-medium">{resource.title}</h3>
                <p className="mt-3 flex-1 font-body text-sm text-ink">{resource.body}</p>
                <a
                  href={resource.href}
                  {...(resource.external ? { target: '_blank', rel: 'noreferrer' } : null)}
                  className="mt-6 inline-block font-body text-sm font-medium text-clay underline underline-offset-4 hover:text-ink"
                >
                  {resource.action}
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
