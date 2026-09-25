# Supabase Setup — The Corporate Supplier Sustainability Portal 2026

> **This file is the schema source of truth.** It supersedes the provisional
> schema in CLAUDE.md from the moment it exists. Update it at every save point
> that touches the database — a table, a column, a policy, or a function.

**Last updated:** 25 September 2026 — session 5 (v3.1 live; both access-phase migrations applied)

---

## Project

| Detail | Value |
|--------|-------|
| Project name | **The Corporate** |
| Project ref / ID | `smnrfopzzzhazkehcqqn` |
| Project URL | `https://smnrfopzzzhazkehcqqn.supabase.co` |
| Region | us-east-1 |
| Postgres | 17.6 |
| Plan | **Free** |
| Organisation | `isadorapined's Org` (`kbhvhskoevzewhgfybfv`) |
| Created | 6 September 2026 |

### Why this project, and not `the-corporate-supplier-portal`

Spec v3.0 §4 and CLAUDE.md both said the project was *new* and should be
created during the build session under the name `the-corporate-supplier-portal`.
When session 3 opened, this project already existed in the builder's
organisation with an empty `public` schema. The builder confirmed reusing it
rather than creating a second one.

The name is also a better fit for the spec's own stated rationale: it wanted a
project "named after the client/organisational context … not after this
specific tool, so it can hold future tools in the same context — including the
v4 login work and any later internal review tool." `The Corporate` is exactly
that; the proposed name was not.

> **Free plan caveat.** The project pauses after roughly a week without
> traffic, and a paused project refuses writes. That is acceptable for a
> class/portfolio build, but it is the most likely cause of a supplier seeing
> the save-failure message in the wild. See *Submit failure* below.

---

## Tables

### `companies`

One row per supplier company, reused across every submission that company
makes. Never readable by the anon key.

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `legal_name` | `text` | no | — | Matched on `lower(btrim(legal_name))` |
| `registered_country` | `text` | no | — | |
| `contact_name` | `text` | no | — | Refreshed on every repeat submission |
| `contact_title` | `text` | no | — | Refreshed on every repeat submission |
| `contact_email` | `text` | no | — | Refreshed on every repeat submission |
| `created_at` | `timestamptz` | no | `now()` | First seen |
| `updated_at` | `timestamptz` | no | `now()` | Set by `resolve_company` on a match |

**Indexes**

- `companies_pkey` — primary key on `id`
- `companies_legal_name_key` — **unique** on `lower(btrim(legal_name))`

That unique index is the spec's matching rule enforced in the database rather
than trusted to the client. It is what makes match-or-insert atomic: two
simultaneous submissions from the same company cannot both insert a row.

### `submissions`

One completed submission per row. A company has many submissions. Insert-only,
and from v3.1 only for a verified session (`authenticated`).

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `company_id` | `uuid` | no | — | FK → `companies.id`, `on delete cascade` |
| `path` | `text` | no | — | Check: `ecovadis` \| `full` |
| `door` | `text` | no | — | Check: `ecovadis_upload` \| `ecovadis_form` \| `assessment_guided` \| `assessment_upload` |
| `answers` | `jsonb` | no | `'{}'` | Keyed by question id. Notes are stored as `<id>__notes`. Identity is never included. |
| `attached_file_name` | `text` | yes | — | Filename only |
| `attached_file_size` | `integer` | yes | — | Bytes; check `>= 0` |
| `signatory_name` | `text` | yes | — | Path B only |
| `declaration_date` | `date` | yes | — | Path B only |
| `submitted_at` | `timestamptz` | no | `now()` | |
| `status` | `text` | no | `'new'` | **Owned by the review dashboard**, not this portal — see *Shared with the review dashboard*. Check: `new` \| `accepted` \| `needs_review` \| `superseded`. The portal never sets it; its INSERT policy requires `'new'`. |
| `verified_user_id` | `uuid` | yes\* | `auth.uid()` | v3.1. FK → `auth.users.id`. The verified session that inserted the row. Never sent by the client. |
| `contact_email` | `text` | yes\* | `auth.email()` | v3.1. The verified session's email. Never sent by the client. |

\* Nullable in the column definition only because three rows written before
v3.1 have no verified identity. Every row inserted through the app is forced
non-null by the INSERT policy (`null = auth.uid()` is never true).
docs/access-matrix.md §5 asks for `not null`; that is deferred until those
three pre-verification rows are removed, after which
`alter column … set not null` can be applied. A `NOT VALID` check was
rejected: Postgres still checks it when an old row is updated, which would
break the dashboard's status changes on those rows.

