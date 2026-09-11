import { createClient } from '@supabase/supabase-js'

// Spec Section 11. Both values are Netlify environment variables, inlined into
// the client bundle by Vite at build time. The anon key is public by design —
// it is visible to anyone who opens the page. It is safe only because RLS is
// enabled on every table and `companies` carries no anon policy at all. The
// service role key is never read by this build and must never appear here.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A missing variable is a deployment mistake, not a supplier's problem. Fail
// loudly in the console, and let submit() report it as a save failure rather
// than throwing somewhere the supplier cannot see.
export const isConfigured = Boolean(url && anonKey)

if (!isConfigured && import.meta.env.DEV) {
  console.error(
    'Supabase is not configured. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

// No auth in this build, so there is no session to persist or refresh and no
// reason to read a token back out of storage. Turning these off keeps the
// promise in Section 7 honest: nothing of the supplier's is kept in the
// browser between visits.
export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null
