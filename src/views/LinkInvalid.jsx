import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FlowShell, SectionHeading } from '@/components/Chrome'

// Spec v3.1 Section 8 — NEW: Link No Longer Valid. Shown when Supabase Auth
// returns an expired or already-used link (criterion 24). A plain message and
// one way forward, never the raw error.
export default function LinkInvalid({ onRestart }) {
  return (
    <FlowShell>
      <SectionHeading overline="Before you begin" title="This link is no longer valid." />

      <Card className="mt-8">
        <p className="font-body text-base text-ink">
          It has expired or has already been used. Each link works once. Request a new one to
          continue.
        </p>
      </Card>

      <div className="mt-8">
        <Button variant="nav" size="lg" onClick={onRestart} className="w-full sm:w-auto">
          Request a new link
        </Button>
      </div>
    </FlowShell>
  )
}
