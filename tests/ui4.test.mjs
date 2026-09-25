// v3.1 — email verification by magic link. Spec v3.1 Section 13, criteria
// 21–26, and user-stories.md's screen tests for Verify Your Email, Check Your
// Inbox, Link No Longer Valid and the locked contact email. Supabase Auth is
// stubbed (tests/support/supabase-mock.mjs); criteria 27–28 are database
// rules and are checked against the real database, recorded in PROGRESS.md.
import { chromium } from 'playwright'
import { mockSupabase, fillIdentity, VERIFIED_EMAIL } from './support/supabase-mock.mjs'

const BASE = 'http://localhost:4173'
let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`)
}

const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : null) })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))
const sb = await mockSupabase(page)
const heading = async () => page.locator('h2').first().innerText()

// ===== The landing page stays public; the path cards are the gate =====
await page.goto(BASE, { waitUntil: 'networkidle' })
check('landing page is public',
  await page.getByRole('heading', { name: 'Step 1 — Choose a path.' }).isVisible(), true)
await page.getByRole('button', { name: 'Start Full Assessment' }).click()
check('a path card without a session opens Verify Your Email', await heading(), 'Verify your email.')
check('no door is reachable yet', await page.locator('[data-identity]').count(), 0)
await page.getByRole('button', { name: 'Back to the portal' }).click()
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
check('Path A is gated the same way', await heading(), 'Verify your email.')

// ===== Criterion 21 — format checked before any send =====
await page.fill('#verify-email', 'isadorapined@gmail')
await page.getByRole('button', { name: 'Send link' }).click()
check('21 — a malformed address is refused with a plain message',
  (await page.getByRole('alert').innerText()).includes('Enter a valid email address'), true)
check('21 — nothing was sent', sb.otpRequests().length, 0)
check('21 — still on Verify Your Email', await heading(), 'Verify your email.')

// ===== Criterion 22 — a valid address requests a magic link =====
await page.fill('#verify-email', 'isadorapined@gmail.com')
await page.getByRole('button', { name: 'Send link' }).click()
await page.getByRole('heading', { name: 'Check your inbox.' }).waitFor()
const [firstOtp] = sb.otpRequests()
check('22 — one link requested, for the address entered', firstOtp?.email, 'isadorapined@gmail.com')
check('22 — open signup: a first-time address is accepted', firstOtp?.create_user, true)
const inbox = await page.locator('main').innerText()
check('Check Your Inbox names the address', inbox.includes('isadorapined@gmail.com'), true)
check('Check Your Inbox says to open it on this device', inbox.includes('on this device'), true)

// ===== Criterion 25 — resend =====
await page.getByRole('button', { name: 'Send a new link' }).click()
await page.getByText(/A new link was sent to/).waitFor()
check('25 — resend requests a fresh link to the same address',
  sb.otpRequests().map((r) => r.email), ['isadorapined@gmail.com', 'isadorapined@gmail.com'])
sb.setOtpStatus(429)
await page.getByRole('button', { name: 'Send a new link' }).click()
await page.getByText(/Wait a minute/).waitFor()
check('a rate-limited resend says to wait, not a raw error',
  (await page.getByRole('status').innerText()).includes('Wait a minute, then try again'), true)
sb.setOtpStatus(200)
await page.getByRole('button', { name: 'Use a different email' }).click()
check('"Use a different email" returns to email entry', await heading(), 'Verify your email.')
check('the address is kept for correction', await page.inputValue('#verify-email'), 'isadorapined@gmail.com')

// A send the server refuses keeps the supplier on the form, told plainly.
sb.setOtpStatus(500)
await page.getByRole('button', { name: 'Send link' }).click()
await page.getByText(/could not send a link/).waitFor()
check('a failed send stays on Verify Your Email', await heading(), 'Verify your email.')
sb.setOtpStatus(200)

// ===== Criterion 24 — an expired or reused link =====
await page.goto('about:blank')
await page.goto(`${BASE}/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`,
  { waitUntil: 'networkidle' })
check('24 — Link No Longer Valid is shown', await heading(), 'This link is no longer valid.')
check('24 — no raw error text on screen',
  (await page.locator('body').innerText()).includes('otp_expired'), false)
check('24 — the error is cleared from the address bar', new URL(page.url()).hash, '')
await page.getByRole('button', { name: 'Request a new link' }).click()
check('24 — a path back to email entry', await heading(), 'Verify your email.')

await page.goto(`${BASE}/?error=access_denied&error_code=otp_expired`, { waitUntil: 'networkidle' })
check('24 — the query-string form of the error is handled too', await heading(), 'This link is no longer valid.')

// ===== Criterion 23 — a valid link lands on Path Selection =====
await sb.verify(BASE)
check('23 — lands on Path Selection, not the Landing page', [
  await heading(),
  await page.getByRole('heading', { name: 'Key Resources' }).count(),
], ['Step 1 — Choose a path.', 0])
check('23 — the verified address is shown',
  (await page.locator('main').textContent()).includes(`Verified as ${VERIFIED_EMAIL}`), true)
check('23 — the token is cleared from the address bar', new URL(page.url()).hash, '')
check('23 — nothing kept in localStorage or sessionStorage',
  await page.evaluate(() => window.localStorage.length + window.sessionStorage.length), 0)

// Back from a chooser returns to Path Selection while verified.
await page.getByRole('button', { name: 'Start Full Assessment' }).click()
await page.getByRole('button', { name: 'Back to the portal' }).click()
check('a chooser’s Back returns to Path Selection', await heading(), 'Step 1 — Choose a path.')

// ===== Criterion 26 — the contact email is locked, on all four doors =====
const doors = [
  ['Submit EcoVadis Scorecard', 'Upload your scorecard'],
  ['Submit EcoVadis Scorecard', 'Enter your scorecard details'],
  ['Start Full Assessment', 'Fill it in here'],
  ['Start Full Assessment', 'Download and upload'],
]
for (const [pathCard, door] of doors) {
  await sb.verify(BASE)
  await page.getByRole('button', { name: pathCard }).click()
  await page.getByRole('button', { name: door }).click()
  const field = page.locator('[data-identity="contactEmail"]')
  const locked = [await field.inputValue(), await field.evaluate((el) => el.readOnly)]
  await field.press('End')
  await page.keyboard.type('x')
  locked.push(await field.inputValue())
  check(`26 — ${door}: pre-filled, read-only, cannot be typed into`,
    locked, [VERIFIED_EMAIL, true, VERIFIED_EMAIL])
  check(`26 — ${door}: the other four stay free text`,
    await page.locator('[data-identity]:not([readonly])').count(), 4)
}

// ===== Submitting as the verified supplier =====
await sb.verify(BASE)
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Enter your scorecard details' }).click()
await fillIdentity(page)
await page.getByRole('button', { name: 'Next' }).click()
await page.fill('#ev-Q1', '2026-02-11')
await page.fill('#ev-Q2', '2027-02-11')
await page.fill('#ev-Q3', '68')
await page.fill('#ev-Q4', '71')
await page.selectOption('#ev-Q8', 'Silver')
await page.getByRole('button', { name: 'Submit', exact: true }).click()
await page.getByRole('heading', { name: 'Submission complete.' }).waitFor({ timeout: 5000 })
const row = sb.lastSubmission()
check('the insert never claims an identity — the database stamps it',
  ['contact_email', 'verified_user_id'].filter((k) => k in row), [])
check('resolve_company gets the verified address', sb.lastCompany().p_contact_email, VERIFIED_EMAIL)
await page.waitForTimeout(300)
check('the verified session ends once the submission is saved',
  sb.calls.some((c) => c.kind === 'logout'), true)
await page.getByRole('button', { name: 'Start another submission' }).click()
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
check('the next submission verifies afresh', await heading(), 'Verify your email.')

check('no page errors', pageErrors, [])

await browser.close()
console.log(failures === 0 ? '\nAll verification checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
