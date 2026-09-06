# The Corporate Supplier Sustainability Portal 2026

## Identity
A public single-page portal where Tier 1 supplier contacts complete and submit The Corporate's ESRS-aligned 2026 sustainability assessment inside the page, reached by a direct URL with no login.
Tier: 1 — public page, answers live in browser state for the visit only and are discarded when the tab closes; Netlify only, no database (D2+A1)
Spec version governed: v2.1 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone. This build is a visual-direction iteration over the built v2.0. The data model, access model, arms, views, question set, validation, and logic are unchanged from v2.0; everything that changes in v2.1 is visual and is specified in spec Section 10.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. Run Repo Setup Check below before any build work.

Save point — after completing any module, feature, or fix:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. Commit and push to main.
3. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

Repo Setup Check (verify, then act only on what is missing — most of this was done in session 1):
1. docs/ exists and holds product-spec.md at v2.1, the retired v1.0 page as v1-index.html, and the background documents. If a newer spec file sits in the root under another name, confirm which file it is with the builder before moving or renaming it.
2. The brand skill is installed at .claude/skills/data-leaf-brand/SKILL.md.
3. public/assets/ holds the questionnaire template and the two policy PDFs. Confirm every filename by reading it off disk; never hardcode an unverified asset path.
4. Nothing that is already in place is moved, renamed, or recreated. Announce anything you did change, then commit and push before building.

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
- v1.0 does not carry forward. The static `index.html` is retired; no v1.0 markup or styles are reused.
- The Corporate's visual identity is removed entirely: no Playfair Display, no Acid Lime, no Ink/Stone/Linen, no boxed monogram, no black pill label — nowhere in the build. The Corporate is named as the programme owner in copy only; Data Leaf is the platform.
- Read spec Section 10 in full before writing any markup. It is binding. Where a screen in Section 8 names a colour it is repeating a Section 10 rule, never an exception to it.

## Brand
Brand is governed by the data-leaf-brand skill at .claude/skills/data-leaf-brand/SKILL.md. Invoke it for any UI, copy, or visual work, and use its `tokens.css` as the source of the CSS custom properties rather than retyping hex values. Colour roles below are the v2.1 assignments and hold even if the skill is not loaded:
- `#EEF4F0` Mint Cream — default page background, light sections, input field backgrounds, and all text sitting on a dark surface.
- `#DAD9D9` Silver — form containers and panels, hero stat cards, the "Why We Are Asking" section background, body text inside dark cards, timeline hover background, inactive progress steps.
- `#0B3142` Deep Space Blue — all text and headings on light backgrounds, the hero band, and all six path and door card backgrounds.
- `#37663E` Deep Teal — section markers and ESRS references, input bottom borders, the "Why We Are Asking" paragraph left borders, checkbox accents, and every form submit button.
- `#B35634` Burnt Clay — navigation and CTA buttons, breadcrumbs, links, "(required)" tags, validation and conditional notices, the active progress step.
- Never white backgrounds, never Tailwind blue or gray defaults, no dark mode or theme toggle.
- Type: DM Sans Medium (500) for headings and stat figures, Inter Regular (400) for all body text, labels, questions, and table content. Both from the Google Fonts CDN.
- Voice, including error messages and button labels: analytical, trustworthy, light. No hype, no alarmism, no exclamation points, no emoji. Short declarative sentences. No logo file exists — render "Data Leaf" as a DM Sans Medium wordmark in Deep Space Blue and flag it for replacement.

