import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'
import { FlowShell, Notice, SectionHeading } from '@/components/Chrome'
import { isValidEmail } from '@/lib/format'

// Spec v3.1 Section 8 — NEW: Verify Your Email. Reached from either path card
// on the Landing page by a visitor with no verified session. One field, one
// submit control. Criterion 21: a malformed address is refused here, before
// any request is made.
export default function VerifyEmail({ initialEmail = '', onSend, onBack }) {
  const [email, setEmail] = useState(initialEmail)
  const [problem, setProblem] = useState(null)
  const [sending, setSending] = useState(false)

  const send = async (event) => {
    event.preventDefault()
    if (sending) return
    if (!isValidEmail(email)) {
      setProblem('Enter a valid email address.')
      return
    }
    setProblem(null)
    setSending(true)
    const result = await onSend(email.trim())
    // On success the parent moves to Check Your Inbox and this view unmounts.
    if (!result.ok) {
      setSending(false)
      setProblem(result.message)
    }
  }

  return (
    <FlowShell>
      <SectionHeading
        overline="Before you begin"
        title="Verify your email."
        lead="We send a one-time link to the address you enter. Opening it confirms the address is yours, and your submission is recorded against it."
      />

      <form onSubmit={send} noValidate>
        <Card className="mt-8">
          <Label htmlFor="verify-email" required>
            Work email
          </Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            autoFocus
            className="mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Card>

        <Notice role="alert" className="mt-6">
          {problem}
        </Notice>

        <p className="mt-6 max-w-prose font-body text-sm text-ink">
          Open the link on this device, in this browser. The address you verify is stored with
          your submission for The Corporate&rsquo;s review.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" variant="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
            {sending ? 'Sending…' : 'Send link'}
          </Button>
          <Button variant="back" onClick={onBack} className="w-full sm:w-auto">
            Back to the portal
          </Button>
        </div>
      </form>
    </FlowShell>
  )
}
