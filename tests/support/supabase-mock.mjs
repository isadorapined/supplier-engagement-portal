// Intercepts the two Supabase calls a submit makes, so the browser suites can
// drive a full submission without a live database.
//
// It also records every request body, which is how acceptance criterion 11 is
// checked now that the page legitimately does talk to the network: the test
// can no longer assert "no request leaves the page", so it asserts instead
// that the requests which do leave carry no file content.

const COMPANY_ID = '00000000-0000-0000-0000-0000000000aa'

// v3.1 — the verified supplier every suite submits as. The address matches
// the one fillIdentity used to type, so the suites' assertions on the
// contact email still hold now that the field is pre-filled and locked.
export const VERIFIED_EMAIL = 'marta.vogel@northwind-components.de'
const VERIFIED_USER_ID = '00000000-0000-0000-0000-0000000000bb'

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
function fakeJwt(email) {
  const now = Math.floor(Date.now() / 1000)
  return [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: VERIFIED_USER_ID, email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 }),
    'signature',
  ].join('.')
}

/**
 * @param page          a Playwright page
 * @param options.fail  when true, both endpoints return 500 so the suite can
 *                      exercise the spec 9.5 failure path
 * @returns { calls, supabaseRequests, setFail }
 */
export async function mockSupabase(page, options = {}) {
  const state = { fail: Boolean(options.fail), otpStatus: 200, email: VERIFIED_EMAIL }
  const calls = []

  await page.route('**/rest/v1/rpc/resolve_company*', async (route) => {
    const body = route.request().postData()
    calls.push({ kind: 'resolve_company', body })
    if (state.fail) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(COMPANY_ID),
    })
  })

  await page.route('**/rest/v1/submissions*', async (route) => {
    const body = route.request().postData()
    calls.push({ kind: 'submissions', body })
    if (state.fail) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '[]',
    })
  })

  // Supabase Auth. /otp is the magic-link request; /user is what supabase-js
  // calls to confirm the token a link returned; /logout ends the session
  // after a submission is saved.
  await page.route('**/auth/v1/otp*', async (route) => {
    const body = route.request().postData()
    calls.push({ kind: 'otp', body })
    if (state.otpStatus !== 200) {
      return route.fulfill({
        status: state.otpStatus,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(
          state.otpStatus === 429
            ? { code: 429, error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }
            : { code: state.otpStatus, error_code: 'unexpected_failure', msg: 'Error sending magic link email' },
        ),
      })
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' })
  })

  await page.route('**/auth/v1/user*', async (route) => {
    calls.push({ kind: 'user' })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        id: VERIFIED_USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: state.email,
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: new Date().toISOString(),
      }),
    })
  })

  await page.route('**/auth/v1/logout*', async (route) => {
    calls.push({ kind: 'logout' })
    await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' })
  })

  return {
    calls,
    COMPANY_ID,
    VERIFIED_USER_ID,
    setOtpStatus: (value) => { state.otpStatus = value },
    writes: () => calls.filter((c) => c.kind === 'resolve_company' || c.kind === 'submissions').length,
    otpRequests: () => calls.filter((c) => c.kind === 'otp').map((c) => JSON.parse(c.body)),
    // Arrive the way a clicked magic link does: the portal URL with a session
    // in the fragment. Resolves once Path Selection is on screen.
    verify: async (base, email = VERIFIED_EMAIL) => {
      state.email = email
      const token = fakeJwt(email)
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      // A fresh document every time: a goto that changes only the fragment
      // would not reload the app, and the link must be read on load.
      await page.goto('about:blank')
      await page.goto(
        `${base}/#access_token=${token}&expires_at=${expiresAt}&expires_in=3600&refresh_token=mock-refresh&token_type=bearer&type=magiclink`,
        { waitUntil: 'networkidle' },
      )
      await page.getByRole('heading', { name: 'Step 1 — Choose a path.' }).waitFor()
    },
    setFail: (value) => { state.fail = value },
    reset: () => { calls.length = 0 },
    lastSubmission: () => {
      const row = [...calls].reverse().find((c) => c.kind === 'submissions')
      return row ? JSON.parse(row.body) : null
    },
    lastCompany: () => {
      const row = [...calls].reverse().find((c) => c.kind === 'resolve_company')
      return row ? JSON.parse(row.body) : null
    },
  }
}

// The four free-text identity fields, filled on whatever door's Step 1 is on
// screen. The fifth, contactEmail, is pre-filled from the verified session and
// read-only (v3.1, criterion 26), so it is returned but never typed.
export async function fillIdentity(page, over = {}) {
  const values = {
    company: 'Northwind Components GmbH',
    registeredCountry: 'Germany',
    contactName: 'Marta Vogel',
    contactTitle: 'Head of Sustainability',
    ...over,
  }
  for (const [key, value] of Object.entries(values)) {
    await page.fill(`[data-identity="${key}"]`, value)
  }
  return { ...values, contactEmail: VERIFIED_EMAIL }
}
