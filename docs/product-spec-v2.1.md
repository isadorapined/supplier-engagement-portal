# Product Spec — The Corporate Supplier Sustainability Portal 2026

**Version:** 2.1
**Date:** 6 September 2026
**Author:** Isadora Pineda Stanischeski
**Status:** Confirmed

> v1.0 of this spec was authored by Zyad Hatquai and documented the original static landing page. v2.0 added the in-portal submission flow. This version supersedes both. v2.1 changes the visual direction only — no new views, no new logic, no change to the data or access model.

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Sustainability Portal 2026

**What it does:** A public single-page portal that onboards Tier 1 suppliers into The Corporate's ESRS-aligned 2026 sustainability assessment and lets them complete and submit that assessment inside the page itself — either by filling guided forms on screen or by uploading the completed official Excel template.

**Who uses it:** Tier 1 supplier contacts — sustainability managers, EHS leads, and procurement representatives at supplier organisations — who receive the URL directly from The Corporate's procurement or EHS team.

**Why it exists:** v1.0 routed every supplier *out* of the page: an external link to EcoVadis, a file download, and an email exchange to return the completed questionnaire. That put the burden of collection on The Corporate's inbox and gave the supplier no confirmation that anything had been received. v2.0 keeps the supplier inside the portal from arrival to confirmation. The submission is made in the tool and acknowledged on screen.

**Build status:** Iteration — the previous version is a static single-page site (`supplier_onboarding.html`) with two outbound actions and a mailto link. This build adds four in-page submission doors, a guided multi-section form, an Excel/CSV upload-and-review flow, an on-screen confirmation view, a new in-hero navigation button, and replaces The Corporate's visual identity with the Data Leaf brand.

**What v2.1 adds on top of v2.0:** a dark-hero visual treatment, carded statistics, a rewritten path-chooser heading ("Step 1 — Choose a path."), Deep Space Blue cards across every door chooser, a redesigned form treatment that fixes the low-contrast Mint-Cream-on-Silver problem, a hover state on the What Happens Next timeline, a two-tier button colour hierarchy separating form submits from navigation, and two punctuation corrections. These are visual and interaction decisions made by the builder against live screenshots of the v2.0 build. They are binding on Claude Code and are specified in full in Section 10.

---

## Section 2 — Classification

### Data Model

**Decision:** D2

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | Yes |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | No |

**Reason:** Suppliers now enter answers and attach files inside the portal, but this MVP validates the submission experience only — the answers live in browser state for the length of the visit, are summarised on a confirmation screen, and are discarded when the tab closes. Nothing is written to a database or sent anywhere.

**D3 is triggered if any of the following are true — check all that apply:**
- [ ] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [ ] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

None apply in this build. All six are deliberately deferred — see Section 12.

> **Builder's note, carried deliberately into the build:** because nothing is stored and no email is sent, a supplier who completes all seven sections sends their work nowhere. This is understood and accepted. This build proves the experience; connecting it to a destination is the next version. Claude Code must not invent a storage or delivery mechanism to "solve" this.

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** The portal is distributed to Tier 1 suppliers as a direct link. Any supplier who receives the URL can complete a submission immediately, with no account and no credentials.

---

### If Access Model is A2 — complete both questions

N/A — Access Model is A1.

---

### If Access Model is A3 — define all roles

N/A — Access Model is A1.

---

### Tier

**Tier:** 1

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

D2 + A1 resolves to Tier 1. No Supabase project is created for this build.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool. It has no database at all.

---

## Section 3 — Arms

### AI API Arm

**Active:** No

---

### Export Arm

**Active:** Yes

| Detail | Answer |
|--------|--------|
| Format | XLSX |
| What is exported | The blank official template — `The_Corporate_Supplier_Questionnaire_2026.xlsx` — served as a static asset from `/assets/`. It contains the seven ESRS-mapped sections (S1–S7) and the declaration row. It is not populated server-side and carries no supplier data. It is the file a supplier downloads inside Path B door two, completes offline with colleagues, and uploads back into the portal. |
| PDF design intent | N/A — format is XLSX only. No PDF is generated anywhere in this build. |

> Nothing is exported at the end of a submission. The confirmation screen is on-screen only — there is no download of the supplier's own answers in this version.

---

### Email Arm

**Active:** No

> Explicit build rule: no email is sent by this tool, in either direction, under any circumstance. The `mailto:` link to the EHS Help Desk in Key Resources is a plain anchor that opens the visitor's own mail client — it is not an email arm and involves no server, no service, and no API key.

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind. v1.0 was flat HTML/CSS/JS; this build has four submission doors, a seven-step form with back/next navigation, client-side file parsing, conditional questions, and an editable review table. That is real application state and must not be hand-rolled in a single HTML file. |
| Deployment target | Netlify |
| Netlify MCP | Not active — deployment will be done manually through the Netlify dashboard. The builder connects the GitHub repo to Netlify after the build session; Netlify then deploys on every push to main. |

**Client-side library for reading spreadsheets:** SheetJS (`xlsx`), imported as an npm dependency and bundled. All parsing happens in the browser. No file is uploaded to any server.

**GitHub — pre-build requirement for all Tier 1, 2, and 3 tools:**
The user creates the GitHub repo before the first Claude Code session. The product-spec.md, CLAUDE.md, and PROGRESS.md must be uploaded to the repo root before Claude Code opens. Claude Code assumes the repo exists, commits changes regularly, and pushes to main. It does not create or configure the repo.

---

### CONDITIONAL: Supabase project — only complete if Tier 2 or Tier 3

N/A — this tool is Tier 1. No Supabase project, no `supabase-setup.md`, no database of any kind. Claude Code must not create one.

---

### CONDITIONAL: Only complete if this tool is part of a stack

N/A — standalone.

---

## Section 5 — Data Architecture

N/A — Data Model is D2. No database.

**Session-state inventory — what the tool holds in browser memory during a visit.** This is not a schema. It is listed so Claude Code knows the exact shape of the state object and what the confirmation screen must summarise. All of it is discarded on tab close.

| State | Contents | Source |
|-------|----------|--------|
| `path` | `"ecovadis"` or `"full"` | Supplier's choice at the path chooser |
| `door` | `"upload"` or `"form"` | Supplier's choice within the path |
| `identity` | Company legal name, registered country, contact name, contact title, contact email | Typed by the supplier |
| `ecovadisAnswers` | Nine EcoVadis fields (see Section 8) | Typed by the supplier |
| `ecovadisFile` | One attached file, held in browser memory as a File object. Filename and size are displayed; contents are never parsed or read. | Supplier's file picker |
| `assessmentAnswers` | Thirty question answers plus a per-question optional Notes / Evidence field | Typed in the guided form, or parsed from the uploaded workbook |
| `declaration` | Authorised signatory name, date, accuracy confirmation checkbox | Typed by the supplier |
| `submittedAt` | Timestamp generated at submit | Automatic |

**File storage:** No. The EcoVadis attachment and the uploaded workbook are held in browser memory only. Neither is transmitted, and neither survives the tab.

**Derived or calculated data:** No scoring, no grading, no index. The only derived values are an answered-question count and a submission timestamp, both used on the confirmation screen.

---

## Section 6 — Access and Permissions

N/A — Access Model is A1. No authentication, no roles, no RLS.

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — confirmed during the interview. Personal data is typed into the tool (contact name, title, email, signatory name), but the Data Model is D2: nothing is transmitted, stored, or retained by The Corporate, Data Leaf, or any third party. The data never leaves the supplier's own browser, and no consent flow or deletion mechanism is required for data that is never collected.

**Transparency requirement — build this even though GDPR does not apply.** Because suppliers will type identifying information into forms, the tool must say plainly what happens to it. A short notice appears in two places, in body text, not as a modal or a checkbox:

