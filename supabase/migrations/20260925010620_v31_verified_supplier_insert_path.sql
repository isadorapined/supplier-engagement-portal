-- v3.1 access phase, part 1 of 2 — additive only, so the live v3.0 portal
-- keeps working until the v3.1 build is merged and deployed. Part 2
-- (supabase/pending/v31_close_anon_write_path.sql) removes anon's write path
-- at cutover. Per docs/access-matrix.md Sections 5 and 6, lines 1 and 5.

-- The verifying identity, stamped on the row by the database, not the client.
-- Nullable only because three rows written before verification existed have
-- no identity to carry; every row inserted through the app is forced non-null
-- by the INSERT policy below (null never equals auth.uid() / auth.email()).
alter table public.submissions
  add column verified_user_id uuid default auth.uid() references auth.users(id),
  add column contact_email text default auth.email();

comment on column public.submissions.verified_user_id is
  'auth.uid() of the verified session that inserted the row. Set by default; checked by the INSERT policy. Null only on rows written before v3.1.';
comment on column public.submissions.contact_email is
  'auth.email() of the verified session that inserted the row. Set by default; checked by the INSERT policy. Null only on rows written before v3.1.';

-- Access matrix Section 6, line 1. status = 'new' keeps the condition the
-- existing anon policy already carried, so a supplier cannot insert a row
-- pre-marked as accepted.
create policy "verified supplier may insert own submission"
  on public.submissions
  for insert
  to authenticated
  with check (
    contact_email = auth.email()
    and verified_user_id = auth.uid()
    and status = 'new'
  );

-- Access matrix Section 6, line 5 (grant half; the anon revoke is part 2).
grant execute on function public.resolve_company(text, text, text, text, text) to authenticated;
