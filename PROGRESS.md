# PROGRESS — The Corporate Supplier Sustainability Portal 2026

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 0 — build not started
**Last updated:** 4 September 2026 — by Project Governor, pre-build
**Live URL:** none yet [Rule: fill in after the first successful deploy]

## Current state
v1.0 exists in the repo as a static `index.html` — a single-page site with an outbound EcoVadis link, a template download, and a mailto. It was never built through this pipeline, so there is no prior build state to preserve. Nothing from v2.0 is built.
Repo root also holds CLAUDE.md, PROGRESS.md, the product spec, the data-leaf-brand skill file (installed in session 1), the questionnaire template, two policy PDFs, and several background reference documents.
[Rule: this section describes what exists and works right now — never what is planned. Completed checklist items get absorbed here in compressed form.]

## Last session
None — the first v2.0 build session has not happened yet.
[Rule: 3–5 lines maximum. Replace each session — what was built, changed, or fixed.]

## Remaining work
- [ ] First Session Setup: create docs/ and public/assets/, move reference files, install the data-leaf-brand skill, commit (see CLAUDE.md Session Protocol)
- [ ] Scaffold React + Vite + Tailwind + shadcn/ui, add SheetJS, retire the v1.0 static index.html
- [ ] Build View 1 — landing page: nav, hero with stats and the new "Go to step 1" button, Why We Are Asking, Two Routes, What Happens Next timeline, Key Resources, footer
- [ ] Draft the "Why We Are Asking" body copy in the Data Leaf voice — builder reviews before deployment
- [ ] Build View 2 — Path A door chooser (EcoVadis: upload or enter details)
- [ ] Build View 3a — Path A door one: scorecard attachment plus the five headline fields
- [ ] Build View 3b — Path A door two: the nine EcoVadis questions in-page
- [ ] Build View 4 — Path B door chooser (full assessment: fill here or download and upload)
- [ ] Build View 5 — guided assessment form, eight steps (S1–S7 plus Declaration), all 33 fields with notes fields and back/next
- [ ] Build View 6 — download panel, upload parser with the five validation checks, and the editable review table
- [ ] Wire the Export arm: "Download Assessment" serves the blank template from /assets/ inside View 6
- [ ] Build View 7 — on-screen confirmation summary with the per-door answered count and timestamp
- [ ] Apply the PFAS and water-stress conditional rules identically in View 5 and View 6
- [ ] Add the transparency notice above every submit control and on the confirmation screen, worded exactly as spec Section 7
- [ ] Local test pass — every view, plus the upload flow with the real template as .xlsx and as a .csv export, and at least one file that must be rejected
- [ ] Acceptance criteria pass — verify all 23 criteria in spec Section 13 before deploy
- [ ] Deploy to Netlify — push to main; builder confirms the live URL
[Rule: completed items leave this list and are absorbed into Current state. This list only shrinks.]

## Build decisions
None yet.
[Rule: one line per decision made during the build that is not in the spec — prompt structures, field formats, naming choices, library picks. Future sessions depend on these to stay consistent.]

## Known issues
- No Data Leaf logo file. The wordmark renders as DM Sans Medium type in Deep Space Blue — flag for replacement if a logo arrives.
- "Why We Are Asking" body copy is written by Claude Code and needs builder review before the first deployment.
- EcoVadis badge options ship as None / Committed / Other. The source file lists no options — confirm with The Corporate if it matters.
- The three tolerated template defects are handled in the parser, not fixed in the shipped .xlsx. If the template is ever corrected, the parser's question-text list must be updated to match.
- Two reference filenames were partially obscured when the repo was reviewed — confirm exact filenames at First Session Setup before writing any asset path.
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Notes for next session
None.
[Rule: the builder writes here between sessions. Claude Code reads these aloud at session start, acts on them, then clears this section.]