1. Directly above the submit control on every door.
2. On the confirmation screen.

Exact copy for both:

> Your answers stay in your browser. This portal does not store, transmit, or email anything you enter. Closing this tab clears it.

Styling for this notice is fixed in Section 10.4 — Deep Space Blue body text, Inter Regular, no background panel, no icon.

This is a factual statement about the build, not a legal disclaimer. It must remain accurate — if a future version adds storage, this copy and this section both change.

---

## Section 8 — Screen and UI Structure

The portal is a single-page application. The landing page is a scrolling view; the submission flows replace the page content and return to the landing page when complete. There is no page reload and no multi-URL routing requirement.

> **Reading order for Claude Code:** this section defines *what is on each screen*. Section 10 defines *how every element is coloured and styled*. Where a colour is named inline below, it repeats a rule from Section 10 for convenience — Section 10 is authoritative if the two ever disagree.

---

### View 1 — Landing Page

- **Purpose:** Communicate The Corporate's 2026 supplier programme, explain why the assessment is being asked for, and route each supplier to the correct submission path.

- **What is visible (top to bottom):**

  **Navigation bar**
  - Data Leaf wordmark, left-aligned. No logo file is provided — Claude Code renders the wordmark "Data Leaf" as type, in DM Sans Medium, Deep Space Blue. See Section 15.
  - No additional nav items.

  **Hero section — dark treatment, new in v2.1**
  - The entire hero band has a **Deep Space Blue `#0B3142`** background. It is the only full-width dark band on the landing page.
  - Overline label: "SUPPLIER PROGRAMME 2026" — uppercase, tracked, rendered in **Silver `#DAD9D9`**.
  - H1: "We don't just manufacture products. We engineer a sustainable future." — **Mint Cream `#EEF4F0`**.
  - Body paragraph: "Our 2045 Net-Zero goal is a shared journey. This portal is your starting point — understand what we are asking, why it matters, and which submission path applies to you." — **Mint Cream `#EEF4F0`**.
  - Stats row — **four separate cards** side by side, collapsing to two columns on mobile. Each card has rounded corners, a **Silver `#DAD9D9`** background, and both its figure and its label in **Deep Space Blue `#0B3142`**. The cards sit on the dark hero background; the contrast between card and band is what makes the figures read.
    - 690,000 — tCO₂e Total Footprint (2023, location-based)
    - 71% — Scope 3, Value Chain (location-based, 2023 base year)
    - 2045 — Net-Zero Target Year
    - 500+ — Tier 1 Suppliers
  - Reference note beneath the stat cards, repeated in the footer: "Scope 3 is 71% of the total footprint (location-based, 2023 base year)." — **Mint Cream `#EEF4F0`**, sitting directly on the dark band.
  - **"Go to step 1" button**, positioned at the bottom of this hero section, after the stats row and the reference note. Burnt Clay `#B35634`. Clicking it smooth-scrolls the page to the "Step 1 — Choose a path." section. It performs no other action — it does not open a form, does not select a path, and does not leave the page.

  **Section: Why We Are Asking.**
  - Section background: **Silver `#DAD9D9`**.
  - Overline label above the heading, uppercase and tracked, in **Deep Teal `#37663E`**. Suggested wording: "PROGRAMME CONTEXT". The builder may change the wording; the colour and treatment are fixed.
  - H2: **"Why We Are Asking."** — note the full stop, added in v2.1 so the heading matches the punctuation of "What Happens Next." Deep Space Blue `#0B3142`.
  - Body copy drafted by Claude Code in the Data Leaf voice — analytical, trustworthy, no alarmism, no hype. It must cover three things: the ESRS/CSRD regulatory context; The Corporate's Scope 3 exposure at 71% of total footprint (location-based, 2023 base year); and the shared-responsibility framing of the programme. The builder reviews this copy before deployment.
  - **Layout — left-border highlight strip, new in v2.1.** The copy is set as three paragraphs. Each paragraph carries a thick left border in **Deep Teal `#37663E`** and sits directly on the Silver section background — no cards, no per-paragraph background, no numbering. Paragraph text is **Deep Space Blue `#0B3142`**, Inter Regular, with generous line-height and generous vertical space between the three paragraphs. The three paragraphs must be visually separated from one another; the v2.0 build ran them together and clipped the third, which this layout exists to fix.

  **Section: Step 1 — Choose a path.**
  - Section background: **Mint Cream `#EEF4F0`**.
  - H2: **"Step 1 — Choose a path."** — renamed in v2.1 from "Two Routes. One Destination." The rename ties this section to the "Go to step 1" button in the hero, which scrolls here. Deep Space Blue `#0B3142`, DM Sans Medium.
  - Two cards side by side, stacking on mobile. Both use the **dark card treatment defined in Section 10.3**: Deep Space Blue `#0B3142` background, rounded corners.
    - **Card 1 — EcoVadis path.** Overline label **"PATH A"** — renamed in v2.1 from "ECOVADIS SCORECARD" — in Silver `#DAD9D9`, uppercase, tracked. Card heading "You hold a current EcoVadis scorecard" in Mint Cream `#EEF4F0`. Body in Silver `#DAD9D9`: explains that suppliers holding a valid EcoVadis scorecard issued within the last 12 months may submit their scorecard details and skip the full questionnaire. Button: "Submit EcoVadis Scorecard", Burnt Clay `#B35634` → opens View 2.
    - **Card 2 — Full Assessment path.** Overline label **"PATH B"** — renamed in v2.1 from "FULL QUESTIONNAIRE" — in Silver `#DAD9D9`, uppercase, tracked. Card heading "You do not hold a current scorecard" in Mint Cream `#EEF4F0`. Body in Silver `#DAD9D9`: explains that suppliers without a current EcoVadis scorecard complete the ESRS-aligned assessment, and that they may either fill it in here or download it, complete it internally, and upload it back. Button: "Start Full Assessment", Burnt Clay `#B35634` → opens View 4.
  - Neither path is gated or hidden. The supplier self-selects.

  **Section: What Happens Next.**
  - H2: "What Happens Next."
  - Four-step numbered timeline, horizontal on desktop, vertical on mobile:
    - 01 — Portal Launch — "You receive this link and select your submission path." — April 2026
    - 02 — Data Submission — "Submit scorecard or complete the assessment. 100% Tier 1 response required." — Deadline: 30 Sep 2026
    - 03 — Review & Scoring — "Our EHS and Procurement teams review submissions and flag gaps." — Q4 2026
    - 04 — Partnership Plans — "Joint decarbonisation and improvement plans agreed with prioritised suppliers." — Q1 2027
  - **Hover state, new in v2.1.** Hovering a step card changes that card's background to **Silver `#DAD9D9`**, with a smooth CSS transition of roughly 200ms ease. Only the background changes — the step number, heading, body text, and date all keep their colours and sizes, and nothing moves, scales, or shifts position. The hover is a highlight, not an animation. On touch devices, where hover does not exist, the cards simply render in their resting state; no tap-to-highlight substitute is needed.

  **Section: Key Resources**
  - H2: "Key Resources" with subhead "Everything you need."
  - Three cards, stacking on mobile:
    - **Document** — "Supplier Code of Conduct" — "The Corporate's standards for ethical business conduct, labour rights, and environmental responsibility. All Tier 1 suppliers must have a signed copy on file." — link "View Document" (URL pending, see Section 15).
    - **Policy** — "Global Environmental Policy" — "The Corporate's commitments on climate, water, PFAS, and circular economy — the framework that defines what we expect from our value chain partners." — link "View Policy" (URL pending, see Section 15).
    - **Support** — "EHS Help Desk" — "Questions about specific ESRS requirements, measurement methodology, or technical aspects of the assessment? Contact our Environment, Health & Safety team directly." — link "Contact EHS" → `mailto:sustainability@thecorporate.com?subject=Supplier%20Portal%20Help%20Desk%20Query`.
  - **v2.1 change:** the layout, colours, and card treatment of this section are unchanged. The only change is punctuation — the final sentence of the section closes with a full stop, so that Key Resources matches the sentence punctuation used everywhere else on the page.

  **Footer**
  - Data Leaf wordmark.
  - "© 2026 The Corporate. Confidential — for authorised Tier 1 suppliers only."
  - Repeat of the Scope 3 reference note.

