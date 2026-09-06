import { Button } from '@/components/ui/Button'
import { FlowShell, SectionHeading, ChoiceCard } from '@/components/Chrome'

// Views 2 and 4 share a shape: a heading, one framing sentence, two door cards,
// and a Back control. Neither door is gated or hidden. The cards are the same
// ChoiceCard the landing page uses, so the supplier meets one card language at
// every choice point — spec 10.3.
const ORDINAL = ['Door one', 'Door two']

export default function DoorChooser({ overline, title, lead, doors, onBack, backLabel }) {
  return (
    <FlowShell>
      <Button variant="back" size="sm" onClick={onBack} className="-ml-3">
        ← {backLabel}
      </Button>

      <SectionHeading overline={overline} title={title} lead={lead} className="mt-6" />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {doors.map((door, index) => (
          <ChoiceCard
            key={door.title}
            overline={ORDINAL[index]}
            title={door.title}
            body={door.body}
            note={door.warning}
            action={door.action}
            onOpen={door.onOpen}
          />
        ))}
      </div>
    </FlowShell>
  )
}