## Business Rules — visual (v2.1, spec Section 10)
- The hero is the only full-width dark band on the landing page: Deep Space Blue, Silver overline, Mint Cream H1 and body, four rounded Silver stat cards with Deep Space Blue figures and labels, the Scope 3 note sitting bare on the band, and the Burnt Clay "Go to step 1" button beneath both. Do not repeat the dark band anywhere else.
- One dark card treatment covers six cards — the two Step 1 path cards and the door cards in Views 2 and 4: Deep Space Blue card on a Mint Cream section, rounded corners, Silver overline, Mint Cream heading, Silver body, Burnt Clay button. Key Resources cards and the timeline steps keep their v2.0 light treatment.
- One form treatment covers every form surface — Views 3a, 3b, 5, 6, and the View 7 summary panel: Silver container on a Mint Cream page, Mint Cream input fields with a Deep Teal bottom border only. No full border, no outline, no box shadow on any input.
- Button colour follows behaviour, not wording: Deep Teal for anything that submits a form, Burnt Clay for anything that navigates, opens, downloads, or resets, plain Deep Space Blue text for every Back. "Submit EcoVadis Scorecard" is Burnt Clay because it opens View 2.
- "Why We Are Asking." carries a full stop, a Deep Teal overline above it, and three visually separated paragraphs, each with a thick Deep Teal left border directly on the Silver section — no cards, no numbering, no clipping. Claude Code drafts the copy in the Data Leaf voice covering ESRS/CSRD context, the 71% Scope 3 exposure, and shared responsibility; the builder reviews before deploy.
- The path chooser heading reads "Step 1 — Choose a path." The v2.0 wording "Two Routes. One Destination." appears nowhere in the build. Key Resources closes with a full stop.
- Timeline steps transition their background to Silver over roughly 200ms on hover — background only, nothing moves, scales, or changes colour. No tap substitute on touch. No other animation beyond the hero smooth scroll.
- Notices and states are Burnt Clay body text with no panel and no icon: upload rejections, field validation, the PFAS and water-stress notices, the "Not answered" marker, and the active progress step.

## Business Rules — logic (unchanged from v2.0)
- Upload validation runs the five checks of spec 9.1 in order; the first failure stops the process and shows that check's exact message. No partial data carries forward from a rejection. Files over 10 MB are rejected. Selecting a second file replaces the first entirely.
- Three tolerated template defects (spec 9.1): match the "Specify source" row by its question text, not its `S5` section tag; treat missing columns E and F on the "Specify scope 3 categories" row as empty, not as a structural mismatch; accept whatever text a supplier typed against a dropdown question, verbatim — never reject an answer for not matching an option list.
- On a valid upload, read columns E and F for the thirty question rows. Column G (Status) is ignored entirely; rows 1–4 and section header rows are skipped. An empty or fully blank template passes validation and lands on the review table with every answer marked "Not answered".
- PFAS conditional: S3-2 "Yes" shows the risk-review notice and makes S3-3 required; "Under investigation" shows the notice with its own wording and S3-3 stays optional; "No" shows no notice. Water-stress conditional: S4-3 "Yes" makes S4-5 required. Both behave identically in the guided form and in the upload review table.
- Blank answers outside S1 and the two conditionals are valid — a genuine gap must never block a submission. Submit gating is per door, per spec 9.3; a blocked submission names the fields needing attention and jumps to the section holding the first of them.
- Answered-question denominators: 33 for the guided form, 30 for the upload review, 9 for the EcoVadis form, and no count for the EcoVadis upload door. A question counts as answered if its response field holds any non-whitespace character; notes fields never count. The timestamp is local, formatted "4 September 2026, 14:32".
- Correct the source template's spelling in the UI — "received" and "cycle". In the guided form, "Specify source" is S4-2 inside Water & Marine Resources, and "Specify scope 3 categories" is S2-4 with a working long-text field.
- The transparency notice from spec Section 7 appears above every submit control and on the confirmation screen, worded exactly as written — never reworded, never a modal, never a checkbox.
- "Go to step 1" smooth-scrolls to "Step 1 — Choose a path." and does nothing else. "Start another submission" clears all session state. "View Document" and "View Policy" point at the two policy PDFs in /assets/ — both files were supplied, which supersedes the `#` placeholder in the spec's open questions.

Out of scope — do not build:
- Any persistence or delivery of a submission: database storage, email, webhook, API, or file drop.
- Any export or download of the supplier's own answers; supplier accounts; save and resume; an internal EHS review dashboard; a Tier 1 response-rate tracker.
- AI scoring or gap analysis, automated EcoVadis validation, or reading the uploaded scorecard PDF's contents.
- Dark mode, theme switching, or any user-selectable colour scheme. Any animation beyond the hero smooth scroll and the 200ms timeline hover — no scroll reveals, parallax, entrance animations, or card motion.

## Reference Docs
Read before building the related part:
- docs/product-spec.md — authoritative question sets, view-by-view UI detail, validation rules, and the 35 acceptance criteria. Section 8 carries the full 33-field guided form and the nine EcoVadis questions; Section 10 carries the binding v2.1 visual specification.
- .claude/skills/data-leaf-brand/SKILL.md — full brand system and tokens.css
- public/assets/ — the questionnaire template the parser validates against. Derive the parser's question-text list by reading that file off disk; never transcribe it from memory.
PROGRESS.md in the root is read at every session start per the Session Protocol.
