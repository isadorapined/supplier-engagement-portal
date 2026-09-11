# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 4 — traced "submission saved nothing" to the deploy, not the code
**Last updated:** 11 September 2026
**Live URL:** https://the-corporate-sep.netlify.app (Netlify project `the-corporate-sep`, deploys from `main`)

## Current state
v3.0 is built and passing the full local test pass — 49 parser checks and three
browser suites, all green. The tool is now Tier 2: every completed submission
is written to Supabase and linked to a reusable company record.

Database is live in the **existing** Supabase project "The Corporate"
(`smnrfopzzzhazkehcqqn`, us-east-1, Free). `companies` and `submissions` are
built with RLS on both. `companies` carries **no anon policy at all** — supplier
contact details cannot be read from the browser — and all access to it goes
through `resolve_company()`, a `SECURITY DEFINER` function that does the
match-or-insert server-side and returns only a company id. `submissions` is
insert-only. Every one of those restrictions was verified by querying as the
anon role: companies returns 0 rows with rows present, a direct insert is
refused, and anon delete/update affect nothing. docs/supabase-setup.md is the
schema source of truth.

All four doors open with the same five-field Company & Contact step, rendered
from one `CompanyContact` component and gated by one `identityProblems()` — so
criteria 2 and 3 hold by construction rather than by repetition. "S1" is gone as
a numbered section: the guided form is eight steps (Company & Contact, S2–S7,
Declaration), the parser reads 28 rows instead of 30, and both Path B
denominators are 28. View 3a's step 2 is exactly three fields plus the file
picker; View 3b's is exactly Q1–Q9.

The transparency notice now reads "Your information is stored for The
Corporate's review." It changed in the same commit that added the database
write, because either alone makes it false.

Files are still never stored — only filename and size reach the database. The
browser suites now assert that on the request bodies themselves, since the old
"no request leaves the page" assertion stopped being true this version.

## Last session
Builder reported completing a submission on the live site with nothing arriving
in the database. Traced it: the code was never the problem. v3.0 was committed
to `claude/ecstatic-dijkstra-zwahfk` and left sitting in **open PR #2** — never
merged. Netlify deploys from `main`, and `main` was still v2.1, whose `submit()`
sets the confirmation view and fires no network request at all. The supplier saw
a normal confirmation screen; nothing had been sent, exactly as v2.1 was built
to behave. Both tables read 0 rows, consistent.

Verified the database half is sound and needs no work: `companies` and
`submissions` exist with RLS on, `resolve_company()` is SECURITY DEFINER with
EXECUTE granted to `anon`, and the single `submissions` INSERT policy for `anon`
is the only policy in `public` — the intended shape. Builder merged PR #2 during
the session (`main` now at 812c740) and redeployed with both Netlify environment
variables set.

That surfaced a second, unrelated fault. The submission still failed, and the
edge logs showed **no inbound request at all** — not a rejection, nothing. The
browser console named it: `resolve_company failed` carrying
`TypeError: Failed to execute 'set' on 'Headers': String contains non ISO-8859-1
code point.` The variables were configured correctly all along (right names, All
scopes, same value in all deploy contexts); the anon key's *value* carried a
character outside Latin-1, so `Headers.set()` threw while building the `apikey`
header and the request was never sent. Almost certainly an ellipsis picked up by
copying a key from a display that truncates it. Fix is the short
`sb_publishable_...` key copied with the dashboard copy button, then a no-cache
redeploy. **Not yet applied as at this save point** — the published bundle still
carries the corrupted value, confirmed by the 14:50 deploy reporting "all files
already uploaded", i.e. byte-identical output to the previous build.

## Remaining work
- [ ] **Builder: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the
      Netlify dashboard, then trigger a fresh deploy.** Vite inlines both at
      *build* time, so setting them does nothing to a bundle already built —
      it must be "Clear cache and deploy site", not just a save. Without them
      `isConfigured` is false and every submit shows the save-failure notice.
      Values are in docs/supabase-setup.md.
- [ ] Criterion 20 on the deployed site — submissions made live appear in the
      Supabase table editor; template downloads; no 404s
- [ ] Criterion 19 on real devices — mobile layout end to end
- [ ] Run `tests/persistence.test.mjs` with a service role key from an
      unproxied machine (this session's environment blocks the Supabase host,
      so the live HTTP round trip is the one thing not yet exercised)
