import { Card } from '@/components/ui/Card'
import { Input, Label, Checkbox } from '@/components/ui/Field'
import { DECLARATION_TEXT } from '@/lib/questions'

export default function Declaration({ declaration, onChange }) {
  const set = (key, value) => onChange({ ...declaration, [key]: value })

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-medium">Declaration</h3>
        <p className="mt-3 max-w-prose font-body text-sm text-ink/80">{DECLARATION_TEXT}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="dec-signatory" required>
            Authorised signatory name
          </Label>
          <Input
            id="dec-signatory"
            className="mt-2"
            value={declaration.signatory}
            onChange={(event) => set('signatory', event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dec-date" required>
            Date
          </Label>
          <Input
            id="dec-date"
            type="date"
            className="mt-2"
            value={declaration.date}
            onChange={(event) => set('date', event.target.value)}
          />
        </div>
      </div>

      <Checkbox
        checked={declaration.confirmed}
        onChange={(event) => set('confirmed', event.target.checked)}
        label="I confirm the information provided is accurate and complete to the best of my knowledge."
      />
    </Card>
  )
}