- **User actions:** scroll; click "Go to step 1"; click "Submit EcoVadis Scorecard"; click "Start Full Assessment"; click the two resource links; click "Contact EHS".

- **What happens next:** the two path buttons replace the page content with View 2 or View 4. The resource links and mailto open elsewhere. Everything else stays on this view.

---

### View 2 — Path A: EcoVadis Door Chooser

- **Purpose:** Let the EcoVadis supplier choose how to submit their scorecard.
- **What is visible:** H2 "EcoVadis Scorecard". One sentence confirming that a scorecard must have been issued within the last 12 months. Two door cards, both using the **dark card treatment from Section 10.3** — Deep Space Blue `#0B3142` background, rounded corners, Mint Cream headings, Silver body text, Burnt Clay buttons. This matches the Step 1 path cards exactly, so the supplier sees the same card language at every choice point:
  - **Door 1 — "Upload your scorecard"** — "Attach your EcoVadis scorecard and confirm the headline details."
  - **Door 2 — "Enter your scorecard details"** — "Answer nine questions about your most recent EcoVadis cycle."
  - A "Back" control returning to the landing page.
- **User actions:** choose a door, or go back.
- **What happens next:** opens View 3a or View 3b.

---

### View 3a — Path A Door One: Upload Scorecard

- **Purpose:** Capture the scorecard file plus the five headline values.
- **What is visible:**
  - Breadcrumb "PATH A · DOOR ONE" in Burnt Clay `#B35634`, uppercase, tracked. H2 "Upload your scorecard" in Deep Space Blue `#0B3142`. Intro paragraph in Deep Space Blue `#0B3142`.
  - **The form container uses the form treatment defined in Section 10.4** — Silver `#DAD9D9` container with rounded corners, Mint Cream `#EEF4F0` input fields with a Deep Teal `#37663E` bottom border only. The v2.0 build put Silver-outlined inputs on a Mint Cream page and the fields disappeared into the background; the treatment in Section 10.4 exists to fix that and replaces it everywhere.
  - File picker, accepting PDF. Once a file is chosen, its filename and size are shown with a "Remove" control. The file is held in browser memory and is never read, parsed, or transmitted. The "Choose file" control is a Burnt Clay `#B35634` button.
  - Five fields, all required:

    | Field | Type |
    |-------|------|
    | Company legal name | Text |
    | Primary contact name, title, and email | Three separate fields: name (text), title (text), email (email format) |
    | Publication date | Date |
    | Valid until | Date |
    | Overall EcoVadis score | Number, 0–100 |

  - The transparency notice from Section 7, directly above the submit control.
  - "Submit" — **Deep Teal `#37663E`**, per the button hierarchy in Section 10.5 — and "Back" — plain text, Deep Space Blue `#0B3142`.
- **User actions:** attach a file, fill the fields, submit, or go back.
- **What happens next:** submit opens View 7 (Confirmation).

---

### View 3b — Path A Door Two: EcoVadis Form

- **Purpose:** Capture the full EcoVadis scorecard detail in-page, with no file.
- **What is visible:** the form treatment from Section 10.4 throughout. The identity block (company legal name; contact name, title, email), then the nine EcoVadis questions in order:

  | # | Question | Type |
  |---|----------|------|
  | Q1 | Publication date | Date |
  | Q2 | Valid until | Date |
  | Q3 | Overall EcoVadis score | Number, 0–100 |
  | Q4 | Environment score | Number, 0–100 |
  | Q5 | Labor & Human Rights score | Number, 0–100 |
  | Q6 | Ethics score | Number, 0–100 |
  | Q7 | Sustainable procurement score | Number, 0–100 |
  | Q8 | Did your organisation receive a medal in the last cycle? | Dropdown: None / Bronze / Silver / Gold / Platinum |
  | Q9 | Did your organisation receive a badge in the last cycle? | Dropdown: None / Committed / Other |

  Plus the transparency notice, "Submit" (Deep Teal `#37663E`), and "Back" (plain text).

  > The source file spells Q8 and Q9 as "recieved" and "cicle". Claude Code corrects the spelling in the UI. The corrected wording above is authoritative.

- **User actions:** fill fields, submit, go back.
- **What happens next:** submit opens View 7.

---

### View 4 — Path B: Full Assessment Door Chooser

- **Purpose:** Let the supplier choose between filling the assessment here and completing it offline.
- **What is visible:** H2 "Full Assessment". One sentence noting that the assessment covers seven ESRS-aligned sections and around thirty questions. Two door cards, both using the **dark card treatment from Section 10.3** — identical to View 2 and to the Step 1 path cards:
  - **Door 1 — "Fill it in here"** — "Work through the seven sections one at a time and submit when you're done. Your answers are not saved — set aside enough time to finish in one sitting."
  - **Door 2 — "Download and upload"** — "Download the official template, complete it with your colleagues, and upload it back. Only the official template is accepted."
  - A "Back" control.
- **User actions:** choose a door, or go back.
- **What happens next:** opens View 5 or View 6.

---

### View 5 — Path B Door One: Guided Assessment Form

- **Purpose:** Walk the supplier through S1–S7, one section per screen, ending in the declaration.
- **What is visible:**
  - Breadcrumb "PATH B · DOOR ONE" in Burnt Clay `#B35634`, uppercase, tracked.
  - The current section's heading in Deep Space Blue `#0B3142`, DM Sans Medium, with its ESRS reference beside or beneath it in **Deep Teal `#37663E`**, uppercase and tracked — the same section-marker role Deep Teal plays elsewhere in the build.
  - A progress indicator showing the current section and total (eight steps: S1–S7 plus Declaration). The current step is marked in **Burnt Clay `#B35634`**; completed and upcoming steps are **Silver `#DAD9D9`**; any accompanying text is Deep Space Blue `#0B3142`.
  - The section's questions, inside the **form container treatment from Section 10.4** — Silver container, Mint Cream input fields, Deep Teal bottom borders. Every question shows its ESRS reference in Deep Teal `#37663E` at small size, and its label in Deep Space Blue `#0B3142`. Every question carries an optional "Notes / evidence" free-text field beneath its answer field, mirroring column F of the template.
  - "Back" and "Next" controls. **"Next" is Burnt Clay `#B35634`** — it is navigation, not submission. "Back" on S1 returns to View 4.
  - On the final step: the declaration block and the transparency notice, then **"Submit" in Deep Teal `#37663E`**.