- [ ] Builder reviews the "Why We Are Asking" body copy before deployment
- [ ] Builder confirms or replaces the "PROGRAMME CONTEXT" overline wording
- [ ] Builder reviews the light nav bar sitting above the dark hero band
- [ ] Confirm whether the supplier-facing wordmark should stay "Data Leaf" or
      become The Corporate's — the footer already reads "© 2026 The Corporate"

## Build decisions
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
  `nav` is Burnt Clay, `back` is plain Deep Space Blue text. The Company &
  Contact step's "Next" is `nav`: it navigates, it does not submit.
- The six choice cards render through one `ChoiceCard` in `Chrome.jsx`. Spec
  10.3 requires the path cards and both door choosers to be the same object.
- Door chooser overlines read "Door one" / "Door two".
- The "What Happens Next" section background moved from Silver to Mint Cream.
- `hoverOnlyWhenSupported` is set in `tailwind.config.js`, which implements
  10.6's "no tap-state substitute on touch" for the timeline.
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
  database, so they stay offline and deterministic — and criterion 11 is now
  checked on the request bodies, which is stronger than the old request count.

## Known issues
- **A corrupted API key value fails with no server-side trace whatsoever.**
  Worth knowing, because the symptom points at the database and the cause is a
  clipboard. If `VITE_SUPABASE_ANON_KEY` contains any character outside
  ISO-8859-1 — an ellipsis, a smart quote, an en dash — supabase-js throws
  `TypeError: Failed to execute 'set' on 'Headers'` while building the `apikey`
  header, *before* the request leaves the browser. Supabase logs stay empty,
  both tables stay at 0 rows, and the supplier sees the ordinary save-failure
  notice. It looks identical to a database or policy problem and is neither.
  The usual source is copying a key from a UI that truncates the display with a
  real `…` character; the Supabase dashboard's API Keys page does exactly that.
  Always use its copy button, never a mouse selection. Diagnosing this took a
  browser console — `submit.js` logs a distinct message for each failure mode,
  so read the console before touching the database.
- **Netlify env vars are inlined at build time, so a rebuild is mandatory.**
  Saving `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` does nothing to a
  bundle that already exists — Vite pastes the values in during `npm run build`.
  After any change to either, trigger "Deploy project without cache" (Netlify's
  new name for "Clear cache and deploy site"). Leave "Contains secret values"
  unticked on both: the anon key is meant to ship inside the bundle, and marking
  it secret can make Netlify's secrets scanner fail the build for finding it.
- **Work reaches `main` only by merging a PR, not by pushing.** CLAUDE.md's save
  point says "commit and push to main", but these sessions push to a `claude/*`
  branch that then needs merging. v3.0 sat unmerged for a day because of this,
  and it is what made a finished build look like a broken database. Treat a save
  point as incomplete until the PR is merged and Netlify has deployed.
- **The live HTTP round trip to Supabase is unverified.** This session's
  environment blocks `smnrfopzzzhazkehcqqn.supabase.co`, so every layer was
  tested but not joined end to end over the wire: the SQL was exercised as the
  anon role through MCP, and the exact request payloads `submit.js` builds were
  captured with the network stubbed and replayed against the database verbatim.
  Both halves pass. Run `tests/persistence.test.mjs` from an unproxied machine,
  or make one live submission after deploying, to close it.
- Free plan pauses after roughly a week without traffic, and a paused project
  refuses writes. Suppliers would see the save-failure notice. Most likely real
  cause of a failed submission.
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
  any more. The template is not reissued, so a supplier completing it offline
  will still fill in identity cells that the portal ignores in favour of the
  Company & Contact step. Worth reissuing the workbook at some point.
- `xlsx@0.18.5` is still the newest build on the npm registry (re-checked this
  session: `latest` resolves to 0.18.5) and carries two open advisories.
  SheetJS's fixed 0.20.x is served only from `cdn.sheetjs.com`, which the build
  environment blocks. Exposure is limited: parsing runs on a file the visitor
  chose themselves, the 10 MB cap is applied before any parse, and
  `sheet_to_json` is called with `header: 1`. Worth revisiting from an
  unproxied machine.
- The v1.0 template row 18 carries an internal note in its NOTES / EVIDENCE cell
  ("AUTO-FLAG: Yes triggers PFAS Risk review"). It parses as that question's
  notes and shows in the review table.
- Supabase's linter reports two findings — `rls_enabled_no_policy` on
  `companies` (INFO) and `anon_security_definer_function_executable` on
  `resolve_company` (WARN). Both are intentional and are the design working.
  See docs/supabase-setup.md before "fixing" either.
- Playwright 1.63 expects a Chromium build newer than the one installed in the
  build environment. The browser suites need
  `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Notes for next session
None.
