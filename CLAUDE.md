# The Corporate Supplier Sustainability Portal 2026

## Identity
A public single-page portal where Tier 1 supplier contacts complete and submit The Corporate's ESRS-aligned 2026 sustainability assessment inside the page, reached by a direct URL with no login.
Tier: 1 — public page, answers live in browser state for the visit only and are discarded when the tab closes; Netlify only, no database (D2+A1)
Spec version governed: v2.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone. This build is an iteration over v1.0, a static single-page site.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, or fix:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. Commit and push to main.
3. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move the product spec into it as product-spec.md. It sits in the repo root under a different filename — confirm which file it is with the builder before renaming.
2. Install the brand skill: create .claude/skills/data-leaf-brand/ and place the provided brand file there as SKILL.md.
3. Create public/assets/ and move into it the questionnaire template, the Global Environmental Policy PDF, and the Supplier Code of Conduct PDF. Move every other reference document in the root into docs/ as background context — nothing in docs/ other than product-spec.md drives the build, so do not wire any of it into the UI. Confirm every filename by reading it off disk; never hardcode an unverified asset path.
4. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · shadcn/ui · Netlify. SheetJS (`xlsx`) as an npm dependency for browser-side spreadsheet parsing — bundled at build time, never a server call. Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is not active — the builder owns the Netlify dashboard; Claude Code deploys by pushing to main. This tool has no environment variables.

## Arms
Export — browser only, no server function — XLSX: the blank official questionnaire template served as a static asset from /assets/ through an anchor with the `download` attribute. Nothing is generated at runtime and no supplier data is ever written into it.

## Hard Rules
- No database, ever. Do not create a Supabase project, do not add any persistence layer, do not use localStorage or sessionStorage. All state is React state, discarded on tab close.
- Nothing leaves the page. No network request fires on submit — no email, no webhook, no API call, no file upload to a server. A submission ends at the on-screen confirmation. Do not invent a storage or delivery mechanism to "solve" this; it is a deliberate decision for this version and the next version addresses it.
- No email arm in either direction; the Contact EHS `mailto:` is a plain anchor opening the visitor's own mail client — no service, no server, no API key. The uploaded EcoVadis scorecard PDF is never read, parsed, or transmitted. Only its filename and size are displayed.
- v1.0 does not carry forward. The static `index.html` is retired and replaced by the React build; no v1.0 markup or styles are reused.
- The Corporate's visual identity is removed entirely: no Playfair Display, no Acid Lime, no Ink/Stone/Linen, no boxed monogram, no black pill label — nowhere in the build. The Corporate is named as the programme owner in copy only; Data Leaf is the platform.

## Brand
Brand is governed by the data-leaf-brand skill at .claude/skills/data-leaf-brand/SKILL.md (installed in First Session Setup). Invoke it for any UI, copy, or visual work, and use its `tokens.css` as the source of the CSS custom properties rather than retyping hex values.
Hard rules that hold even if the skill is not loaded:
- Colors: `#EEF4F0` Mint Cream background and cards, `#DAD9D9` Silver alternate sections and table rows, `#0B3142` Deep Space Blue all text and headings, `#37663E` Deep Teal secondary accent, `#B35634` Burnt Clay every primary button, link, and the hero overline. Never white backgrounds, never Tailwind blue or gray defaults.
- Type: DM Sans Medium (500) for headings and stat figures, Inter Regular (400) for all body text, labels, questions, and table content. Both from the Google Fonts CDN.
- Voice, including error messages and button labels: analytical, trustworthy, light. No hype, no alarmism, no exclamation points, no emoji. Short declarative sentences. No logo file exists — render "Data Leaf" as a DM Sans Medium wordmark in Deep Space Blue and flag it for replacement.

## Business Rules
- Upload validation runs the five checks of spec 9.1 in order; the first failure stops the process and shows that check's exact message. No partial data carries forward from a rejection. Files over 10 MB are rejected. Selecting a second file replaces the first entirely.
- Three tolerated template defects (spec 9.1): match the "Specify source" row by its question text, not its `S5` section tag; treat missing columns E and F on the "Specify scope 3 categories" row as empty, not as a structural mismatch; accept whatever text a supplier typed against a dropdown question, verbatim — never reject an answer for not matching an option list.
- On a valid upload, read columns E and F for the thirty question rows. Column G (Status) is ignored entirely; rows 1–4 and section header rows are skipped. An empty or fully blank template passes validation and lands on the review table with every answer marked "Not answered".
- PFAS conditional: S3-2 "Yes" shows the risk-review notice and makes S3-3 required; "Under investigation" shows the notice with its own wording and S3-3 stays optional; "No" shows no notice. Water-stress conditional: S4-3 "Yes" makes S4-5 required. Both behave identically in the guided form and in the upload review table.
- Blank answers outside S1 and the two conditionals are valid — a genuine gap must never block a submission. Submit gating is per door, per spec 9.3; a blocked submission names the fields needing attention and jumps to the section holding the first of them.
- Answered-question denominators: 33 for the guided form, 30 for the upload review, 9 for the EcoVadis form, and no count for the EcoVadis upload door. A question counts as answered if its response field holds any non-whitespace character; notes fields never count. The timestamp is local, formatted "4 September 2026, 14:32".
- Correct the source template's spelling in the UI — "received" and "cycle". In the guided form, "Specify source" is S4-2 inside Water & Marine Resources, and "Specify scope 3 categories" is S2-4 with a working long-text field.
- The transparency notice from spec Section 7 appears above every submit control and on the confirmation screen, worded exactly as written — never reworded, never a modal, never a checkbox.
- "Go to step 1" smooth-scrolls to "Two Routes. One Destination." and does nothing else. "Start another submission" clears all session state. "View Document" and "View Policy" open the two policy PDFs in /assets/.

Out of scope — do not build:
- Any persistence or delivery of a submission: database storage, email, webhook, API, or file drop.
- Any export or download of the supplier's own answers; supplier accounts; save and resume; an internal EHS review dashboard; a Tier 1 response-rate tracker.
- AI scoring or gap analysis, automated EcoVadis validation, or reading the uploaded scorecard PDF's contents.

## Reference Docs
Read before building the related part:
- docs/product-spec.md — authoritative question sets, view-by-view UI detail, validation rules, and the 23 acceptance criteria. Section 8 carries the full 33-field guided form and the nine EcoVadis questions; build exactly those, in that order.
- .claude/skills/data-leaf-brand/SKILL.md — full brand system and tokens.css
- public/assets/ — the questionnaire template the parser validates against. Derive the parser's question-text list by reading that file off disk; never transcribe it from memory.
PROGRESS.md in the root is read at every session start per the Session Protocol.