- **Full question set — this is the authoritative list. Claude Code builds exactly these, in this order.**

  **S1 — General Information & EcoVadis Bypass** *(All ESRS · Required)*

  | ID | Question | Type |
  |----|----------|------|
  | S1-1 | Legal name of the responding entity | Text, required |
  | S1-2 | Registered country of the responding entity | Text, required |
  | S1-3 | Primary contact name for this assessment | Text, required |
  | S1-4 | Primary contact job title | Text, required |
  | S1-5 | Primary contact email address | Email format, required |

  > The template combines S1-1/S1-2 into one cell and S1-3/S1-4/S1-5 into another. The guided form splits them into discrete fields for clean validation. The upload parser reads the combined cells and does not attempt to split them — see Section 9.

  **S2 — Climate & Decarbonisation** *(ESRS E1)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S2-1 | E1-4 | Total Scope 1 emissions for last fiscal year (metric tonnes CO₂e). Include verification method. | Long text |
  | S2-2 | E1-4 | Total Scope 2 emissions for last fiscal year — market-based (metric tonnes CO₂e). | Number |
  | S2-3 | E1-4 | Total Scope 3 emissions for last fiscal year (metric tonnes CO₂e). | Number |
  | S2-4 | E1-4 | Specify which Scope 3 categories are included. | Long text |
  | S2-5 | E1-3 | Does your organisation have a Science-Based Target (SBTi) validated decarbonisation target? | Dropdown: Yes — validated / Yes — submitted, awaiting validation / In progress / No |
  | S2-6 | E1-2 | Describe your top three decarbonisation projects currently in progress or planned for the next 24 months. Include estimated tCO₂e reduction and the specific technology being utilised (e.g. electrification of heat, on-site renewables). | Long text |
  | S2-7 | E1-2 | What are the primary technical or financial barriers preventing you from reaching a 50% reduction in Scope 1 and 2 emissions by 2030? | Long text |

  **S3 — Pollution & PFAS** *(ESRS E2)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S3-1 | E2-3 | Total weight of substances of concern (REACH, SVHC list) used in production last fiscal year (kg). | Number |
  | S3-2 | E2-3 | Do any of your products or production processes contain or utilise PFAS compounds ("forever chemicals")? | Dropdown: Yes / No / Under investigation |
  | S3-3 | E2-3 | If your products contain PFAS, detail your substitution roadmap. Have you identified viable non-PFAS alternatives? Provide your target date for a complete phase-out. | Long text — conditionally required, see Section 9 |
  | S3-4 | E2-2 | Describe your industrial wastewater treatment process. What specific measures are in place to ensure zero leakage of hazardous chemicals into local water systems? | Long text |

  **S4 — Water & Marine Resources** *(ESRS E3)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S4-1 | E3-1 | Total water withdrawal last fiscal year (m³). | Number |
  | S4-2 | E3-2 | Specify the primary source of that water withdrawal. | Dropdown: Municipal supply / Groundwater / Surface water / Rainwater harvesting / Seawater or desalinated / Mixed sources |
  | S4-3 | E3-1 | Is your primary production facility located in a high-water-stress region (WRI Aqueduct score ≥ 3)? | Dropdown: Yes / No / Not assessed |
  | S4-4 | E3-2 | Provide details on any water-saving or closed-loop recycling projects implemented at your facility. How has your total water intensity (litres per unit produced) changed over the last three years? | Long text |
  | S4-5 | E3-2 | If your facility is in a high-water-stress region, what is your operational contingency plan for severe drought conditions to ensure supply continuity to The Corporate? | Long text — conditionally required, see Section 9 |

  **S5 — Circular Economy & Waste** *(ESRS E5)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S5-1 | E5-2 | Total waste generated last fiscal year (tonnes). Provide the breakdown: landfill / recycled / energy recovery / hazardous. | Long text |
  | S5-2 | E5-4 | Percentage of post-consumer recycled (PCR) content in the components supplied to The Corporate (%). | Number, 0–100 |
  | S5-3 | E5-3 | How are you incorporating circularity into the specific components you supply to The Corporate? Examples: design for disassembly, modularity, or increasing PCR content. | Long text |
  | S5-4 | E5-2 | Detail your strategy for achieving Zero Waste to Landfill. What are your primary waste streams, and what innovative recycling or upcycling initiatives have you launched recently? | Long text |

  **S6 — Biodiversity & Ecosystems** *(ESRS E4)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S6-1 | E4-2 | Are any of your production sites located within or adjacent to (within 1 km) a protected area or biodiversity hotspot? | Dropdown: Yes / No / Not assessed |
  | S6-2 | E4-3 | Describe any initiatives taken to minimise the impact of your operations on local biodiversity. Include land-use management, native planting schemes, or light/noise pollution reduction. | Long text |
  | S6-3 | E4-5 | Have you undertaken a biodiversity impact assessment (TNFD or equivalent) for your primary production sites? If yes, share key findings. If no, provide your target assessment date. | Long text |

  **S7 — Social, Labour & Governance** *(ESRS S2 · G1)*

  | ID | ESRS | Question | Type |
  |----|------|----------|------|
  | S7-1 | S2-1 | Does your organisation have a formal Human Rights and Labour Rights Policy, aligned with the UN Guiding Principles on Business and Human Rights? | Dropdown: Yes / In development / No |
  | S7-2 | S2-2 | Have you conducted a human rights due diligence assessment of your Tier 1 and Tier 2 supply chains in the last 24 months? | Dropdown: Yes — both tiers / Yes — Tier 1 only / In progress / No |
  | S7-3 | S2-4 | Describe the grievance mechanism available to workers in your supply chain. How many grievances were filed and resolved in the last 12 months? | Long text |
  | S7-4 | G1-1 | Does your organisation have a verified conflict minerals policy (3TG — tin, tantalum, tungsten, gold) in place, including OECD Due Diligence guidance compliance? | Dropdown: Yes / In development / No / Not applicable to our products |
  | S7-5 | G1-2 | Describe your supplier code of conduct and how compliance is monitored across your own supply chain. Include details of any third-party audits conducted in the last 24 months. | Long text |

  **Step 8 — Declaration**

  Fixed text: "I confirm that the information provided in this assessment is accurate and complete to the best of my knowledge." — Deep Space Blue `#0B3142`, Inter Regular.

  | Field | Type |
  |-------|------|
  | Authorised signatory name | Text, required |
  | Date | Date, required, defaults to today |
  | Accuracy confirmation | Checkbox, required — checked-state accent in Deep Teal `#37663E` |

- **User actions:** answer questions, move between sections, submit on the last step, or leave via Back on S1.
- **What happens next:** submit opens View 7.

---

### View 6 — Path B Door Two: Download and Upload

- **Purpose:** Serve the official template and accept it back, completed.
- **What is visible, in this order:**
  1. Breadcrumb "PATH B · DOOR TWO" in Burnt Clay `#B35634`, uppercase, tracked. H2 "Download and upload" in Deep Space Blue `#0B3142`.
  2. **Download panel.** A Silver `#DAD9D9` panel with rounded corners, per Section 10.4. H3 "Step one — download the template" in Deep Space Blue `#0B3142`. Body in Deep Space Blue `#0B3142`: "Complete it with whoever needs to contribute, then come back to this page and upload it." Button "Download Assessment" — **Burnt Clay `#B35634`**, because it is an action that fetches a file rather than a form submission. Downloads `/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx` via an anchor with the `download` attribute. This is the same download button that existed in v1.0; it now lives here.
  3. **Upload panel.** A second Silver `#DAD9D9` panel with rounded corners. H3 "Step two — upload the completed file" in Deep Space Blue `#0B3142`. A file picker accepting `.xlsx` and `.csv`, styled per Section 10.4 — Mint Cream `#EEF4F0` field with a Deep Teal `#37663E` bottom border. Clear body copy: "Only the official template above is accepted. Upload the workbook itself, or its CSV export."
  4. **On a rejected file:** a plain error message naming exactly what failed (see Section 9), in **Burnt Clay `#B35634`** text with no background panel and no icon. The file is cleared and the supplier can try again. No partial data is carried forward from a rejected file.
  5. **On an accepted file:** the view switches to the **review table** — every one of the thirty questions listed in order, grouped by section, each with the answer parsed from the file shown in an editable field, and the parsed Notes / evidence beside it. The table sits inside a Silver `#DAD9D9` container; every editable cell is a Mint Cream `#EEF4F0` field with a Deep Teal `#37663E` bottom border; table text is Deep Space Blue `#0B3142`. Questions the file left blank are shown as empty and clearly marked "Not answered" in **Burnt Clay `#B35634`**. The supplier can edit any field here.
  6. Below the review table: the declaration block (signatory name, date, accuracy checkbox with a Deep Teal `#37663E` accent), the transparency notice, and **"Submit" in Deep Teal `#37663E`**.
  - A "Back" control at every stage returns to View 4 — plain text, Deep Space Blue `#0B3142`.
