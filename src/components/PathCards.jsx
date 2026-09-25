import { ChoiceCard } from '@/components/Chrome'

// The two Step 1 path cards. Rendered on the public Landing page and on the
// verified Path Selection screen (spec v3.1 Section 8), so the wording and
// treatment cannot drift between the two.
export default function PathCards({ onEcoVadis, onFullAssessment }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
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
  )
}
