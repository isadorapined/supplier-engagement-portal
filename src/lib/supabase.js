import { createClient } from '@supabase/supabase-js'

// Spec Section 11. Both values are Netlify environment variables, inlined into
// the client bundle by Vite at build time. The anon key is public by design —
// it is visible to anyone who opens the page. It is safe only because RLS is
// enabled on every table: after v3.1, anon has no policy and no table grant on
// either portal table. The service role key is never read by this build and
// must never appear here.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A missing variable is a deployment mistake, not a supplier's problem. Fail
// loudly in the console, and let the callers report it as a failure rather
// than throwing somewhere the supplier cannot see.
export const isConfigured = Boolean(url && anonKey)

if (!isConfigured && import.meta.env.DEV) {
  console.error(
    'Supabase is not configured. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

// What the magic link brought back, read before the client below consumes
// and clears the URL. Supabase Auth returns to the portal with either a
// session (#access_token=…) or an error (#error=…&error_code=otp_expired) in
// the fragment, occasionally in the query string instead.
function readLanding() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  if (params.get('error') || params.get('error_code') || query.get('error') || query.get('error_code')) {
    return 'error'
  }
  if (params.get('access_token')) return 'session'
  return null
}

export const landedWith = readLanding()

// v3.1 — magic link (passwordless). Spec v3.1 Sections 6 and 12:
//   - persistSession: false. Each verification gates one submission attempt;
//     it is not an account, and nothing is kept in the browser between
//     visits. The session lives in memory for this tab only.
//   - autoRefreshToken: true. The access token lasts an hour and a full
//     assessment can take longer; refreshing in memory keeps the submit from
//     failing on an expired token.
//   - detectSessionInUrl + implicit flow. The link returns the session in the
//     URL fragment, so no code verifier has to be stored before the email is
//     sent.
export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    })
  : null