- **User actions:** download the template; choose a file; correct or complete answers in the review table; fill the declaration; submit; go back.
- **What happens next:** submit opens View 7.

---

### View 7 — Confirmation

- **Purpose:** Acknowledge the submission on screen. This is the end of every door.
- **What is visible:**
  - Page background Mint Cream `#EEF4F0`.
  - H2 "Submission complete." in Deep Space Blue `#0B3142`, DM Sans Medium.
  - A summary block, styled as a Silver `#DAD9D9` panel with rounded corners per Section 10.4, all text in Deep Space Blue `#0B3142`. It states: which path was taken (EcoVadis Scorecard or Full Assessment); which door was used (filled in here / uploaded / attached); the company legal name and contact email as entered; the number of questions answered out of the total for that path; the file name, if a file was attached or uploaded; the signatory name and declaration date, for Path B; and the submission timestamp.
  - The transparency notice from Section 7, in Deep Space Blue `#0B3142`.
  - A short "What happens next" restatement pointing at the 30 September 2026 deadline and the EHS Help Desk mailto for questions. Body text in Deep Space Blue `#0B3142`; the deadline emphasis and the mailto link in **Burnt Clay `#B35634`**.
  - One action: **"Start another submission" in Burnt Clay `#B35634`** — this is navigation and a state reset, not a form submission, so it does not take the Deep Teal submit colour. It clears all session state and returns to the landing page.
- **User actions:** read the summary; start another submission; use the Help Desk link.
- **What happens next:** starting another submission resets state entirely. Closing the tab discards everything.

---

## Section 9 — Logic and Calculations

This tool performs no scoring, grading, or calculation. It applies four sets of rules: upload validation, conditional questions, submit gating, and the confirmation summary. None of these changed in v2.1.

### 9.1 — Upload validation (View 6)

**What is checked:** whether the uploaded file is the official template.

**Inputs:** the file the supplier selects — `.xlsx` or `.csv`.

**Rules, applied in order. The first failure stops the process and shows its message.**

| # | Check | Failure message shown to the supplier |
|---|-------|--------------------------------------|
| 1 | File extension is `.xlsx` or `.csv`. | "This portal accepts the official template as an Excel workbook (.xlsx) or its CSV export. Please upload one of those." |
| 2 | The file can be opened and read. | "We couldn't read that file. It may be corrupted or password-protected. Try re-saving it and uploading again." |
| 3 | For `.xlsx`: a sheet named `Supplier Assessment 2026` exists. For `.csv`: skip this check — a CSV export carries no sheet name. | "This doesn't look like the official template — we couldn't find the 'Supplier Assessment 2026' sheet. Download the template above and use that file." |
| 4 | The header row contains the columns SECTION, ESRS REF, TYPE, QUESTION / METRIC, SUPPLIER RESPONSE, NOTES / EVIDENCE, STATUS. | "This doesn't look like the official template — the column headings don't match. Download the template above and use that file." |
| 5 | Every one of the thirty question texts in the template appears in the QUESTION / METRIC column, in the template's order. Comparison is case-insensitive and ignores leading/trailing whitespace and non-breaking spaces. | "This file doesn't match the official 2026 template. [N] of the 30 questions are missing or have been changed. Download a fresh copy of the template above and transfer your answers into it." |

All five failure messages render in Burnt Clay `#B35634` body text, per Section 10.6.

**On pass:** read column E (Supplier Response) and column F (Notes / Evidence) for each of the thirty question rows into session state, then render the review table. Column G (Status) is an internal column — ignore it entirely. Rows 1–4 (title, subtitle, header, instructions) and the section header rows are structural — skip them. If the file also carries values in the declaration row, read the signatory name and date into the declaration block as prefilled values.

**Deliberately tolerated defects.** The shipped template has three faults. The parser must accept the template exactly as it is, and the guided form must present the corrected version:

| Template defect | Parser behaviour | Guided form behaviour |
|-----------------|------------------|----------------------|
| Row 23 ("Specify source.") is tagged `S5` in the SECTION column but sits inside the water section and carries an E3-2 reference. | Match this row by its question text, not its section tag. Accept `S5` without complaint. | Present it as S4-2, inside Water & Marine Resources, where it belongs. |
| Row 12 ("Specify scope 3 categories included.") has no response, notes, or status cells — the row ends at column D. | Read columns E and F as empty if they are absent. Do not treat the missing cells as a structural mismatch. | Present it as S2-4 with a normal long-text answer field and notes field. |
| No dropdown question carries an option list. | Accept whatever text the supplier typed in the response cell, verbatim. Never reject an answer for not matching an option. Show it as typed in the review table. | Present the option sets defined in Section 8. |

**Edge cases:** an empty file, a file with the right structure but no answers at all, and a file where every answer is blank all pass validation and land on the review table with everything marked "Not answered" — the supplier fills it in there. A file over 10 MB is rejected with "That file is larger than 10 MB. Please upload the completed template, not a document pack." Selecting a second file replaces the first entirely; no answers from the first survive.

### 9.2 — Conditional questions

| Trigger | Effect |
|---------|--------|
| S3-2 (PFAS) answered "Yes" | An inline notice appears immediately beneath it: "Answering yes flags this submission for PFAS risk review by The Corporate's EHS team." S3-3 (substitution roadmap) becomes required and cannot be left blank. |
| S3-2 answered "Under investigation" | The same notice appears, worded "This answer flags your submission for PFAS risk review." S3-3 stays optional. |
| S3-2 answered "No" | No notice. S3-3 stays visible and optional. |
| S4-3 (high-water-stress region) answered "Yes" | S4-5 (drought contingency plan) becomes required. |

Both notices render as **Burnt Clay `#B35634`** body text inline beneath the triggering question — no background panel, no border, no icon, no modal. The colour is what draws the eye; the notice must not look like an error or an alarm.

These rules apply identically in the guided form and in the upload review table. The notice is informational only — it changes nothing about where the submission goes, because the submission goes nowhere in this build.

### 9.3 — Submit gating

| Door | Cannot submit until |
|------|--------------------|
| View 3a — EcoVadis upload | All five headline fields are filled, the email field is a valid email address, the two dates are valid dates, the overall score is a number between 0 and 100, and a file is attached. |
| View 3b — EcoVadis form | Company name, contact name, title and a valid email are filled; both dates are valid; every score present is a number between 0 and 100. Scores may be left blank if the supplier's scorecard does not include that theme. |
| View 5 — Guided assessment | All five S1 fields are filled with a valid email; every conditionally-required question triggered under 9.2 is answered; the signatory name is filled, the date is valid, and the accuracy checkbox is ticked. Questions outside S1 and the conditional rules may be left blank — a genuine gap is a valid answer and must not be blocked. |
| View 6 — Upload review | Same rules as View 5, applied to the reviewed answers. |

Blocked submissions show which fields need attention, and the guided form jumps to the section containing the first of them. Field-level validation messages render in Burnt Clay `#B35634`. Nothing is silently dropped.

### 9.4 — Confirmation summary

**Inputs:** the session state object.
**Output:** the summary block in View 7.
**Answered-question count:** a question counts as answered if its response field contains any non-whitespace character. Notes / evidence fields do not count.

The denominator differs by door, because S1 is one thing in the template and five fields in the guided form:

