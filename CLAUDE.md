# The Corporate Supplier Sustainability Portal 2026

## Identity
A public single-page portal where Tier 1 supplier contacts complete and submit The Corporate's ESRS-aligned 2026 sustainability assessment inside the page, reached by a direct URL with no login. Every submission is now persisted to a Supabase database, linked to a reusable company record, so The Corporate can review it after the fact.
Tier: 2 — public submission form, no login required, submissions persist to Supabase (D3+A1)
Spec version governed: v3.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone — its own Supabase project, not part of a stack.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table or policy change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only — already completed for this project: docs/ created, data-leaf-brand installed at .claude/skills/data-leaf-brand/).

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · shadcn/ui · Netlify · Supabase. SheetJS (`xlsx`) as an npm dependency for browser-side spreadsheet parsing — bundled at build time, never a server call.
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is not active — the builder owns the Netlify dashboard and enters environment variables there; remind them before the first deploy.

## Arms
Export — browser only, no server function — XLSX: the blank official questionnaire template served as a static asset from /assets/ through an anchor with the `download` attribute. Nothing is generated at runtime and no supplier data is ever written into it.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var
A Supabase service role key is also created with the project but has no active use case in this build — it is never read by the frontend and is not wired into any function. Key storage follows function placement: Netlify Functions read Netlify environment variables. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "the-corporate-supplier-portal" — does not exist yet. At the start of the next build session, confirm this name with the builder, then create the project via Supabase MCP before building anything else. Plan: Free — pauses after roughly a week without traffic; acceptable for this class/portfolio context, not a live client deployment.

Build this schema — authoritative until docs/supabase-setup.md exists:
companies: legal_name, registered_country, contact_name, contact_title, contact_email, created_at, updated_at
submissions: company_id (FK → companies.id), path, door, answers (JSON, keyed by question id), attached_file_name, attached_file_size, signatory_name, declaration_date, submitted_at

RLS — build these policies, never skip: `companies` — anon key: select (to look up by legal_name), insert, update; no delete. `submissions` — anon key: insert-only; no select, update, or delete.

After setup, write docs/supabase-setup.md and update it at every save point that touches the database. It must contain: project name, project ID, project URL, plan, every table with field names and types, RLS policies per table, notes for future sessions, and a last-updated line with date and session number. From the moment it exists, that file is the schema source of truth.

## Hard Rules
- API keys never in any frontend file or GitHub commit. Always called through the Supabase client using the anon key only.
- Netlify Identity: never. Supabase Auth is the only authentication system that may ever be added to this stack — not built in this version.
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- The EcoVadis PDF and the uploaded/downloaded workbook are never uploaded to Supabase Storage or any server. Only filename and size are recorded, on the `submissions` row.
- Company matching at submit time: look up `companies` by `legal_name`, case-insensitive, leading/trailing whitespace ignored. On a match, reuse that `company_id` and overwrite `registered_country`, `contact_name`, `contact_title`, `contact_email`, and `updated_at`. On no match, insert a new row. Never attempt fuzzy matching.
- No login, no roles, no per-supplier data isolation is built in this version.

## Brand
Brand is governed by the data-leaf-brand skill at .claude/skills/data-leaf-brand/SKILL.md. Invoke it for any UI, copy, or visual work, and use its `tokens.css` as the source of CSS custom properties rather than retyping hex values. Colour roles below hold even if the skill is not loaded:
- `#EEF4F0` Mint Cream — default page background, light sections, input field backgrounds, and all text sitting on a dark surface.
- `#DAD9D9` Silver — form containers and panels, hero stat cards, the "Why We Are Asking" section background, body text inside dark cards, timeline hover background, inactive progress steps.
- `#0B3142` Deep Space Blue — all text and headings on light backgrounds, the hero band, and all six path and door card backgrounds.
- `#37663E` Deep Teal — section markers and ESRS references, input bottom borders, the "Why We Are Asking" paragraph left borders, checkbox accents, and every form submit button.
- `#B35634` Burnt Clay — navigation and CTA buttons, breadcrumbs, links, "(required)" tags, validation and conditional notices, the active progress step.
- Never white backgrounds, never Tailwind blue or gray defaults, no dark mode or theme toggle.
- Type: DM Sans Medium (500) for headings and stat figures, Inter Regular (400) for all body text, labels, questions, and table content.
- Voice: analytical, trustworthy, light. No hype, no alarmism, no exclamation points, no emoji. Short declarative sentences.

## Business Rules
- Every door (Views 3a, 3b, 5, 6) opens with an identical five-field Company & Contact step — legal name, registered country, contact name, title, email — before any door-specific content. All five required; the contact email must be valid; cannot advance otherwise.
- "S1" is retired as a numbered assessment section. The guided form (View 5) and upload review (View 6) cover the 28 S2–S7 questions only.
- Answered-question denominators: 28 for View 5 and View 6; 9 for View 3b (Q1–Q9); View 3a shows no count — list the three headline fields and the attached filename instead.
- Transparency notice text is exactly "Your information is stored for The Corporate's review." — above every submit control and on the confirmation screen. Never reworded, never a modal, never a checkbox.
- "Start another submission" clears in-browser state only. It never undoes or alters a row already written to Supabase.
- GDPR: not applicable — confirmed class/portfolio project. No consent flow, no deletion mechanism is built.

Out of scope — do not build:
- Any review or admin screen inside the portal — reviewed directly in the Supabase table editor. Login of any kind, for suppliers or The Corporate's team. Save-and-resume for a supplier mid-submission.
- Storage of the actual uploaded/attached files. Any submission notification — email, webhook, or API. Download of the supplier's own completed answers; an internal EHS review dashboard; a Tier 1 response-rate tracker.
- AI scoring or gap analysis; automated EcoVadis validation; reading or parsing the uploaded EcoVadis PDF. Formal GDPR consent flow (checkbox, deletion mechanism).
- Dark mode, theme switching, or any user-selectable colour scheme. Any animation beyond the hero smooth scroll and the 200ms timeline hover.

## Reference Docs
Read before building the related part:
- docs/product-spec.md — authoritative question sets, view-by-view UI detail, validation rules, the 20 acceptance criteria, and v2.1 Section 10's full visual specification (still binding).
- docs/supabase-setup.md — schema source of truth (created in the next build session).
- .claude/skills/data-leaf-brand/SKILL.md — full brand system and tokens.css
PROGRESS.md in the root is read at every session start per the Session Protocol.
