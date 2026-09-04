import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FlowShell, SectionHeading, TransparencyNotice } from '@/components/Chrome'
import { GUIDED_IDS, TEMPLATE_ROWS } from '@/lib/questions'
import { ECOVADIS_IDS } from '@/lib/ecovadis'
import { countAnswered, GUIDED_TOTAL, UPLOAD_TOTAL, ECOVADIS_TOTAL } from '@/lib/rules'
import { formatTimestamp, formatDateValue, findEmail } from '@/lib/format'

const HELP_DESK =
  'mailto:sustainability@thecorporate.com?subject=Supplier%20Portal%20Help%20Desk%20Query'

const DOOR_LABEL = {
  'ecovadis:upload': 'Scorecard attached',
  'ecovadis:form': 'Filled in here',
  'full:form': 'Filled in here',
  'full:upload': 'Uploaded',
}

const dash = (value) => (value && String(value).trim() ? String(value).trim() : '—')

// Spec 9.4 — the summary block. Every line is read back off the session state,
// so it reflects what was actually entered.
function buildRows(state) {
  const rows = []
  const { path, door, identity, ecovadisAnswers, assessmentAnswers, declaration } = state

  rows.push({
    label: 'Path',
    value: path === 'ecovadis' ? 'EcoVadis Scorecard' : 'Full Assessment',
  })
  rows.push({ label: 'Door', value: DOOR_LABEL[`${path}:${door}`] ?? '—' })

  if (path === 'ecovadis') {
    rows.push({ label: 'Company legal name', value: dash(identity.company) })
    rows.push({ label: 'Contact email', value: dash(identity.contactEmail) })

    if (door === 'upload') {
      // No count for this door — the five headline fields are listed instead.
      rows.push({ label: 'Contact name', value: dash(identity.contactName) })
      rows.push({ label: 'Contact title', value: dash(identity.contactTitle) })
      rows.push({ label: 'Publication date', value: dash(formatDateValue(ecovadisAnswers.Q1)) })
      rows.push({ label: 'Valid until', value: dash(formatDateValue(ecovadisAnswers.Q2)) })
      rows.push({ label: 'Overall EcoVadis score', value: dash(ecovadisAnswers.Q3) })
      rows.push({ label: 'Attached file', value: dash(state.ecovadisFile?.name) })
    } else {
      rows.push({
        label: 'Questions answered',
        value: `${countAnswered(ecovadisAnswers, ECOVADIS_IDS)} of ${ECOVADIS_TOTAL}`,
      })
    }
  } else {
    const isUpload = door === 'upload'
    const company = isUpload ? assessmentAnswers['T1'] : assessmentAnswers['S1-1']
    const email = isUpload ? findEmail(assessmentAnswers['T2']) : assessmentAnswers['S1-5']
    const ids = isUpload ? TEMPLATE_ROWS.map((row) => row.id) : GUIDED_IDS
    const total = isUpload ? UPLOAD_TOTAL : GUIDED_TOTAL

    rows.push({ label: 'Company legal name', value: dash(company) })
    rows.push({ label: 'Contact email', value: dash(email) })
    rows.push({
      label: 'Questions answered',
      value: `${countAnswered(assessmentAnswers, ids)} of ${total}`,
    })
    if (isUpload) {
      rows.push({ label: 'Uploaded file', value: dash(state.uploadedFileName) })
    }
    rows.push({ label: 'Authorised signatory', value: dash(declaration.signatory) })
    rows.push({ label: 'Declaration date', value: dash(formatDateValue(declaration.date)) })
  }

  rows.push({ label: 'Submitted', value: formatTimestamp(state.submittedAt) })
  return rows
}

// View 7 — the end of every door.
export default function Confirmation({ state, onRestart }) {
  const rows = buildRows(state)

  return (
    <FlowShell>
      <SectionHeading overline="Confirmed" title="Submission complete." />

      <Card className="mt-8">
        <dl className="divide-y divide-ink/10">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-body text-sm text-ink/60">{row.label}</dt>
              <dd className="font-body text-sm text-ink sm:col-span-2 sm:break-words">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-8">
        <TransparencyNotice />
      </div>

      <Card tone="silver" className="mt-8">
        <h3 className="font-heading text-lg font-medium">What happens next</h3>
        <p className="mt-3 max-w-prose font-body text-sm text-ink/80">
          The submission window closes on 30 September 2026. Our EHS and Procurement teams review
          every submission and return to prioritised suppliers with joint improvement plans in Q1
          2027. For questions about ESRS requirements or measurement methodology, contact the{' '}
          <a
            href={HELP_DESK}
            className="font-medium text-clay underline underline-offset-4 hover:text-ink"
          >
            EHS Help Desk
          </a>
          .
        </p>
      </Card>

      <div className="mt-10">
        <Button size="lg" onClick={onRestart} className="w-full sm:w-auto">
          Start another submission
        </Button>
      </div>
    </FlowShell>
  )
}
