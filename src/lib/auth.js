import { supabase, isConfigured } from './supabase.js'

// Spec v3.1 Section 8 — the three pre-auth screens call into this file and
// nothing else. The magic-link email itself is sent by Supabase Auth's own
// mailer; there is no Email Arm (v3.1 Section 3).

export const SEND_FAILED_MESSAGE =
  'We could not send a link. Nothing has been sent. Check the address and try again.'

export const RATE_LIMITED_MESSAGE =
  'A link was requested for this address a moment ago. Wait a minute, then try again.'

function isRateLimited(error) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  return error?.status === 429 || text.includes('rate limit') || text.includes('only request this after')
}

/**
 * Ask Supabase Auth to email a magic link. Open signup (v3.1 Section 6):
 * shouldCreateUser is true, so a first-time address is accepted. The link
 * returns to this page, where supabase.js picks the session out of the URL.
 * Resolves to { ok: true } or { ok: false, message }. Never throws.
 */
export async function sendMagicLink(email) {
  if (!isConfigured || !supabase) {
    console.error('Supabase is not configured — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
    return { ok: false, message: SEND_FAILED_MESSAGE }
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      console.error('signInWithOtp failed', error)
      return { ok: false, message: isRateLimited(error) ? RATE_LIMITED_MESSAGE : SEND_FAILED_MESSAGE }
    }
    return { ok: true }
  } catch (error) {
    console.error('signInWithOtp failed', error)
    return { ok: false, message: SEND_FAILED_MESSAGE }
  }
}

// Each verification is one-time per submission attempt (CLAUDE.md, Business
// Rules). Called once a submission is saved, so "Start another submission"
// begins with a fresh verification.
export async function endVerifiedSession() {
  if (!supabase) return
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (error) {
    console.error('signOut failed', error)
  }
}

// Remove the token or error fragment from the address bar so a reload or a
// shared URL does not carry it.
export function clearAuthFromUrl() {
  if (typeof window === 'undefined') return
  if (window.location.hash || window.location.search) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}
