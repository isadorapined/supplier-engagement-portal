import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FlowShell, SectionHeading } from '@/components/Chrome'

// Views 2 and 4 share a shape: a heading, one framing sentence, two door cards,
// and a Back control. Neither door is gated or hidden.
export default function DoorChooser({ overline, title, lead, doors, onBack, backLabel }) {
  return (
    <FlowShell>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
        ← {backLabel}
      </Button>

      <SectionHeading overline={overline} title={title} lead={lead} className="mt-6" />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {doors.map((door) => (
          <Card key={door.title} className="flex flex-col">
            <h3 className="font-heading text-xl font-medium">{door.title}</h3>
            <p className="mt-3 flex-1 font-body text-sm text-ink/80">{door.body}</p>
            {door.warning ? (
              <p className="mt-3 font-body text-sm text-teal">{door.warning}</p>
            ) : null}
            <Button className="mt-6 w-full sm:w-auto" onClick={door.onOpen}>
              {door.action}
            </Button>
          </Card>
        ))}
      </div>
    </FlowShell>
  )
}