| Door | Denominator | Why |
|------|-------------|-----|
| View 5 — guided assessment | 33 | The 30 template rows, with S1's two combined rows split into five discrete fields |
| View 6 — upload review | 30 | One per template row, matching the file the supplier uploaded |
| View 3b — EcoVadis form | 9 | Q1–Q9 |
| View 3a — EcoVadis upload | No count — list the five headline fields and the attached filename instead | |

**Timestamp:** generated at the moment of submit, in the visitor's local timezone, formatted "4 September 2026, 14:32".

---

## Section 10 — Brand and Visual Direction

**Brand reference:** `data-leaf-brand` skill file — upload flat to the repo root before the build session. Claude Code installs it to `.claude/skills/` in First Session Setup and reads it before writing a line of markup or copy.

> This replaces `the-corporate-brand`, which governed v1.0. The Corporate's visual identity — Playfair Display, Acid Lime, Ink/Stone/Linen, the boxed monogram, the black pill label pattern — is removed from this build entirely. Claude Code must not carry any of it forward. The Corporate remains the named owner of the programme in the copy; Data Leaf is the platform the portal runs on.

**Palette — from the brand skill:**

| Role | Hex | Usage in this tool |
|------|-----|-------------------|
| Base 1 — Mint Cream | `#EEF4F0` | Default page background; light-section backgrounds; input field backgrounds; text on dark backgrounds |
| Base 2 — Silver | `#DAD9D9` | Form containers and panels; stat cards; the "Why We Are Asking" section background; body text inside dark cards; timeline hover background; inactive progress steps |
| Dark / text — Deep Space Blue | `#0B3142` | All body text and headings on light backgrounds; the hero band background; all door and path card backgrounds |
| Anchor — Deep Teal | `#37663E` | Section markers and ESRS references; input field bottom borders; the "Why We Are Asking" paragraph left borders; checkbox accents; **all form submit buttons** |
| CTA — Burnt Clay | `#B35634` | Navigation and CTA buttons; breadcrumbs; links; "(required)" tags; validation and conditional notices; the active progress step |

**Typography:** DM Sans Medium (500) for all headings, including stat figures and section headers. Inter Regular (400) for all body text, form labels, questions, and table content. Import both from the Google Fonts CDN.

**Visual feel:** clean and minimal, data-forward, calm. Technical precision in service of environmental impact.

**Voice — applies to every word Claude Code writes, including error messages and button labels:** analytical, trustworthy, light, sustainable. No startup hype. No alarmism or fear-mongering about climate. No exclamation points. No emoji. Short declarative sentences.

**Reference or inspiration:** none provided. `tokens.css` ships inside the brand skill package — use it as the source of the CSS custom properties rather than retyping hex values.

---

### 10.1 — Why the v2.1 visual direction exists

The v2.0 build was reviewed live against screenshots. Three problems came out of that review, and everything in 10.2–10.6 answers one of them:

1. **The hero had no hierarchy.** Everything on the landing page sat on the same light background, so the opening statement carried no more weight than the footer. The dark hero band fixes this.
2. **The forms had almost no contrast.** Silver-outlined input fields on a Mint Cream page were close to invisible. The form treatment in 10.4 fixes this.
3. **Every button looked the same.** Submitting an assessment and scrolling down the page were the same colour and the same weight. The button hierarchy in 10.5 fixes this.

Claude Code must treat 10.2–10.6 as binding. Where a specific screen in Section 8 names a colour, it is repeating one of these rules — it is not an exception to them.

---

### 10.2 — The dark hero band

The hero is the only full-width dark band on the landing page. That is deliberate: it is what gives the opening statement its weight, and repeating it elsewhere would dilute it.

| Element | Treatment |
|---------|-----------|
| Band background | Deep Space Blue `#0B3142`, full width |
| Overline "SUPPLIER PROGRAMME 2026" | Silver `#DAD9D9`, uppercase, tracked |
| H1 | Mint Cream `#EEF4F0`, DM Sans Medium |
| Body paragraph | Mint Cream `#EEF4F0`, Inter Regular |
| Stat cards | Rounded corners, Silver `#DAD9D9` background, figure and label both Deep Space Blue `#0B3142`. Four across on desktop, two columns on mobile. |
| Scope 3 reference note | Mint Cream `#EEF4F0`, directly on the band, no card |
| "Go to step 1" button | Burnt Clay `#B35634` |

The stat cards are the one place in the build where Silver panels sit on a dark background rather than a light one. Everywhere else, Silver panels sit on Mint Cream.

---

### 10.3 — The dark card treatment (path cards and door cards)

Every choice point in the tool uses the same card. A supplier picking a path on the landing page and a supplier picking a door two clicks later should see the same object.

**Applies to:** the two path cards in "Step 1 — Choose a path.", the two door cards in View 2 (Path A), and the two door cards in View 4 (Path B). Six cards, one treatment.

| Element | Treatment |
|---------|-----------|
| Card background | Deep Space Blue `#0B3142`, rounded corners |
| Section background behind the cards | Mint Cream `#EEF4F0` — the cards are dark objects on a light page, not a dark band |
| Overline label | Silver `#DAD9D9`, uppercase, tracked. "PATH A" / "PATH B" on the landing page; the door name on the chooser views |
| Card heading | Mint Cream `#EEF4F0`, DM Sans Medium |
| Card body text | Silver `#DAD9D9`, Inter Regular |
| Card button | Burnt Clay `#B35634` — these buttons open a view, they do not submit anything |

**Does not apply to:** the three Key Resources cards, which keep their v2.0 light treatment, and the four What Happens Next timeline steps, which keep theirs. Those are informational, not choice points.

---

### 10.4 — The form treatment

**Applies to every form surface in the tool, without exception:** View 3a (upload scorecard), View 3b (EcoVadis form), View 5 (all eight guided assessment steps, including the declaration), View 6 (download panel, upload panel, review table, and declaration block), and the summary block on View 7.

| Element | Treatment |
|---------|-----------|
| Form container / panel | Silver `#DAD9D9` background, rounded corners |
| Page background behind the container | Mint Cream `#EEF4F0` |
| Input fields, textareas, dropdowns, file pickers | Mint Cream `#EEF4F0` background, **Deep Teal `#37663E` bottom border only** — no full box border, no outline on the other three sides |
| Input text | Deep Space Blue `#0B3142`, Inter Regular |
| Field labels | Deep Space Blue `#0B3142`, Inter Regular |
| "(required)" tag | Burnt Clay `#B35634` |
| ESRS reference beside a question | Deep Teal `#37663E`, small, uppercase, tracked |
| Checkbox accent (checked state) | Deep Teal `#37663E` |
| Transparency notice | Deep Space Blue `#0B3142`, Inter Regular, no panel and no icon |

The bottom-border-only input is the defining detail of this treatment. Claude Code must not add a full border, a box shadow, or a filled outline to any input field — the contrast between the Mint Cream field and the Silver container is what makes the field visible, and the Deep Teal rule underneath is what marks it as editable.

---

### 10.5 — Button hierarchy

Two colours, and the distinction is what the button *does*, not where it sits.

| Colour | Meaning | Buttons |
|--------|---------|---------|
| **Deep Teal `#37663E`** | Submits a form. Ends a flow. | "Submit" on View 3a, View 3b, View 5 (final step), and View 6 |
| **Burnt Clay `#B35634`** | Navigates, opens, downloads, or resets. Nothing is submitted. | "Go to step 1", "Submit EcoVadis Scorecard", "Start Full Assessment", the door cards' buttons, "Next", "Choose file", "Download Assessment", "Start another submission" |
| Plain text, Deep Space Blue `#0B3142` | Steps backwards | Every "Back" control inside a form or a chooser |

Note the deliberate oddity: the landing-page button labelled "Submit EcoVadis Scorecard" is **Burnt Clay**, not Deep Teal, because it submits nothing — it opens View 2. The rule is behavioural, and Claude Code must apply it by behaviour rather than by the word on the button.

