import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Nav, Footer, SCOPE3_NOTE } from '@/components/Chrome'

const STATS = [
  { figure: '690,000', label: 'tCO₂e Total Footprint (2023, location-based)' },
  { figure: '71%', label: 'Scope 3, Value Chain (location-based, 2023 base year)' },
  { figure: '2045', label: 'Net-Zero Target Year' },
  { figure: '500+', label: 'Tier 1 Suppliers' },
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
    document.getElementById('two-routes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-mint">
      <Nav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Supplier Programme 2026
        </p>
        <h1 className="mt-5 max-w-4xl font-heading text-3xl font-medium leading-tight sm:text-5xl">
          We don&rsquo;t just manufacture products. We engineer a sustainable future.
        </h1>
        <p className="mt-6 max-w-prose font-body text-base text-ink/80 sm:text-lg">
          Our 2045 Net-Zero goal is a shared journey. This portal is your starting point —
          understand what we are asking, why it matters, and which submission path applies to you.
        </p>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink/10 pt-10 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="font-stat text-3xl text-ink sm:text-4xl">{stat.figure}</dt>
              <dd className="mt-2 font-body text-sm leading-snug text-ink/70">{stat.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 font-body text-xs text-ink/60">{SCOPE3_NOTE}</p>

        <div className="mt-8">
          <Button size="lg" onClick={goToStepOne} className="w-full sm:w-auto">
            Go to step 1
          </Button>
        </div>
      </section>

      {/* Why We Are Asking */}
      <section className="bg-silver">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">Why We Are Asking</h2>
          <div className="mt-6 max-w-prose space-y-4 font-body text-base text-ink/85">
            <p>
              The European Sustainability Reporting Standards require us to report the emissions,
              resource use, and social impacts of our full value chain, not only our own sites.
              Under CSRD, those figures are audited. They have to come from the companies that
              generate them.
            </p>
            <p>
              Scope 3 is 71% of our total footprint (location-based, 2023 base year). Our own
              factories account for the remaining fraction. That arithmetic sets the terms of the
              programme: we cannot reach net-zero by 2045 on our own operations alone, and the
              accuracy of our disclosure depends on the quality of what our suppliers report.
            </p>
            <p>
              This assessment is how that data reaches us. It is ESRS-aligned, so the work you do
              here maps to the disclosures your own reporting will need. Where you identify a gap,
              say so — a documented gap is more useful to both of us than an estimate. Our EHS and
              Procurement teams review every submission and come back to prioritised suppliers with
              joint improvement plans, not with a score alone.
            </p>
          </div>
        </div>
      </section>

      {/* Two Routes. One Destination. */}
      <section id="two-routes" className="scroll-mt-6">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">
            Two Routes. One Destination.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                EcoVadis Scorecard
              </p>
              <h3 className="mt-4 font-heading text-xl font-medium">
                You hold a current EcoVadis scorecard
              </h3>
              <p className="mt-3 flex-1 font-body text-sm text-ink/80">
                If your scorecard was issued within the last 12 months, submit its details here and
                skip the full questionnaire. We accept the scorecard as evidence in place of the
                ESRS-aligned assessment.
              </p>
              <Button className="mt-6 w-full sm:w-auto" onClick={onEcoVadis}>
                Submit EcoVadis Scorecard
              </Button>
            </Card>

            <Card className="flex flex-col">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                Full Questionnaire
              </p>
              <h3 className="mt-4 font-heading text-xl font-medium">
                You do not hold a current scorecard
              </h3>
              <p className="mt-3 flex-1 font-body text-sm text-ink/80">
                Complete the ESRS-aligned assessment: seven sections covering climate, pollution,
                water, waste, biodiversity, and social governance. Fill it in on this page, or
                download the template, complete it internally, and upload it back.
              </p>
              <Button className="mt-6 w-full sm:w-auto" onClick={onFullAssessment}>
                Start Full Assessment
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="bg-silver">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">What Happens Next.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {TIMELINE.map((item) => (
              <li key={item.step} className="border-t-2 border-clay pt-5">
                <p className="font-stat text-2xl text-clay">{item.step}</p>
                <h3 className="mt-2 font-heading text-lg font-medium">{item.title}</h3>
                <p className="mt-2 font-body text-sm text-ink/80">{item.body}</p>
                <p className="mt-3 font-body text-xs font-medium uppercase tracking-wide text-teal">
                  {item.when}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Key Resources */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">Key Resources</h2>
          <p className="mt-2 font-body text-base text-ink/70">Everything you need.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {RESOURCES.map((resource) => (
              <Card key={resource.title} tone="silver" className="flex flex-col">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                  {resource.kind}
                </p>
                <h3 className="mt-4 font-heading text-lg font-medium">{resource.title}</h3>
                <p className="mt-3 flex-1 font-body text-sm text-ink/80">{resource.body}</p>
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
