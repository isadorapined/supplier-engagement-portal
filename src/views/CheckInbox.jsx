import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FlowShell, Notice, SectionHeading } from '@/components/Chrome'

// Spec v3.1 Section 8 — NEW: Check Your Inbox. Says where the link went, that
// it must be opened on this device (cross-device handling is out of scope,
// Section 12), and offers the only recovery path this build has: a fresh link
// to the same address (criterion 25).
export default function CheckInbox({ email, onResend, onChangeEmail }) {
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState(null)

  const resend = async () => {
    if (resending) return
    setResending(true)
    setMessage(null)
    const result = await onResend(email)
    setResending(false)
    setMessage(
      result.ok
        ? `A new link was sent to ${email}. Use the newest email — an earlier link may no longer work.`
        : result.message,
    )
  }

  return (
    <FlowShell>
      <SectionHeading overline="Before you begin" title="Check your inbox." />

      <Card className="mt-8 space-y-4">
        <p className="font-body text-base text-ink">
          We sent a link to <span className="font-medium">{email}</span>.
        </p>
        <p className="font-body text-sm text-ink">
          Open the email on this device and select the link. It brings you straight to the two
          submission paths. Each link works once and expires after a short time.
        </p>
        <p className="font-body text-sm text-ink">
          Nothing there after a few minutes? Check your spam folder, then request a new link.
        </p>
      </Card>

      <Notice role="status" className="mt-6">
        {message}
      </Notice>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="nav" size="lg" onClick={resend} disabled={resending} className="w-full sm:w-auto">
          {resending ? 'Sending…' : 'Send a new link'}
        </Button>
        <Button variant="back" onClick={onChangeEmail} className="w-full sm:w-auto">
          Use a different email
        </Button>
      </div>
    </FlowShell>
  )
}