`contact_email` on `submissions` is also a v3.1 addition the access matrix
implies but its §5 schema delta does not list: the matrix's policy (§6 line 1)
and criterion 28 both check `submissions.contact_email`, and before v3.1 that
column existed only on `companies`.

**Indexes**

- `submissions_pkey` — primary key on `id`
- `submissions_company_id_idx` — on `company_id`
- `submissions_submitted_at_idx` — on `submitted_at desc`

> **No file is ever stored.** `attached_file_name` and `attached_file_size` are
> the only trace of the EcoVadis PDF or the uploaded workbook. Nothing goes to
> Supabase Storage, and the file bytes never leave the browser. Spec §5, §12,
> acceptance criterion 11.

---

## RLS

**RLS is enabled on every table and must never be disabled.** If a query fails,
fix the policy or the query.

> **The spec was wrong about this and was corrected during the build.** v3.0 §6
> originally read "no RLS policies in this version," §14 repeated it, and §2's
> Tier table implied RLS arrives with auth at Tier 3. All three have been
> corrected in `docs/product-spec.md`. RLS is not an authentication feature. The
> anon key ships inside the public JavaScript bundle and the portal URL is
> handed to every Tier 1 supplier, so without RLS any recipient could read,
> alter, or delete every other supplier's submission. RLS is required on any
> table the anon key can reach, at every tier, login or no login.

### Portal policies (this repo)

| Table | Policy | Role | Command | State |
|-------|--------|------|---------|-------|
| `submissions` | `verified supplier may insert own submission` | `authenticated` | `INSERT` with check `contact_email = auth.email() and verified_user_id = auth.uid() and status = 'new'` | live |
| `submissions` | ~~`anon may insert a submission`~~ | `anon` | — | **dropped** at cutover (25 Sep, 12:57 UTC) |

`anon` has no policy and no table grant on `submissions` or `companies`, and
no execute on `resolve_company`.
| `companies` | *(none from the portal — deliberately)* | — | — | — |

The `status = 'new'` term is stricter than access-matrix.md §6 line 1 asks
for. It carries over the condition the dashboard added to the anon policy, so
a supplier cannot insert a row that is already marked as accepted.

`companies` has no portal policy. Before v3.1 that denied anon everything;
supplier contact details were unreadable from the browser and the only route
in was `resolve_company()` below. **This no longer holds for `authenticated`**:
see the next section.

### Dashboard policies (reviewer-scoped since 25 Sep 2026)

| Table | Policy | Role | Command |
|-------|--------|------|---------|
| `companies` | `reviewer may read companies` | `authenticated` | `SELECT` using `app_metadata.role = 'reviewer'` |
| `submissions` | `reviewer may read submissions` | `authenticated` | `SELECT` using `app_metadata.role = 'reviewer'` |
| `submission_status_changes` | `reviewer may read the status log` | `authenticated` | `SELECT` using `app_metadata.role = 'reviewer'` |

The dashboard wrote these as `using (true)` for every `authenticated` session,
back when only its own logins existed. In v3.1 every verified supplier is also
`authenticated`, so on the builder's decision they were rewritten in
`v31_scope_dashboard_access_to_reviewers` to require the JWT claim
`app_metadata.role = 'reviewer'`.

**Reviewers.** The flag lives in `auth.users.raw_app_meta_data`, which only the
service role can write, so a supplier cannot flag themselves. It is set by
hand. Current reviewers: `isadorapined@gmail.com`.

To add a reviewer, run this in the Supabase SQL editor:
```sql
update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"reviewer"}'
 where email = 'someone@example.com';
```
To remove one, subtract the key: `raw_app_meta_data - 'role'`.
The claim reaches the JWT at the reviewer's next sign-in, so they must log out
of the dashboard and back in.

Supabase's linter reports this as `rls_enabled_no_policy` (INFO) — that finding
is expected and intentional here, not a gap to close.

The portal never reads a row back. The confirmation screen (View 7) is rendered
from in-browser state. Do not add a select policy for the portal.

### Verified behaviour — 25 September 2026, with part 2 applied in a rolled-back transaction

Run as SQL with `set role` and `request.jwt.claims`, which puts the same
policies and grants in the path as an API call. The Supabase API was not
reachable from the build container. The full record is in PROGRESS.md.