---

### 10.6 — Notices, errors, and states

| State | Treatment |
|-------|-----------|
| Upload rejection message (9.1) | Burnt Clay `#B35634` body text, no panel, no icon |
| Field validation message (9.3) | Burnt Clay `#B35634` body text beneath the field |
| PFAS and water-stress conditional notices (9.2) | Burnt Clay `#B35634` body text inline beneath the triggering question, no panel, no icon, no modal |
| "Not answered" marker in the review table | Burnt Clay `#B35634` |
| Active step in the guided form progress indicator | Burnt Clay `#B35634`; inactive steps Silver `#DAD9D9` |
| "What Happens Next" timeline step, resting | Existing v2.0 treatment, unchanged |
| "What Happens Next" timeline step, hovered | Background transitions to Silver `#DAD9D9` over roughly 200ms, ease. Background only — no movement, no scaling, no colour change to the text or the step number. No tap-state substitute on touch devices. |

---

## Section 11 — API and Credentials

This tool requires no external services and no API keys.

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| None | — | — | — |

Everything runs in the browser. The template is a static asset in `/assets/`. Spreadsheet parsing uses SheetJS, bundled at build time. The Contact EHS link is a `mailto:`. There is no server-side function, no API call, no database connection, and no environment variable in this build.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| None required | — | — |

Nothing to prepare before the build session.

---

## Section 12 — Out of Scope — Phase 2

Claude Code will not build anything listed here. Do not add any of it, even where it would obviously improve the tool.

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Database storage of submissions | Confirmed decision — this build is frontend-only, D2. Adding storage moves the tool to Tier 2 and requires a Supabase project. This is the single most important item on this list, and it is the natural next version. |
| Any delivery of the submission to The Corporate — email, webhook, API, file drop | Confirmed decision — no email arm, no server-side function. The submission ends at the on-screen confirmation. |
| Download of the supplier's own completed answers at the end | Considered and declined for this build. The confirmation is on-screen only. Reconsider alongside storage in the next version. |
| Internal EHS review dashboard | Requires a separate Tier 2 or Tier 3 tool sharing a database. Not needed to validate the supplier submission flow. |
| Save and resume, or supplier accounts | Moves the tool to Tier 3. The download-and-upload door is the answer for assessments needing several contributors. |
| AI scoring or gap analysis of submitted answers | Requires the AI API arm and a defined scoring methodology. Not needed to validate the flow. |
| Automated EcoVadis scorecard validation | Requires EcoVadis API access. Deferred pending API availability. |
| Reading or parsing the uploaded EcoVadis PDF | The attachment is held and its filename displayed. Its contents are never read. The five typed fields carry the data. |
| Submission tracker showing Tier 1 response rates | Requires storage and a supplier roster. |
| Dark mode, theme switching, or any user-selectable colour scheme | The v2.1 direction is a single fixed treatment. No toggle. |
| Animation beyond the two specified transitions | Only the hero smooth-scroll and the 200ms timeline hover are in scope. No scroll-triggered reveals, parallax, entrance animations, or motion on the cards. |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Landing page renders in full | Nav, hero, stats, Why We Are Asking, Step 1 chooser, timeline, Key Resources, footer — all present, in order, no layout breaks | [ ] |
| 2 | Data Leaf brand is applied and The Corporate's brand is gone | DM Sans headings, Inter body, the five Data Leaf colours in the roles assigned in Section 10. No Playfair Display, no Acid Lime, no Ink/Stone/Linen, no black pill label, anywhere in the build | [ ] |
| 3 | Hero dark band | Hero background is Deep Space Blue; H1 and body are Mint Cream; the overline is Silver; the Scope 3 reference note is Mint Cream and sits on the band with no card | [ ] |
| 4 | Stat cards | Four rounded Silver cards on the dark hero band, each with its figure and label in Deep Space Blue. Two columns on mobile, four across on desktop | [ ] |
| 5 | "Go to step 1" button | Present at the foot of the hero, below the stat cards and reference note, in Burnt Clay. Smooth-scrolls to "Step 1 — Choose a path." Opens nothing, selects nothing, leaves the page nowhere | [ ] |
| 6 | "Why We Are Asking." layout | Heading carries a full stop. Deep Teal overline above it. Three visually separated paragraphs, each with a thick Deep Teal left border, on the Silver section background. No cards, no clipping, no overlap between paragraphs | [ ] |
| 7 | Step 1 section heading | Reads "Step 1 — Choose a path." — the v2.0 wording "Two Routes. One Destination." appears nowhere in the build | [ ] |
| 8 | Path cards | Both cards are Deep Space Blue with rounded corners on a Mint Cream section background. Overlines read "PATH A" and "PATH B" in Silver. Headings Mint Cream, body Silver, buttons Burnt Clay | [ ] |
| 9 | Timeline hover | Hovering a step transitions its background to Silver over roughly 200ms. Text, numbers, and dates keep their colours. Nothing moves or scales | [ ] |
| 10 | Key Resources punctuation | The section's final sentence ends with a full stop; the rest of the section is unchanged from v2.0 | [ ] |
| 11 | Door choosers share the path-card treatment | View 2 and View 4 door cards are visually identical in treatment to the Step 1 path cards — same background, radius, overline, heading, body, and button colours | [ ] |
| 12 | Form treatment is applied everywhere | On View 3a, 3b, 5, 6, and the View 7 summary: Silver containers, Mint Cream input fields with a Deep Teal bottom border only, Deep Space Blue labels and input text, Burnt Clay "(required)" tags. No full-bordered or outlined input anywhere in the build | [ ] |
| 13 | Button hierarchy | Every form Submit is Deep Teal. "Go to step 1", "Submit EcoVadis Scorecard", "Start Full Assessment", "Next", "Choose file", "Download Assessment", and "Start another submission" are all Burnt Clay. Every in-form Back is plain Deep Space Blue text | [ ] |
| 14 | Path A door chooser | "Submit EcoVadis Scorecard" opens View 2 showing two doors. Neither door is hidden or gated | [ ] |
| 15 | Path A door one — upload | PDF attaches, filename and size display, all five fields validate, submit blocked until complete, submit opens the confirmation | [ ] |
| 16 | Path A door two — form | All nine EcoVadis questions render with the types and option sets in Section 8; "recieved"/"cicle" are spelled correctly | [ ] |
| 17 | Path B door chooser | "Start Full Assessment" opens View 4 showing both doors, with the one-sitting warning on door one | [ ] |
| 18 | Guided form covers all seven sections | Eight steps (S1–S7 plus Declaration); all 33 fields render in the Section 8 order — the 30 template rows, with S1's two combined rows split into five — with correct ESRS references in Deep Teal, types, option sets, and a notes field each; back/next work in both directions without losing answers | [ ] |
| 19 | Progress indicator | Active step Burnt Clay, inactive steps Silver, accurate across all eight steps in both directions | [ ] |
| 20 | Template defects corrected in the guided form | "Specify source" appears as S4-2 inside Water & Marine Resources; "Specify scope 3 categories" appears as S2-4 with a working answer field | [ ] |
| 21 | Download button | Present inside Path B door two, in Burnt Clay. Downloads the correct, complete `The_Corporate_Supplier_Questionnaire_2026.xlsx` from `/assets/` | [ ] |
| 22 | Upload accepts the official template | Uploading the unmodified template — as `.xlsx` and again as its `.csv` export — passes all five checks and reaches the review table | [ ] |
| 23 | Upload rejects everything else | A different workbook, a renamed sheet, an altered question, and a non-spreadsheet file are each rejected with the specific message from Section 9.1, rendered in Burnt Clay with no panel. No partial data carries forward from a rejection | [ ] |
| 24 | Review table shows parsed answers back | Every answer in the uploaded file appears against its question in an editable Mint Cream field with a Deep Teal bottom border; blank answers are marked "Not answered" in Burnt Clay; notes/evidence are carried across; the Status column is ignored | [ ] |
| 25 | PFAS conditional rule | Answering S3-2 "Yes" shows the risk-review notice in Burnt Clay inline text and makes S3-3 required; submission is blocked while S3-3 is blank. Same behaviour in the guided form and the review table | [ ] |
| 26 | Water-stress conditional rule | Answering S4-3 "Yes" makes S4-5 required in both the guided form and the review table | [ ] |
| 27 | Declaration gate | Path B cannot submit without signatory name, a valid date, and the ticked accuracy checkbox. The checked state uses the Deep Teal accent | [ ] |
| 28 | Genuine gaps are allowed | A Path B submission with several non-required questions left blank submits successfully | [ ] |
| 29 | Confirmation screen | Silver summary panel on a Mint Cream page. Shows path, door, company, contact email, answered count out of total, file name where applicable, signatory and date for Path B, and the timestamp — accurate to what was actually entered. "Start another submission" is Burnt Clay | [ ] |
| 30 | Nothing is stored, nothing is sent | No network request leaves the page on submit. Reloading the tab after a submission shows a clean landing page with no retained answers. No email is sent by the tool | [ ] |
| 31 | Transparency notice | The Section 7 copy appears above every submit control and on the confirmation screen, worded exactly as specified, in Deep Space Blue with no panel | [ ] |
| 32 | "Start another submission" | Clears all session state — a new submission starts with every field empty and no attached file | [ ] |
| 33 | Contrast is legible throughout | Mint Cream text on Deep Space Blue, Silver text on Deep Space Blue, and Deep Space Blue text on Silver are all comfortably readable at body size on a normal laptop screen. No text is the same value as the surface behind it | [ ] |
| 34 | Responsive on mobile | All grids collapse below 768px; stat cards go to two columns; path and door cards stack; the guided form is usable one section per screen; the review table scrolls horizontally inside its own container without the page scrolling sideways; buttons are full-width and tappable | [ ] |
| 35 | Deploys to Netlify | Live URL loads on desktop and mobile, no 404s, the template downloads correctly from the deployed site | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 1

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed by the builder
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] `data-leaf-brand` skill file uploaded flat to the GitHub repo root
- [ ] `The_Corporate_Supplier_Questionnaire_2026.xlsx` placed in `/assets/` (or the equivalent static folder) in the repo — this is the file suppliers download and upload back, and the file the parser validates against
- [ ] Netlify connected to the GitHub repo (Netlify MCP is not active for this build)
- [ ] No credentials to prepare for this tool

