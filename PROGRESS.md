# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 5 — v3.1 magic link built; dashboard scoped to reviewers; Auth URLs set
**Last updated:** 25 September 2026
**Live URL:** https://the-corporate-sep.netlify.app (Netlify project `the-corporate-sep`, deploys from `main`)
**Stage:** login and access rules together. Built and gate half A run on 25 September 2026. Half A passes after the dashboard was scoped to reviewers. Half B and cutover not done. This stage isn't absorbed into Current state until both gate halves pass.
**Supabase project:** created — ref `smnrfopzzzhazkehcqqn`, URL `https://smnrfopzzzhazkehcqqn.supabase.co`

## Current state
**Live today:** v3.0 on `main`. Every completed submission is written to
Supabase and linked to a reusable company record, with no login in front of
it. Unchanged by this session, because the v3.1 work sits on a branch until
it is merged.

**Built this session, on branch `claude/trusting-johnson-v9p8cq`:** v3.1
email verification.
- The Landing page stays public (builder's choice, 25 Sep). Either path card
  opens **Verify Your Email** when there is no verified session, then
  **Check Your Inbox** (with resend and "use a different email"). The link
  returns straight to a new **Path Selection** screen, not Landing. An expired
  or used link shows **Link No Longer Valid**.
- `contact_email` on the Company & Contact step is pre-filled from the session
  and read-only on all four doors.
- The session is in-memory only, with nothing in localStorage. It ends when a
  submission saves, so "Start another submission" verifies afresh.
- All five suites pass: parser, ui, ui2, ui3, and the new ui4 (verification
  flow, criteria 21–26).

**Database:** v3.1 part 1 is **live** in "The Corporate" (`smnrfopzzzhazkehcqqn`).
It is additive only: `submissions.verified_user_id`, `submissions.contact_email`
(both database-stamped from the session), the `authenticated` INSERT policy,
and `resolve_company` execute for `authenticated`. Part 2 (close anon's write
path) is **written but not applied**, because applying it before the v3.1
portal deploys would stop the live v3.0 portal from submitting.

**The same Supabase project also holds the separate review dashboard**
(migrations `dashboard_v1_*`, 18 Sep): `submissions.status`,
`submission_status_changes`, a superseding trigger, `set_submission_status`,
and `authenticated` read-all policies on `companies`, `submissions` and the
status log. None of it was in docs/supabase-setup.md until this session. It is
documented there now, and was not modified, on the builder's instruction.
docs/supabase-setup.md is the schema source of truth, updated 25 September 2026.

## Last session
Moved the uploaded v3.1 docs into `docs/` (merged as PR #5). Built v3.1: the
three pre-auth screens, Path Selection, the locked contact email, and the
session lifecycle. Applied v3.1 migration part 1 and ran gate half A with
part 2 inside a rolled-back transaction. Every portal rule held. Found that
the review dashboard's `authenticated` read policies let any verified supplier
read every company and submission. Per the builder's instruction the dashboard
was left untouched, and this is now the blocker on turning sign-up on.

## Remaining work
- [x] Netlify environment variables set and inlined by a fresh build; live
      submission confirmed writing to Supabase (session 4)
- [ ] Criterion 20, remainder — template downloads from the deployed site, and
      no 404s. The persistence half is done and verified.
- [ ] Delete the `isa` test company and its submission once no longer needed —
      they are real rows in `companies` and `submissions`
- [ ] Criterion 19 on real devices — mobile layout end to end
- [ ] Run `tests/persistence.test.mjs` with a service role key from an
      unproxied machine (still not exercised here; the live submission covers
      what it was standing in for)
- [ ] Builder reviews the "Why We Are Asking" body copy before deployment
- [ ] Builder confirms or replaces the "PROGRAMME CONTEXT" overline wording
- [ ] Builder reviews the light nav bar sitting above the dark hero band
- [ ] Confirm whether the supplier-facing wordmark should stay "Data Leaf" or
      become The Corporate's — the footer already reads "© 2026 The Corporate"
- [x] Dashboard read policies and `set_submission_status` scoped to
      `app_metadata.role = 'reviewer'`; isadorapined@gmail.com flagged as the
      only reviewer (session 5, builder's decision)
- [x] Supabase Auth URL Configuration: Site URL and both Redirect URLs set
      (builder, confirmed by screenshot, 25 Sep)
- [ ] Builder: log out of the dashboard and back in, so the reviewer claim
      reaches the token (the dashboard looks empty until then)
- [ ] Builder: "Allow new users to sign up" ON (now safe), optional Magic
      Link template rewording
- [ ] Builder decision: custom SMTP (Resend) before real suppliers. The
      built-in mailer reaches only Supabase team members
- [x] (v3.1 revision) Build the three new screens: Verify Your Email, Check
      Your Inbox (with the resend action), Link No Longer Valid; plus Path
      Selection (session 5)
- [x] (v3.1 revision) Update the `CompanyContact` component so `contact_email`
      is sourced from the verified session and read-only on all four doors;
      every other field stays free text (session 5)
- [x] (v3.1 revision) Access phase part 1 — `v31_verified_supplier_insert_path`
      applied: `verified_user_id` + `contact_email` columns, `authenticated`
      INSERT policy, `resolve_company` granted to `authenticated`;
      docs/supabase-setup.md updated (session 5)
- [ ] (v3.1 revision) Access phase part 2 — CUTOVER: apply
      `supabase/pending/v31_close_anon_write_path.sql` via `apply_migration`
      (name `v31_close_anon_write_path`) immediately after the v3.1 portal is
      live on Netlify, move the file into `supabase/migrations/` with its
      version, re-run gate half A against the live state, update
      docs/supabase-setup.md
- [ ] (v3.1 revision) Tighten `verified_user_id` / `contact_email` to
      `not null` once the three pre-verification rows are deleted (they block
      it; see supabase-setup.md)
- [x] (v3.1 revision) GATE, half A (Claude Code) — passes after the reviewer
      scoping (25 Sep, below). Re-run once more after part 2 is live.
- [ ] (v3.1 revision) GATE, half B (Isadora, isadorapined@gmail.com) — verify
      her own email end to end, land on Path Selection (not Landing), complete
      one door, confirm the row in the Supabase table editor carries her
      `contact_email` and a `verified_user_id` matching her `auth.users` row.
      Both halves must pass before this stage deploys.
- [x] (v3.1 revision) Local test pass — ui4 covers the verification flow, an
      expired/reused link, resend, rate limit, and the locked email on all four
      doors; ui/ui2/ui3 updated and green (session 5, Supabase Auth stubbed)
- [ ] (v3.1 revision) Real-email walkthrough once the Auth settings above are
      in place — a real link, a real second click (criterion 24 against real
      Supabase), a real resend
- [ ] (v3.1 revision) Acceptance criteria pass — verify criteria 21–28
      (existing criteria 1–20 already covered)
- [ ] (v3.1 revision) Push to main → Netlify auto-deploys

## Refusal test record
Kept, never cleared. Any future change to a rule re-runs both halves before the
next push.

**25 September 2026 — half A — Claude Code.** Run as SQL against the live
database with `set local role` and `request.jwt.claims` (Isadora's `auth.users`
id and email for `authenticated`). Part 2 was applied inside the same
transaction, and everything was rolled back afterwards; row counts were
confirmed unchanged. The Supabase REST API was not reachable from the build
container.

| Line | Cell | Attempt | Result | Verdict |
|---|---|---|---|---|
| 2 | submissions · create · anon | insert | `permission denied for table submissions` | pass |
| 6 | submissions · read/delete · anon | select, delete | permission denied | pass |
| 6 | companies · any · anon | select, insert, update | permission denied | pass |
| 5 | resolve_company · execute · anon | call | `permission denied for function resolve_company` | pass |
| 5 | resolve_company · execute · Verified Supplier | call | allowed | pass |
| 1 | submissions · create · Verified Supplier | other `contact_email` | `new row violates row-level security policy` | pass |
| 1 | submissions · create · Verified Supplier | other `verified_user_id` | RLS refusal | pass |
| 1 | submissions · create · Verified Supplier | `status = 'accepted'` | RLS refusal | pass |
| 1 | submissions · create · Verified Supplier | own identity (defaults) | allowed | pass |
| 3 | submissions · update/delete · Verified Supplier | update, delete | 0 rows affected | pass |
| 4 | companies · create/update/delete · Verified Supplier | insert / update / delete | RLS refusal / 0 / 0 | pass |
| 3 | submissions · read · Verified Supplier | select | **every row returned** | **FAIL — dashboard policy** |
| 4 | companies · read · Verified Supplier | select | **every row returned** | **FAIL — dashboard policy** |

Not in the matrix but found alongside: `set_submission_status` is executable by
any `authenticated` session, which means any verified supplier once sign-up is
on.

**25 September 2026 — half A re-run — Claude Code**, after
`v31_scope_dashboard_access_to_reviewers`, rolled back. A plain verified
supplier (piff@gmail.com's id, no reviewer flag) reads 0 submissions, 0
companies and 0 status-log rows, and `set_submission_status` is refused with
"Only reviewers can change a submission's status." Its own insert is still
allowed. A reviewer (isadorapined@gmail.com, flagged) reads every row and gets
past the reviewer check. **Lines 3 and 4 now pass: every cell passes.**

**Half B (Isadora):** not yet run. It needs the Auth settings, a resolution of
the blocker, and the deploy.

## Build decisions
- (v3.1) Landing stays public; the path cards are the gate. Builder's choice
  (25 Sep) between that and gating the whole site. A valid link lands on a
  standalone Path Selection screen (the same two cards, one shared
  `PathCards` component), which satisfies criterion 23's "not the Landing
  page".
- (v3.1) Implicit flow, `persistSession: false`, `autoRefreshToken: true`.
  The session comes back in the URL fragment, so nothing has to be stored
  before the email is sent, and nothing is stored after. The token refreshes
  in memory, so an assessment longer than an hour still submits. A reload
  drops the session. That is intended: no persistent sessions.
- (v3.1) The session ends (`signOut({ scope: 'local' })`) as soon as a
  submission saves: one verification, one submission. A failed save keeps the
  session so the retry works.
- (v3.1) `verified_user_id` and `contact_email` are never sent by the client.
  Column defaults `auth.uid()` / `auth.email()` stamp them, and the INSERT
  policy checks them. The mechanism the spec left open (v3.1 §5 point 2) is
  therefore defaults plus `WITH CHECK`, not a trigger or a new SECURITY DEFINER
  function, which keeps `resolve_company` the portal's only one.
- (v3.1) Added `submissions.contact_email`. The matrix's policy and criterion
  28 check it, but before v3.1 it existed only on `companies`.
- (v3.1) Both new columns are nullable. Three pre-verification rows exist, and
  a `NOT VALID` check would break the dashboard's updates to them. The INSERT
  policy makes them non-null for every app insert. Tighten once those rows go.
- (v3.1) The INSERT policy also requires `status = 'new'`. This is stricter
  than the matrix, and matches the condition the dashboard put on the anon
  policy.
- (v3.1) The migration is split in two so the live v3.0 portal is never
  broken. Part 1 (additive) is live. Part 2 (close anon) is applied at
  cutover. `supabase/pending/` holds migrations not yet applied.
- (v3.1) Check Your Inbox's resend reuses the same `signInWithOtp` call.
  Supabase rate-limits repeat requests for the same address (about 60 s). That
  limit shows as a plain "wait a minute" notice, not a raw error.
- Reused the existing Supabase project "The Corporate" rather than creating
  `the-corporate-supplier-portal`. It was already there and empty, and its name
  fits spec §4's own rationale — named for the client context so it can hold
  future tools — better than the proposed name did.
- `companies` has RLS on and no policy, instead of the anon `select` CLAUDE.md
  originally specified. The select would have exposed every supplier's contact
  name, title and email to anyone with the portal URL. A `SECURITY DEFINER`
  function closes that and also makes matching atomic, which a client-side
  select-then-insert cannot: a unique index on `lower(btrim(legal_name))` means
  two simultaneous submissions from one company cannot both insert.
- Submit is async and gated by a ref, not by state. The ref is read before any
  re-render, so a double-click cannot produce two `submissions` rows; the
  `saving` flag in state only drives the disabled button.
- View 7 renders from in-browser state, never a read-back. `submissions` is
  insert-only, so `.insert().select()` is refused by the policy.
- Notes travel inside `answers` as `<id>__notes` rather than in a second
  column. One JSON object holds a door's whole answer set, and the notes can
  never drift away from their question.
- `answers` is filtered to the submitting door's own ids, so a door the
  supplier opened, typed into, and backed out of leaves nothing behind.
- Session state is one object in `App.jsx`; views receive it plus an `update`
  function. No state library, no router — spec Section 8 rules out multi-URL
  routing.
- Answer keys are shared between doors. The 28 questions use the guided field
  ids (`S2-1` … `S7-5`) in both the guided form and the upload review, so the
  9.2 conditionals need no per-door special-casing. The template's two S1 rows
  and their `T1`/`T2` keys are gone entirely — the parser skips those rows.
- The identity field list lives in `questions.js` beside the `resolve_company`
  argument names, so the form and the database call cannot drift apart.
- shadcn/ui components are hand-written into `src/components/ui/` in the shadcn
  idiom (cva variants, a `cn` merge helper) rather than generated by the CLI,
  which needs interactive network access unavailable in the build session.
- Button variants are named for behaviour, not colour — `submit` is Deep Teal,
  `nav` is Burnt Clay, `back` is plain Deep Space Blue text.
- The six choice cards render through one `ChoiceCard` in `Chrome.jsx`.
- Door chooser overlines read "Door one" / "Door two".
- The "What Happens Next" section background moved from Silver to Mint Cream.
- `hoverOnlyWhenSupported` is set in `tailwind.config.js` for the timeline.
- Keyboard focus keeps the Burnt Clay `:focus-visible` outline from
  `index.css`. 10.4's "no outline" governs the resting field, not focus.
- Question ids carry a `data-qid` attribute and identity fields a
  `data-identity` attribute. The tests read those instead of matching on
  Tailwind classes.
- Question texts for the parser are copied verbatim off the workbook, trailing
  spaces and all. `src/lib/questions.js` says so at the top — never tidy them.
- SheetJS is a lazy `import()` inside the parser, so the 429 kB chunk is only
  fetched when a supplier actually opens the upload door.
- `.xlsx` uploads are checked for a ZIP signature before parsing.
- The browser suites stub the two Supabase calls rather than hitting the
  database, so they stay offline and deterministic.
- (v3.1 revision) Magic link, not email+password, chosen for the login: this is
  an open, unvetted-supplier context, not an admin-managed list — magic link
  needs no passwords to manage and fits open signup directly.
- (v3.1 revision) `verified_user_id` added to `submissions` rather than a
  `profiles` table: one undifferentiated role with no admin flag needs no
  profile row, just a durable, non-spoofable link from the row to the session
  that created it.

## Known issues
- **RESOLVED 25 Sep — was: the review dashboard's read policies applied to
  suppliers.** Fixed by scoping to `app_metadata.role = 'reviewer'`
  (supabase-setup.md). Original note kept below for the record.
  `authenticated may read companies`, `authenticated may read submissions`,
  `authenticated may read the status log`, and execute on
  `set_submission_status` are all granted to every `authenticated` session. v3.1
  makes every verified supplier `authenticated`, and sign-up is open by design.
  So a supplier who verifies any email can read every company's contact
  details, every submission and the status history, and can set statuses. The
  rules this build owns all hold; this comes from the dashboard's rules
  alone. Left as-is on the builder's instruction (the dashboard is a separate
  tool). Fix options, for the builder: (a) scope the dashboard's policies and
  function to reviewers only, e.g. an `app_metadata.role = 'reviewer'` claim
  set by hand in Supabase for each dashboard login; or (b) give the portal its
  own Supabase project. Either way, **do not turn on "Allow new users to sign
  up" before this is fixed.** With sign-up off, the portal's magic link works
  only for addresses already in `auth.users`.
- **Supabase's built-in mailer only delivers to members of the Supabase
  organisation's team** (Supabase docs, "Send messages only to pre-authorized
  addresses"), and only a few emails per hour project-wide. Isadora's own
  address works for testing. A real supplier's address gets no email at all
  until a custom SMTP sender (the Resend upgrade path) is configured. So the
  Resend "handover item" is a prerequisite for real suppliers, not an
  optional upgrade. Builder decision pending.
- Supabase's default "Magic Link" email template says "Follow this link to
  login". It can be reworded in the Supabase dashboard (Authentication →
  Emails) to match the portal's voice. It is shared with the dashboard.
- **A corrupted API key value fails with no server-side trace whatsoever.**
  If `VITE_SUPABASE_ANON_KEY` contains any character outside ISO-8859-1 — an
  ellipsis, a smart quote, an en dash — supabase-js throws before the request
  leaves the browser. Always use the Supabase dashboard's copy button, never a
  mouse selection.
- **Netlify env vars are inlined at build time, so a rebuild is mandatory**
  after any change to either Supabase variable — trigger "Deploy project
  without cache". Leave "Contains secret values" unticked on both.
- **Work reaches `main` only by merging a PR, not by pushing.** Treat a save
  point as incomplete until the PR is merged and Netlify has deployed.
- Browser suites need a build with placeholder Supabase variables
  (`VITE_SUPABASE_URL=https://mock-project.supabase.co
  VITE_SUPABASE_ANON_KEY=mock-anon-key npm run build`) so the stubs have a
  host to intercept. See tests/README.md.
- Free plan pauses after roughly a week without traffic, and a paused project
  refuses writes. Most likely real cause of a failed submission.
- No Data Leaf logo file. The wordmark renders as DM Sans Medium type in Deep
  Space Blue — flag for replacement if a logo arrives.
- The nav bar sits directly above the dark hero band; builder review pending.
- The "Why We Are Asking." overline ships with the placeholder wording
  "PROGRAMME CONTEXT" unless the builder replaces it.
- "Why We Are Asking" body copy is drafted by Claude Code and needs builder
  review before the first deployment.
- EcoVadis badge options ship as None / Committed / Other. The source file lists
  no options — confirm with The Corporate if it matters.
- The three tolerated template defects are handled in the parser, not fixed in
  the shipped `.xlsx`. If the template is ever corrected, the `templateText`
  strings in `src/lib/questions.js` must be updated to match.
- The shipped template still contains its two S1 rows. They are simply not read
  any more.
- `xlsx@0.18.5` is still the newest build on the npm registry and carries two
  open advisories. SheetJS's fixed 0.20.x is served only from
  `cdn.sheetjs.com`, which the build environment blocks. Exposure is limited:
  parsing runs on a file the visitor chose themselves, the 10 MB cap is applied
  before any parse, and `sheet_to_json` is called with `header: 1`.
- The v1.0 template row 18 carries an internal note in its NOTES / EVIDENCE cell
  ("AUTO-FLAG: Yes triggers PFAS Risk review"). It parses as that question's
  notes and shows in the review table.
- Supabase's linter (25 Sep): `anon_security_definer_function_executable` on
  `resolve_company` (clears at part 2),
  `authenticated_security_definer_function_executable` on `resolve_company`
  (intentional) and `set_submission_status` (the blocker above), and
  `auth_leaked_password_protection` (the dashboard's password login).
- Playwright 1.63 expects a Chromium build newer than the one installed in the
  build environment; needs `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- Spec revised to v3.1 on 24 September 2026 — CLAUDE.md regenerated by Project
  Governor. Adds email verification (magic link), promotes Tier 2 → Tier 3.
- Supabase's built-in auth mailer (not a Resend-verified domain) has a low
  send rate — explicitly accepted for current testing-scale traffic. Move to a
  verified sending domain if real supplier volume arrives (see Backlog).

## Backlog
- Handover: login upgrade path — same magic link mechanism, moved onto a
  Resend-verified sending domain (~$10/year, one-time domain setup) once real
  supplier volume needs it. Nothing about the flow or the rules changes.
- Cross-device magic link handling (started on one device, opened on another)
  — confirmed acceptable; suppliers are told to open the link on the same
  device they started on.
- Password-based login of any kind, and a Change Password screen — not
  applicable, no passwords exist in this build.
- Any account settings, profile, or "my submissions" screen — not requested;
  a verified session exists only to gate one submission.
- Persistent sessions across return visits — each submission attempt verifies
  fresh; this is not a login suppliers are expected to reuse.
- Restricting who may verify or submit — explicitly out of scope; open signup
  is the whole design (validation, not gatekeeping).
- `resolve_company()`'s own parameters are not checked against `auth.email()`
  — an authenticated caller could still overwrite an existing company's
  contact fields with arbitrary values by passing a matching legal name.
  Pre-existing since v3.0 under `anon`; unaffected by this iteration. Flag for
  a future spec if it ever matters.
- No admin role, no withdraw/reinstate/anonymise mechanism — GDPR confirmed
  not applicable for this class/portfolio project; revisit if that changes.

## Notes for next session
- The v3.1 build is on branch `claude/trusting-johnson-v9p8cq`, not on `main`.
  Do not merge it while the dashboard blocker (Known issues) is open and
  sign-up is on.
- Order at cutover: builder sets the Auth URLs (done) → reviewer fix (done) →
  sign-up ON → merge → Netlify deploys → apply part 2 (`supabase/pending/`) at
  once → re-run half A → Isadora runs half B. Real suppliers additionally need
  custom SMTP.
