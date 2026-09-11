// Intercepts the two Supabase calls a submit makes, so the browser suites can
// drive a full submission without a live database.
//
// It also records every request body, which is how acceptance criterion 11 is
// checked now that the page legitimately does talk to the network: the test
// can no longer assert "no request leaves the page", so it asserts instead
// that the requests which do leave carry no file content.

const COMPANY_ID = '00000000-0000-0000-0000-0000000000aa'

/**
 * @param page          a Playwright page
 * @param options.fail  when true, both endpoints return 500 so the suite can
 *                      exercise the spec 9.5 failure path
 * @returns { calls, supabaseRequests, setFail }
 */
export async function mockSupabase(page, options = {}) {
  const state = { fail: Boolean(options.fail) }
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

  return {
    calls,
    COMPANY_ID,
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

// The five identity fields, filled on whatever door's Step 1 is on screen.
export async function fillIdentity(page, over = {}) {
  const values = {
    company: 'Northwind Components GmbH',
    registeredCountry: 'Germany',
    contactName: 'Marta Vogel',
    contactTitle: 'Head of Sustainability',
    contactEmail: 'marta.vogel@northwind-components.de',
    ...over,
  }
  for (const [key, value] of Object.entries(values)) {
    await page.fill(`[data-identity="${key}"]`, value)
  }
  return values
}