---

### Tier 1 — build session

- [ ] Open Claude Code in the project folder (GitHub repo connected to Netlify)
- [ ] Claude Code runs First Session Setup: creates `docs/`, moves reference files, installs `data-leaf-brand` to `.claude/skills/`
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] Claude Code reads Section 10 in full before writing any markup — the v2.1 visual direction is binding and applies across every view
- [ ] Claude Code confirms `The_Corporate_Supplier_Questionnaire_2026.xlsx` is present in `/assets/` before building the upload parser — the parser's validation rules are derived from that exact file
- [ ] Claude Code drafts the "Why We Are Asking" body copy in the Data Leaf voice, as three paragraphs suited to the left-border layout; builder reviews before deployment
- [ ] Claude Code confirms the document URLs for "View Document" and "View Policy" with the builder, or leaves them as `#` and flags them
- [ ] Claude Code builds the tool
- [ ] Test locally before deploying — including the upload flow with the real template as `.xlsx` and as a `.csv` export, and with at least one file that must be rejected
- [ ] Visual QA pass against acceptance criteria 2–13 and 33 before deployment
- [ ] Push to main → Netlify deploys automatically

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Data Leaf has no logo file — the brand skill flags this as a functional gap. Is a logo available, or does Claude Code render the wordmark as type? | Builder | No — Claude Code renders "Data Leaf" as a DM Sans Medium wordmark in Deep Space Blue and flags it for replacement |
| The nav bar sits directly above the new dark hero band. Should the nav keep its light background, or extend the Deep Space Blue up through it? | Builder | No — Claude Code keeps the nav light, with the Deep Space Blue wordmark, and flags it for review at first deploy |
| The overline above "Why We Are Asking." is specified as Deep Teal with the placeholder wording "PROGRAMME CONTEXT". Is that the wording you want? | Builder | No — the placeholder ships unless the builder replaces it |
| What is the real URL for the Supplier Code of Conduct document? | Builder | No — Claude Code leaves it as `#` and flags it |
| What is the real URL for the Global Environmental Policy? | Builder | No — Claude Code leaves it as `#` and flags it |
| "Why We Are Asking" body copy is not written | Claude Code drafts it in the Data Leaf voice during the build; builder reviews before deployment | No |
| EcoVadis badge options — the source file asks about badges without listing them. Section 8 specifies None / Committed / Other. Does that match what The Corporate expects to see? | Builder | No — the specified options ship unless the builder says otherwise |
| Should the three template defects be fixed in the shipped `.xlsx` itself, so future suppliers download a clean file? | Builder | No — the parser tolerates them either way. If the template is corrected later, the parser's question-text list must be updated to match |
| What is the deployed URL for this tool? | Builder | No — confirmed after first deployment |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 12 June 2026 | Retroactive spec of the existing supplier onboarding landing page (`supplier_onboarding.html`). Static, D1, Tier 1. Two outbound actions — an external EcoVadis link and an Excel download — plus a mailto to the EHS team. Completed questionnaires returned by email. The Corporate brand. |
| v2.0 | 4 September 2026 | In-portal submission. Path A (EcoVadis) split into two doors: attach scorecard with five headline fields, or fill the nine EcoVadis questions in-page. Path B (Full Assessment) split into two doors: a guided form stepping through S1–S7 and the declaration, or download the template, complete it offline, and upload it back for parsed review before submitting. Upload accepts only the official template, as `.xlsx` or its `.csv` export, validated on sheet name, column headers, and all thirty question texts. The download button moves inside Path B door two. Every door ends on a single on-screen confirmation; no email is sent. Data model moves D1 → D2 (session-only, nothing stored). Frontend moves flat HTML → React + Vite + Tailwind. Brand moves `the-corporate-brand` → `data-leaf-brand`. New "Go to step 1" button added at the foot of the hero, scrolling to the path chooser. Conditional rules added for PFAS and water stress. Three defects in the source template documented and handled. |
| v2.1 | 6 September 2026 | Visual direction pass, from a live review of the v2.0 build. No change to the data model, access model, tier, arms, views, question set, validation rules, or logic. Hero becomes a Deep Space Blue band with Mint Cream type, a Silver overline, and the four statistics rebuilt as rounded Silver cards. "Why We Are Asking" gains a full stop, a Deep Teal overline, and a left-border highlight layout replacing the three run-together paragraphs. "Two Routes. One Destination." renamed "Step 1 — Choose a path.", tying it to the hero button; its two cards become Deep Space Blue on Mint Cream with "PATH A" / "PATH B" overlines. The same dark card treatment is extended to both door choosers (View 2 and View 4). All form surfaces move to a Silver container with Mint Cream input fields and a Deep Teal bottom border, replacing the low-contrast Silver-on-Mint-Cream outlines. Button hierarchy split in two: Deep Teal for form submits, Burnt Clay for navigation, downloads, and resets. "What Happens Next" steps gain a 200ms Silver hover background. Key Resources gains a closing full stop. Section 10 restructured into six sub-sections carrying the full visual specification; acceptance criteria expanded from 23 to 35 to cover it. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
