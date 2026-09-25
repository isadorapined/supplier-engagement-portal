-- v3.1 access phase, part 2 of 2 — CUTOVER. Applied 25 Sep 2026 12:57 UTC,
-- right after the v3.1 portal deployed (Netlify, commit 11b0e4e). From this
-- moment a v3.0 build, which writes as anon, can no longer submit.
-- Per docs/access-matrix.md Section 6, lines 2, 5 and 6, and Section 7 rule 1:
-- anon has no policy and no table grant on either table after this build.

-- Line 2 — the fix this spec makes: anon's INSERT policy goes.
drop policy "anon may insert a submission" on public.submissions;

-- Line 5 — resolve_company() is callable by a verified session only.
revoke execute on function public.resolve_company(text, text, text, text, text) from anon, public;

-- Line 6 — no table grant for anon on either portal table.
revoke all on table public.submissions from anon;
revoke all on table public.companies from anon;
