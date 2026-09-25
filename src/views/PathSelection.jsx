import { Button } from '@/components/ui/Button'
import { FlowShell, SectionHeading } from '@/components/Chrome'
import PathCards from '@/components/PathCards'

// Spec v3.1 Section 8 / criterion 23 — where a valid magic link lands: the
// two path cards, not the Landing page.
export default function PathSelection({ email, onEcoVadis, onFullAssessment, onBack }) {
  return (
    <FlowShell>
      <SectionHeading
        overline={`Verified as ${email}`}
        title="Step 1 — Choose a path."
        lead="Your email is confirmed. Choose the path that applies to your company."
      />
      <div className="mt-10">
        <PathCards onEcoVadis={onEcoVadis} onFullAssessment={onFullAssessment} />
      </div>
      <div className="mt-8">
        <Button variant="back" onClick={onBack} className="w-full sm:w-auto">
          Back to the portal
        </Button>
      </div>
    </FlowShell>
  )
}