| Role | Attempt | Result |
|------|---------|--------|
| `anon` | `insert` into `submissions` | refused — `permission denied for table submissions` |
| `anon` | `select` / `delete` on `submissions` | refused — permission denied |
| `anon` | `select` / `insert` / `update` on `companies` | refused — permission denied |
| `anon` | `resolve_company()` | refused — `permission denied for function resolve_company` |
| `authenticated` | `resolve_company()` | allowed |
| `authenticated` | insert with another `contact_email` | refused — `new row violates row-level security policy` |
| `authenticated` | insert with another `verified_user_id` | refused — RLS |
| `authenticated` | insert with `status = 'accepted'` | refused — RLS |
| `authenticated` | insert with defaults (own identity) | allowed |
| `authenticated` | `update` / `delete` on `submissions` or `companies` | 0 rows affected |
| `authenticated` | direct `insert` into `companies` | refused — RLS |
| `authenticated` | `select` from `submissions` | every row visible (dashboard policy); fixed below |
| `authenticated` | `select` from `companies` | every row visible (dashboard policy); fixed below |

**Re-run after `v31_scope_dashboard_access_to_reviewers`** (rolled back):

| Caller | Attempt | Result |
|--------|---------|--------|
| supplier (no reviewer flag) | `select` `submissions` / `companies` / status log | 0 / 0 / 0 rows |
| supplier | `set_submission_status` | refused — only reviewers |
| supplier | own insert | allowed |
| reviewer | `select` `submissions` / `companies` / status log | every row |
| reviewer | `set_submission_status` | past the reviewer check (stopped by the row's own state rule) |

**Re-run against the live state after cutover** (25 Sep, rolled back). `anon`
insert, select and `resolve_company` are all refused with permission denied. A
plain verified supplier's `resolve_company` and own insert are allowed. Its
mismatched-email insert is refused by RLS. Its reads return 0 rows, and its
update and delete affect 0 rows. Every cell passes.

---

## Functions

### `public.resolve_company(p_legal_name, p_registered_country, p_contact_name, p_contact_title, p_contact_email) → uuid`

`SECURITY DEFINER`, `set search_path = public, pg_temp`. Execute is granted to
`authenticated` only; it was revoked from `anon` and `public` at the v3.1
cutover.

Implements spec §5's matching rule server-side:

- Matches on `lower(btrim(legal_name))` — case-insensitive, surrounding
  whitespace ignored. **Never fuzzy.**
- On a match: reuses the row and overwrites `registered_country`,
  `contact_name`, `contact_title`, `contact_email`, and `updated_at`.
- On no match: inserts a new row.
- Returns the company id and nothing else, so no other company's details can
  reach the browser.

Implemented as a single `INSERT … ON CONFLICT … DO UPDATE`, which is what makes
it atomic against concurrent submissions.

The Supabase linter reports `anon_security_definer_function_executable` (WARN)
for this function until part 2 is applied, and
`authenticated_security_definer_function_executable` (WARN) after. The second
is intentional: a verified supplier calling it is the design.

The function's parameters are not checked against `auth.email()`. A verified
supplier can still overwrite an existing company's contact fields by passing a
matching legal name. This is carried over from v3.0 and is on the Backlog
(access-matrix.md §4).

### Dashboard functions (not managed from this repo)

- `set_submission_status(p_submission_id, p_new_status, p_reason)` —
  `SECURITY DEFINER`, execute granted to `authenticated`. Sets `accepted` /
  `needs_review` and logs to `submission_status_changes`. Since 25 Sep 2026
  it raises `DL403` "Only reviewers can change a submission's status." unless
  the caller carries `app_metadata.role = 'reviewer'`. The body is otherwise
  unchanged.
- `supersede_previous_submissions()` — `SECURITY DEFINER` trigger function,
  `AFTER INSERT` on `submissions`. Marks earlier rows from the same company
  and path as `superseded`. Portal inserts fire it. It swallows its own
  errors, so it can never block a submission.

---

## Migrations applied

| Name | What it did |
|------|-------------|
| `v3_companies_submissions_schema` | Both tables, constraints, indexes, comments |
| `v3_rls_and_resolve_company` | RLS on both tables, the submissions insert policy, `resolve_company` |
| `v3_restrict_resolve_company_to_anon` | Revoked execute from `authenticated` (least privilege) |
| `dashboard_v1_*` (six, 18 Sep 2026) | **Review dashboard, not this repo.** `submission_status_changes`, `submissions.status`, the superseding trigger, `set_submission_status`, the three `authenticated` read policies, and `status = 'new'` added to the anon insert policy |
| `v31_verified_supplier_insert_path` (25 Sep 2026) | v3.1 part 1: `submissions.verified_user_id` and `submissions.contact_email`; `authenticated` INSERT policy; execute on `resolve_company` granted to `authenticated`. File: `supabase/migrations/20260925010620_v31_verified_supplier_insert_path.sql` |
| `v31_scope_dashboard_access_to_reviewers` (25 Sep 2026) | The dashboard's three read policies and `set_submission_status` now require `app_metadata.role = 'reviewer'`. Applied on the builder's instruction. File: `supabase/migrations/20260925013409_v31_scope_dashboard_access_to_reviewers.sql` |
| `v31_close_anon_write_path` (25 Sep 2026, 12:57 UTC) | v3.1 part 2, cutover: drops the anon insert policy, revokes `resolve_company` from `anon` and `public`, and revokes all `anon` table grants on `submissions` and `companies`. File: `supabase/migrations/20260925125723_v31_close_anon_write_path.sql` |

---

## Auth (v3.1)

Magic link (passwordless), through Supabase Auth's own mailer. There is no
Email Arm. Settings the portal needs, in Supabase → Authentication:

| Setting | Value | Why |
|---------|-------|-----|
| Email provider | enabled | the magic link |
| Allow new users to sign up | **ON** — safe since the reviewer scoping (25 Sep) | open self-verification is the design; `shouldCreateUser: true` fails without it |
| Site URL | `https://the-corporate-sep.netlify.app` | where a link returns by default — **set, confirmed 25 Sep** |
| Redirect URLs | `https://the-corporate-sep.netlify.app/**`, `http://localhost:5173/**` | the portal passes `emailRedirectTo: <origin>/` and Supabase refuses redirects not listed here — **set, confirmed 25 Sep** |
| Sender | Supabase built-in mailer | **delivers only to members of the Supabase organisation's team**, a few per hour. Fine for testing with the builder's address; real suppliers need a custom SMTP sender (Resend) |

The client uses `flowType: 'implicit'`, `persistSession: false`,
`autoRefreshToken: true`. The session lives in the tab's memory only, and
nothing is written to localStorage. It ends when the submission saves. An
expired or used link returns `#error=…&error_code=otp_expired`, which the
portal shows as Link No Longer Valid.

These settings are shared with the review dashboard, which logs in through
the same Auth.

---

## Environment variables

Set in the **Netlify dashboard** (Site configuration → Environment variables)
before the first deploy, and in `.env.local` for local development. Vite inlines
them into the client bundle at build time.

| Variable | Where to get it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon / publishable key |

The anon key is **public by design** — it ships inside the JavaScript bundle
and anyone can read it. It is safe only because RLS is on. The service role key
is not used by this build and must never appear in a `VITE_` variable, in any
committed file, or anywhere in the frontend.

`.env` and `.env.*` are gitignored (`.env.example` excepted).

---

## Submit failure

There is no database-side retry. If either write fails the portal stays on the
door, keeps every answer on screen, shows the failure notice, and lets the
supplier submit again — spec §9.5. A company row created by a first-half
success with no submission row is acceptable and self-correcting: the next
successful submission from that company matches the same row.

---

## Reviewing submissions

Directly in the Supabase table editor, which uses the service role and bypasses
RLS, or in the separate review dashboard. The portal has no review UI.

A useful starting query:

```sql
select c.legal_name, c.registered_country, c.contact_email,
       s.contact_email as verified_email, s.verified_user_id,
       s.path, s.door, s.status, s.submitted_at, s.answers
from public.submissions s
join public.companies c on c.id = s.company_id
order by s.submitted_at desc;
```

---

## Notes for future sessions

- **Never disable RLS** to unblock a query. Fix the policy or the query.
- **Never add a select policy to `companies`.** If something needs company data,
  add a `SECURITY DEFINER` function that returns only what it needs.
- `resolve_company` execute moved to `authenticated` in v3.1. Part 2 removes
  `anon` at cutover.
- The dashboard's tables, policies and functions share this schema. Portal
  migrations must not alter them without the builder's say-so. The one
  sanctioned change so far is the reviewer scoping (25 Sep).
- `answers` is schemaless by design. Question ids come from
  `src/lib/questions.js`; if those ids ever change, historical rows keep the old
  keys. Prefer adding ids over renaming them.
- Linter, 25 Sep 2026: `anon_security_definer_function_executable` on
  `resolve_company` (cleared by part 2);
  `authenticated_security_definer_function_executable` on `resolve_company`
  and on `set_submission_status` (both intentional; the latter checks the
  reviewer claim itself);
  `auth_leaked_password_protection` (passwords only, i.e. the dashboard's
  login, not the portal's). `rls_enabled_no_policy` on `companies` no longer
  shows, because the dashboard added a read policy.
