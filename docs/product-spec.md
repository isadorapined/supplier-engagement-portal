# Product Spec — The Corporate Supplier Sustainability Portal 2026

**Version:** 3.0
**Date:** 10 September 2026
**Author:** Isadora Pineda Stanischeski
**Status:** Confirmed

> v1.0 documented the original static landing page. v2.0 added the in-portal submission flow. v2.1 was a visual-direction pass only. This version, v3.0, is a structural change: the tool moves from session-only (D2) to persisted (D3) — every submission is now written to a database — and each door's flow gains its own identical opening step that captures who the supplier is before anything else in that door. The two path doors on the landing page, and the door choosers inside each path, are unchanged and remain the first thing a supplier sees.

---

## Section 1 — Tool Summary

**Tool name:** The Corporate Supplier Sustainability Portal 2026

**What it does:** A public single-page portal that onboards Tier 1 suppliers into The Corporate's ESRS-aligned 2026 sustainability assessment, lets them complete and submit it inside the page itself — either by filling guided forms on screen or by uploading the completed official Excel template — and now retains every submission in a database so The Corporate can review it after the fact.

**Who uses it:** Tier 1 supplier contacts — sustainability managers, EHS leads, and procurement representatives at supplier organisations — who receive the URL directly from The Corporate's procurement or EHS team. The Corporate's own team does not use the portal itself in this version; they review what has been submitted directly in the Supabase table editor.

**Why it exists:** v1.0 routed every supplier *out* of the page, with no confirmation anything was received. v2.0 kept the supplier inside the portal from arrival to confirmation, but the submission itself went nowhere — it lived in the browser tab and vanished on close, so nothing The Corporate could actually act on was ever produced. v3.0 closes that gap: the submission is saved, and it is saved against a durable company record so repeated submissions from the same supplier accumulate in one place rather than scattering.

**Build status:** Iteration — v2.1 is a static-data, session-only (D2), public (A1), Tier 1 build. This build adds a Supabase database (moving the tool to D3, Tier 2), introduces one identical company/contact opening step at the start of every door's flow (replacing the identity fields that were previously scattered inside each door's own questions), and persists every completed submission — full answers, not just identity — linked to a reusable company record. No login is added in this version. Visual direction, the two path doors, the door choosers, the assessment question set, the conditional logic, and the upload-validation rules are otherwise unchanged from v2.1.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** Suppliers' full submissions need to be retained after the tab closes so The Corporate can actually review them, and repeat submissions from the same company need to accumulate against one record rather than being lost between sessions.

**D3 is triggered — checked:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** The portal is still distributed to Tier 1 suppliers as a direct link, with no account required to submit. Login — for both suppliers (to see their own past submissions) and The Corporate's internal reviewers (to see everyone's) — is a confirmed future version (v4), not built here. The database structure below (a `companies` table separate from `submissions`) is deliberately shaped so that v4 can attach auth to it without restructuring data.

> **Promotion rule check:** D3 here comes from an explicit persistence requirement, not from auth — no login exists yet, so the promotion rule does not apply. D3+A1 is a valid, standing combination (Tier 2), not a stepping stone that requires auth.

---

### If Access Model is A2 — complete both questions

N/A — Access Model is A1.

---

### If Access Model is A3 — define all roles

N/A — Access Model is A1.

---

### Tier

**Tier:** 2

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

A database now exists, but nobody logs in to use the tool — that is Tier 2, not a partial Tier 3.

> **Read the Stack column carefully.** "Tier 3 — Supabase (auth + RLS)" names what Tier 3 *adds* (auth), not the tier at which RLS starts. RLS is required at Tier 2 as well, and on any Supabase table the anon key can reach. Tier 2 means no login; it does not mean no row-level security. See Section 6.

---

### Standalone or Stack

**This tool is:** Standalone — it is a single tool with its own Supabase project. It is not part of a stack; there is no separate internal-facing tool sharing this database in this version. (A future internal review tool, if built after v4 login exists, would become a stack sharing this same Supabase project.)

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
| What is exported | The blank official template — `The_Corporate_Supplier_Questionnaire_2026.xlsx` — served as a static asset from `/assets/`. Unchanged from v2.1: it is not populated server-side and carries no supplier data. It is the file a supplier downloads inside Path B door two, completes offline with colleagues, and uploads back into the portal. |
| PDF design intent | N/A — format is XLSX only. |

> Nothing about the export arm changes in v3.0. Submitted answers are still never exported to the supplier — the confirmation screen is on-screen only.

---

### Email Arm

**Active:** No

> No email is sent by this tool, in either direction, in this version. The `mailto:` link to the EHS Help Desk in Key Resources remains a plain anchor that opens the visitor's own mail client — it involves no server and no API key. Sending a confirmation email on submit was considered and explicitly deferred (see Section 12).

---

### Scheduled Automation Arm

**Active:** No

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind — unchanged from v2.0/v2.1. |
| Deployment target | Netlify |
| Netlify MCP | Not active — deployment continues to be done manually through the Netlify dashboard. The builder's GitHub repo stays connected to Netlify; Netlify deploys on every push to main. |

**Client-side library for reading spreadsheets:** SheetJS (`xlsx`), unchanged. All parsing happens in the browser.

**GitHub — pre-build requirement:** As before, the builder creates the GitHub repo and uploads product-spec.md, CLAUDE.md, and PROGRESS.md to the repo root before opening Claude Code.

---

### CONDITIONAL: Supabase project — Tier 2

**Supabase project status:** **Existing — resolved at build, v3.0 session 3.** This section originally read "New — Claude Code will create it via MCP." When the build session opened, a Supabase project already existed in the builder's organisation: **`The Corporate`**, ref `smnrfopzzzhazkehcqqn`, us-east-1, created 6 September 2026, with an empty `public` schema. The builder confirmed it should be reused rather than creating a second project.

That name also satisfies this section's own naming rationale better than the proposed one did: it is named for the client/organisational context rather than for this specific tool, which is exactly the property the note below asks for.

**Supabase plan:** Free — pauses after roughly a week of no traffic. Acceptable for this build's context (a class/portfolio project, not a live client deployment with continuous traffic).

**If new:**

| Detail | Answer |
|--------|--------|
| Proposed project name (spec, pre-build) | `the-corporate-supplier-portal` |
| Actual project used | **`The Corporate`** — existing, reused on the builder's confirmation |
| Project ref | `smnrfopzzzhazkehcqqn` |
| Region | us-east-1 |
| Plan | Free |

> The project is named after the client/organisational context (The Corporate's supplier programme), not after this specific tool, so it can hold future tools in the same context — including the v4 login work and any later internal review tool — without renaming.

---

### CONDITIONAL: Stack section

N/A — standalone in this version.

---

## Section 5 — Data Architecture

### What data is collected or stored in this tool

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| `companies.id` | Internal company record ID | UUID (auto) | Automatic | Yes |
| `companies.legal_name` | Company legal name | Text | Supplier — opening step, every door | Yes |
| `companies.registered_country` | Registered country | Text | Supplier — opening step, every door | Yes |
| `companies.contact_name` | Primary contact name | Text | Supplier — opening step, every door | Yes |
| `companies.contact_title` | Primary contact job title | Text | Supplier — opening step, every door | Yes |
| `companies.contact_email` | Primary contact email | Email | Supplier — opening step, every door | Yes |
| `companies.created_at` | First seen | Timestamp (auto) | Automatic | Yes |
| `companies.updated_at` | Last updated | Timestamp (auto) | Automatic — refreshed whenever a later submission provides new contact details for this company | Yes |
| `submissions.id` | Internal submission record ID | UUID (auto) | Automatic | Yes |
| `submissions.company_id` | Which company this submission belongs to | UUID (FK → companies.id) | Automatic — resolved at submit time | Yes |
| `submissions.path` | `ecovadis` or `full` | Text | Supplier's path choice on the landing page | Yes |
| `submissions.door` | `ecovadis_upload`, `ecovadis_form`, `assessment_guided`, or `assessment_upload` | Text | Supplier's door choice | Yes |
| `submissions.answers` | Every door-specific answer for this submission (the EcoVadis fields, or the S2–S7 assessment answers plus notes/evidence, depending on door) | JSON object, keyed by question ID | Typed by the supplier, or parsed from an uploaded workbook | Yes — content varies by door; individual assessment questions may be blank per the existing gating rules in Section 9.3 |
| `submissions.attached_file_name` | Name of a file the supplier attached or uploaded | Text, nullable | Supplier's file picker | No — only present on EcoVadis upload or the download-and-upload door |
| `submissions.attached_file_size` | Size of that file, in bytes | Integer, nullable | Automatic, from the file object | No |
| `submissions.signatory_name` | Declaration signatory name | Text, nullable | Supplier — Path B (full assessment) doors only | Conditionally — required by Path B's existing declaration gate |
| `submissions.declaration_date` | Declaration date | Date, nullable | Supplier — Path B doors only | Conditionally |
| `submissions.submitted_at` | When the submission was saved | Timestamp (auto) | Automatic | Yes |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| `companies` | One row per company. Reused across every submission that company makes, so repeat submissions accumulate under one record instead of creating duplicate company entries. | legal_name, contact_email |
| `submissions` | One row per completed submission — the full answer set for that door, plus which company it belongs to. A company can have many submissions. | company_id, path, door, submitted_at |

**Company matching rule (drives whether a submission creates a new company or reuses one):** At submit time, look up `companies` by `legal_name`, matched case-insensitively with leading/trailing whitespace ignored. If a match exists, reuse that `company_id` and update `registered_country`, `contact_name`, `contact_title`, and `contact_email` to the values just submitted (so the company record always reflects the latest contact on file); update `updated_at`. If no match exists, insert a new `companies` row. This is a simple insert-or-update-on-match — it is not deduplication against typos or near-matches, and Claude Code must not attempt fuzzy matching.

**File storage:** No. The EcoVadis attachment and the uploaded workbook are never stored — only their filename and size are recorded on the submission row, exactly as in v2.1. Neither file is uploaded to Supabase Storage or any server. This was a deliberate choice, not an oversight — see Section 12.

**Derived or calculated data:** No scoring, no grading, no index — unchanged from v2.1. The confirmation screen's answered-question count (Section 9.4) is calculated client-side for display and is not itself written to the database as a separate field; it can always be recomputed from `submissions.answers`.

---

## Section 6 — Access and Permissions

No authentication and no roles — Access Model is A1. **RLS is still mandatory.** It is enabled on both tables and is never disabled.

> **Corrected at build, v3.0 session 3.** An earlier draft of this section read "no RLS policies in this version," on the reasoning that RLS belongs to Tier 3 because Tier 3 is where login lives. That reasoning is wrong and was not built. RLS is not an authentication feature — it is the only boundary between the anon key and the public internet. The anon key ships inside the JavaScript bundle and the portal URL is distributed to every Tier 1 supplier, so with RLS disabled any recipient could read, alter, or delete every other supplier's submission. RLS is required on any Supabase table reachable by the anon key, at every tier, with or without login. See Section 2's Tier table note and Section 14.

Policies, as built:

| Table | anon may | anon may not | Why |
|-------|----------|--------------|-----|
| `companies` | nothing directly | select, insert, update, delete | All access goes through one `SECURITY DEFINER` function (below). Supplier contact names, titles and emails are never readable from the browser. |
| `submissions` | insert only | select, update, delete | A supplier posts their own submission and can never read back anyone's — including their own. The Corporate reads submissions in the Supabase table editor, which uses the service role and bypasses RLS. |

**Company resolution runs server-side.** A `public.resolve_company(...)` function, `SECURITY DEFINER`, takes the five identity fields, performs the Section 5 match-or-insert, and returns only the resulting `company_id`. This is what lets `companies` carry no anon select policy at all. It also makes the matching rule atomic: a unique index on `lower(trim(legal_name))` means two simultaneous submissions from the same company cannot both insert a row, which a client-side select-then-insert could not prevent.

Because `submissions` is insert-only, the client cannot read back the row it just wrote — a `.insert().select()` chain is refused by the policy. View 7 is therefore rendered from in-browser state, never from a database read-back.

There is no per-supplier data isolation to enforce beyond this, since suppliers do not read any data back through the portal in this version.

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — confirmed during the interview. This build is a class/portfolio project, not a live deployment processing real supplier data on The Corporate's behalf, so full GDPR compliance is not a live legal requirement for this version. No consent checkbox, no formal consent flow, and no deletion mechanism are built.

**Transparency notice — built anyway, as a plain factual statement, not a legal disclaimer.** Because the tool now genuinely stores what suppliers type — unlike v2.1, where the honest claim was that nothing left the browser — the notice is updated to stay accurate. It appears in the same two places as before, in body text, not as a modal or checkbox:

1. Directly above the submit control on every door.
2. On the confirmation screen.

Exact copy for both:

> Your information is stored for The Corporate's review.

Styling is unchanged from v2.1 Section 10.4 — Deep Space Blue `#0B3142` body text, Inter Regular, no background panel, no icon.

This notice must remain accurate. If a future version (e.g. v4, with real production use) requires actual GDPR compliance, this section and this notice both need to be revisited with a real consent flow.

---

## Section 8 — Screen and UI Structure

The portal is a single-page application. The landing page is a scrolling view; the submission flows replace the page content and return to the landing page when complete. There is no page reload and no multi-URL routing requirement. This structure, and the visual treatment referenced throughout, are unchanged from v2.1 (see Section 10) unless a view is explicitly described as changed below.

> **What changed structurally in v3.0:** every door (View 3a, 3b, 5, 6) now opens with one identical Company & Contact step before any door-specific content. This step replaces the identity fields that used to sit further inside each door — including "S1" in the guided assessment and download-and-upload doors, which is retired as a numbered assessment section and becomes this universal opening step instead. View 3a and View 3b each gain a "registered country" field they did not previously ask for, so all four doors now capture the exact same five identity fields. Views 1, 2, 4, and 7 are structurally unchanged; View 7's content is updated only to reflect that the submission is now saved, not discarded.

---

### View 1 — Landing Page

Unchanged from v2.1 in every respect — nav, dark hero band, stats, "Why We Are Asking.", "Step 1 — Choose a path." with its two path cards, "What Happens Next." timeline, Key Resources, footer. See v2.1 Section 8 for the full specification; Claude Code should treat that content as still authoritative for this view. No submission or identity data is collected here.

---

### View 2 — Path A: EcoVadis Door Chooser

Unchanged from v2.1 — two door cards (upload / enter details), a "Back" control. No identity data is collected here; that now happens as the first step inside whichever door the supplier picks next.

---

### View 3a — Path A Door One: Upload Scorecard

- **Purpose:** Capture who the supplier is, then the scorecard file plus its headline values.
- **What is visible, in order:**

  **Step 1 of 2 — Company & Contact (the new opening step, identical across all four doors):**
  - Breadcrumb "PATH A · DOOR ONE" in Burnt Clay `#B35634`, uppercase, tracked. H2 "Before you begin" in Deep Space Blue `#0B3142`. One line of body copy: "Tell us who this submission is from."
  - The **form treatment from v2.1 Section 10.4** — Silver `#DAD9D9` container, Mint Cream `#EEF4F0` fields with a Deep Teal `#37663E` bottom border.
  - Five required fields, identical wording and order across every door:

    | Field | Type |
    |-------|------|
    | Company legal name | Text |
    | Registered country | Text |
    | Primary contact name | Text |
    | Primary contact title | Text |
    | Primary contact email | Email format |

  - "Next" — Burnt Clay `#B35634`, per the button hierarchy (this step does not submit anything). "Back" — plain text, Deep Space Blue `#0B3142`, returns to View 2.
  - This step cannot be advanced past until all five fields are filled and the email is a valid email address.

  **Step 2 of 2 — Scorecard details (door-specific, unchanged in content from v2.1 except identity fields removed):**
  - H2 "Upload your scorecard" in Deep Space Blue `#0B3142`. Intro paragraph in Deep Space Blue `#0B3142`.
  - File picker, accepting PDF. Once a file is chosen, its filename and size are shown with a "Remove" control. The file is held in browser memory only, is never read or parsed, and is never transmitted or stored — only its filename and size travel with the submission. The "Choose file" control is Burnt Clay `#B35634`.
  - Three required fields (identity fields have moved to Step 1 and are not repeated here):

    | Field | Type |
    |-------|------|
    | Publication date | Date |
    | Valid until | Date |
    | Overall EcoVadis score | Number, 0–100 |

  - The transparency notice from Section 7, directly above the submit control.
  - "Submit" — Deep Teal `#37663E` — and "Back" — plain text, Deep Space Blue `#0B3142`, returns to Step 1.
- **User actions:** fill Step 1, advance, attach a file, fill Step 2's fields, submit, or go back at either step.
- **What happens next:** submit writes one row to `companies` (insert or update-on-match) and one row to `submissions` (`path: "ecovadis"`, `door: "ecovadis_upload"`), then opens View 7 (Confirmation).

---

### View 3b — Path A Door Two: EcoVadis Form

- **Purpose:** Capture who the supplier is, then the full EcoVadis scorecard detail in-page, with no file.
- **What is visible, in order:**

  **Step 1 — Company & Contact.** Identical in every respect to View 3a's Step 1 above — same five fields, same wording, same order, same gating. Breadcrumb reads "PATH A · DOOR TWO".

  **Step 2 — the nine EcoVadis questions (unchanged from v2.1):**

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

  Plus the transparency notice, "Submit" (Deep Teal `#37663E`), and "Back" (plain text, returns to Step 1).

- **User actions:** fill Step 1, advance, fill Q1–Q9, submit, or go back.
- **What happens next:** submit writes to `companies` and `submissions` (`path: "ecovadis"`, `door: "ecovadis_form"`, `answers` holding Q1–Q9), then opens View 7.

---

### View 4 — Path B: Full Assessment Door Chooser

Unchanged from v2.1 — two door cards (fill it in here / download and upload), a "Back" control.

---

### View 5 — Path B Door One: Guided Assessment Form

- **Purpose:** Capture who the supplier is, then walk them through S2–S7, one section per screen, ending in the declaration.
- **What is visible:**
  - Breadcrumb "PATH B · DOOR ONE" in Burnt Clay `#B35634`, uppercase, tracked.
  - **Eight steps total, in order: Company & Contact, S2, S3, S4, S5, S6, S7, Declaration.** ("S1" from v2.0/v2.1 is retired as a numbered assessment section — its five fields are exactly the universal opening step below, so it is not asked twice.)
  - A progress indicator showing the current step and total (eight). Current step marked Burnt Clay `#B35634`; completed and upcoming steps Silver `#DAD9D9`; accompanying text Deep Space Blue `#0B3142`.

  **Step 1 — Company & Contact.** Identical to View 3a's Step 1 — same five fields, same order, same gating (all five required, email valid) — presented as the first of the eight steps rather than as a form on its own page. No ESRS reference is shown for this step; it is identity, not assessment content.

  **Steps 2–7 — S2 through S7, unchanged in content, question set, and order from v2.1.** Each section's heading, ESRS reference (Deep Teal `#37663E`), and questions are exactly as specified in v2.1 — the full 28-question set across S2 (7), S3 (4), S4 (5), S5 (4), S6 (3), and S7 (5) — inside the form container treatment from Section 10.4, each question with its optional "Notes / evidence" field. "Back" and "Next" controls; "Next" is Burnt Clay `#B35634`.

  **Step 8 — Declaration, unchanged from v2.1:** fixed confirmation text, then:

  | Field | Type |
  |-------|------|
  | Authorised signatory name | Text, required |
  | Date | Date, required, defaults to today |
  | Accuracy confirmation | Checkbox, required — Deep Teal `#37663E` accent |

  Followed by the transparency notice and "Submit" in Deep Teal `#37663E`.

- **User actions:** fill Step 1, move through Steps 2–8, submit on Step 8, or leave via Back on Step 1 (returns to View 4).
- **What happens next:** submit writes to `companies` and `submissions` (`path: "full"`, `door: "assessment_guided"`, `answers` holding the 28 S2–S7 answers plus notes, `signatory_name`, `declaration_date`), then opens View 7.

---

### View 6 — Path B Door Two: Download and Upload

- **Purpose:** Capture who the supplier is, then serve the official template and accept it back, completed.
- **What is visible, in this order:**

  **Step 1 — Company & Contact.** Identical to View 3a's Step 1. Breadcrumb "PATH B · DOOR TWO". This step comes first — before the download panel — so the identity is on record even if the supplier abandons the flow after downloading the template.

  **Step 2 — Download panel.** Unchanged from v2.1: Silver `#DAD9D9` panel, "Step one — download the template", "Download Assessment" button in Burnt Clay `#B35634`, downloading `/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx`.

  **Step 3 — Upload panel.** Unchanged from v2.1: Silver `#DAD9D9` panel, "Step two — upload the completed file", file picker accepting `.xlsx`/`.csv`, per Section 10.4.

  **On a rejected file:** unchanged — the specific rejection message from Section 9.1 in Burnt Clay `#B35634` text, no panel, no icon. File cleared, supplier can retry.

  **On an accepted file:** the review table, now covering the **28 S2–S7 questions only** — the two former S1 rows in the template are not read into the review table at all, since that identity is already captured in Step 1. Everything else about the table is unchanged: grouped by section, editable Mint Cream fields with Deep Teal bottom borders, blank answers marked "Not answered" in Burnt Clay `#B35634`, Status column ignored.

  Below the review table: the declaration block (signatory name, date, accuracy checkbox), the transparency notice, and "Submit" in Deep Teal `#37663E`.

  A "Back" control at every stage returns to the previous step; "Back" on Step 1 leaves the door and returns to View 4.

  > **Corrected at build, v3.0 session 3.** This line originally read "A 'Back' control at every stage returns to View 4," which contradicted Views 3a and 3b — where Back on Step 2 returns to Step 1 — and would have discarded the Company & Contact step the supplier had just completed. Back is one step back in every door; only Back on Step 1 exits.

- **User actions:** fill Step 1; download the template; choose a file; correct or complete answers in the review table; fill the declaration; submit; go back.
- **What happens next:** submit writes to `companies` and `submissions` (`path: "full"`, `door: "assessment_upload"`, `answers` holding the 28 parsed/edited S2–S7 answers, `attached_file_name`, `attached_file_size`, `signatory_name`, `declaration_date`), then opens View 7.

---

### View 7 — Confirmation

- **Purpose:** Acknowledge the submission on screen. This is the end of every door.
- **What is visible:**
  - Page background Mint Cream `#EEF4F0`. H2 "Submission complete." in Deep Space Blue `#0B3142`, DM Sans Medium.
  - A summary block, styled as a Silver `#DAD9D9` panel per Section 10.4, all text in Deep Space Blue `#0B3142`. It states: which path was taken; which door was used; the company legal name and contact email as entered; for View 3a — the three EcoVadis headline fields and the attached filename; for View 3b — the number of Q1–Q9 answered, out of 9; for View 5 and View 6 — the number of S2–S7 questions answered, out of 28, and the file name where applicable; the signatory name and declaration date for Path B; and the submission timestamp.
  - The transparency notice from Section 7 — **"Your information is stored for The Corporate's review."** — in Deep Space Blue `#0B3142`.
  - A short "What happens next" restatement pointing at the 30 September 2026 deadline and the EHS Help Desk mailto. Body text Deep Space Blue `#0B3142`; deadline emphasis and mailto link in Burnt Clay `#B35634`.
  - One action: **"Start another submission" in Burnt Clay `#B35634`.** This resets the browser's in-progress form state and returns to the landing page. It does not, and cannot, undo the database write that already happened — the submission that was just made stays saved.
- **User actions:** read the summary; start another submission; use the Help Desk link.
- **What happens next:** starting another submission resets in-browser state only, so the supplier (or a colleague) can submit again with a clean form. Closing the tab has no effect on what was already saved.

---

## Section 9 — Logic and Calculations

Unchanged from v2.1 except where noted below. This tool still performs no scoring, grading, or calculation.

### 9.1 — Upload validation (View 6)

Unchanged in checks 1–4 and the failure-message table from v2.1. Two changes:

- **S1 rows are no longer read.** Where v2.1's parser previously attempted to split the template's combined S1 cells into fields, it now simply skips those rows entirely — that identity is captured by Step 1 of the door, not by the file. The parser reads columns E (Supplier Response) and F (Notes/Evidence) only for the 28 S2–S7 question rows.
- Check 5 (every question text present, in order) now applies to the **28 S2–S7 question texts**, not 30.

**Deliberately tolerated defects — unchanged, both still concern S2–S7 rows and are unaffected by the S1 change:**

| Template defect | Parser behaviour | Guided form behaviour |
|-----------------|------------------|----------------------|
| Row 23 ("Specify source.") is tagged `S5` but belongs to Water & Marine Resources, E3-2. | Match by question text, not section tag. Accept `S5` without complaint. | Present as S4-2, inside Water & Marine Resources. |
| Row 12 ("Specify scope 3 categories included.") has no response, notes, or status cells. | Read columns E and F as empty if absent. | Present as S2-4 with a normal answer field and notes field. |
| No dropdown question carries an option list. | Accept whatever text the supplier typed, verbatim. Never reject for not matching an option. | Present the option sets defined in Section 8. |

**Edge cases:** unchanged — an empty file, a file with the right structure but no answers, and a file where every answer is blank all pass validation and land on the review table with everything marked "Not answered". Over 10 MB is rejected with the same message as v2.1. Selecting a second file replaces the first entirely.

### 9.2 — Conditional questions

Unchanged from v2.1 — the PFAS (S3-2) and water-stress (S4-3) rules apply identically in the guided form and the upload review table, rendered as Burnt Clay `#B35634` inline notices.

### 9.3 — Submit gating

| Step / Door | Cannot advance/submit until |
|------|--------------------------|
| Step 1 — Company & Contact (every door) | All five fields are filled and the contact email is a valid email address. |
| View 3a — Scorecard details | Publication and valid-until dates are valid dates; overall score is a number 0–100; a file is attached. |
| View 3b — EcoVadis questions | Both dates are valid; every score present is a number 0–100. Scores may be left blank if the scorecard does not include that theme. |
| View 5 — Guided assessment | Every conditionally-required question triggered under 9.2 is answered; the signatory name is filled, the date is valid, and the accuracy checkbox is ticked. Non-required S2–S7 questions may be left blank — a genuine gap is a valid answer. |
| View 6 — Upload review | Same rules as View 5, applied to the reviewed answers. |

Blocked submissions show which fields need attention; the guided form jumps to the step containing the first of them. Field-level validation messages render in Burnt Clay `#B35634`.

### 9.4 — Confirmation summary

**Inputs:** the session state object for the current door, plus the company/contact values from Step 1.
**Output:** the summary block in View 7.
**Answered-question count:** a question counts as answered if its response field contains any non-whitespace character. Notes/evidence fields do not count. Step 1's identity fields are never included in this count — they are mandatory and shown separately.

| Door | Denominator | Why |
|------|-------------|-----|
| View 5 — guided assessment | 28 | S2–S7 only; identity moved to Step 1, declaration is shown separately |
| View 6 — upload review | 28 | Same 28 S2–S7 rows the parser reads |
| View 3b — EcoVadis form | 9 | Q1–Q9, unchanged |
| View 3a — EcoVadis upload | No count — list the three headline fields and the attached filename instead | |

**Timestamp:** generated at the moment of submit (and stored as `submissions.submitted_at`), in the visitor's local timezone for display, formatted "10 September 2026, 14:32".

### 9.5 — Submit failure (added at build, v3.0 session 3)

Not present in the authored spec. Every door's "what happens next" describes the successful write and nothing else, which would have left a failed write showing "Submission complete." above the words *"Your information is stored for The Corporate's review."* — a claim that would be false. This build treats that as unacceptable, and the case is realistic rather than theoretical: the Free plan pauses after roughly a week without traffic, and a paused project refuses writes.

| Condition | Behaviour |
|-----------|-----------|
| Either write fails, for any reason | Stay on the door. Do **not** advance to View 7. Nothing is cleared — every answer the supplier typed is still on screen and still editable. |
| Message | Burnt Clay `#B35634` body text, no panel and no icon, per 10.6: "Your submission could not be saved. Nothing has been sent. Check your connection and try again — your answers are still here." |
| Retry | The submit control re-enables; submitting again retries both writes. |
| In flight | The submit control is disabled from the moment it is pressed until the write resolves, so a double-click cannot write two `submissions` rows. |
| Partial failure | The company write succeeding and the submission write failing leaves a `companies` row with no `submissions` row. That is acceptable and self-correcting — the next successful submission from that company reuses the same row via the Section 5 matching rule. |

View 7 is reached only after both writes have succeeded.

---

## Section 10 — Brand and Visual Direction

Unchanged from v2.1 in full — the `data-leaf-brand` skill, the palette, typography, voice, and the six visual sub-sections (10.1 why the v2.1 direction exists, 10.2 the dark hero band, 10.3 the dark card treatment, 10.4 the form treatment, 10.5 button hierarchy, 10.6 notices/errors/states) all carry forward exactly as specified in v2.1 Section 10. The new Company & Contact step uses the existing form treatment (10.4 in v2.1's numbering) with no new visual pattern. Claude Code should treat v2.1 Section 10 as still authoritative and apply it to the new opening step exactly as it applies to every other form surface.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Supabase | Database for `companies` and `submissions` | Anon key (public, browser-safe) — used by the frontend to insert/update rows | Netlify environment variable |

There is no AI, email, or other external service in this build. The template remains a static asset in `/assets/`. Spreadsheet parsing uses SheetJS, bundled at build time. The Contact EHS link is a `mailto:`.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase anon key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |
| Supabase service role key | Created by Claude Code with the project (not used by the frontend; kept for any future server-side/admin work) | Supabase dashboard → Project Settings → API |

Nothing needs to be prepared by the builder before the build session — Claude Code creates the Supabase project and its keys during First Session Setup, after confirming the project name.

---

## Section 12 — Out of Scope — Phase 2

Claude Code will not build anything listed here.

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Any review or admin screen inside the portal | Confirmed decision — for this version, The Corporate reviews submissions directly in the Supabase table editor. An in-portal review screen needs access control, which needs login, which is v4. |
| Login of any kind — for suppliers or for The Corporate's internal team | Confirmed decision — v4. The database (`companies` separate from `submissions`) is shaped so v4 can add auth without restructuring data, but no auth is built now. |
| Save-and-resume for a supplier mid-submission | Requires login to know whose in-progress submission to resume. Deferred to v4. |
| Storage of the actual uploaded/attached files (EcoVadis PDF, uploaded workbook) | Confirmed decision — only filename and size are recorded. The parsed/typed answers are the source of truth. |
| Any delivery of a submission notification — email, webhook, API | Confirmed decision — no email arm in this build. |
| Download of the supplier's own completed answers at the end | Considered and declined again for this build — same as v2.1. |
| Internal EHS review dashboard | Requires login and RLS — a Tier 3 build, likely as a second tool sharing this Supabase project once v4 exists. |
| AI scoring or gap analysis of submitted answers | Requires the AI API arm and a defined scoring methodology. Not needed to validate persistence. |
| Automated EcoVadis scorecard validation | Requires EcoVadis API access. Deferred pending API availability. |
| Reading or parsing the uploaded EcoVadis PDF | The attachment is held only long enough to record its filename; contents are never read. |
| Submission tracker showing Tier 1 response rates | Would sit on top of the same data this version now stores, but needs a review UI (deferred above) to be useful. |
| Formal GDPR consent flow (checkbox, deletion mechanism) | Confirmed decision — this is a class/portfolio build, not a live production deployment; see Section 7. |
| Dark mode, theme switching, or any user-selectable colour scheme | Unchanged from v2.1 — no toggle. |
| Animation beyond the two specified transitions | Unchanged from v2.1 — hero smooth-scroll and the 200ms timeline hover only. |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|---------------|-----------------|-------|
| 1 | Landing page, path chooser, and door choosers render exactly as in v2.1 | No visual or structural regression on Views 1, 2, 4 | [ ] |
| 2 | Every door opens with the same Company & Contact step first | View 3a, 3b, 5, and 6 each show the identical five-field step (legal name, registered country, contact name, title, email) as the very first screen inside that door, before any door-specific content | [ ] |
| 3 | Company & Contact step gates correctly | Cannot advance past it with any of the five fields empty, or with an invalid contact email | [ ] |
| 4 | Submitting writes to Supabase | On every successful submit, a `companies` row exists (new or reused) and a new `submissions` row exists, linked by `company_id`, with `path`, `door`, `answers`, and `submitted_at` populated correctly for that door | [ ] |
| 5 | Repeat submissions reuse the company record | Submitting twice with the same company legal name (case/whitespace variations included) produces one `companies` row and two `submissions` rows, not two company rows | [ ] |
| 6 | A new company name creates a new company record | Submitting with a legal name not previously seen creates a new `companies` row | [ ] |
| 7 | Contact details refresh on repeat submission | Submitting again with the same company name but a different contact name/title/email updates that company's stored contact fields | [ ] |
| 8 | Guided assessment (View 5) covers eight steps: Company & Contact, S2–S7, Declaration | All 28 S2–S7 fields render with correct ESRS references, types, and option sets; back/next work without losing answers; "S1" does not appear as a numbered section anywhere | [ ] |
| 9 | Upload review (View 6) reads exactly 28 questions | The two S1 rows in the template are not read into the review table; all 28 S2–S7 rows are, with the two documented template defects still tolerated | [ ] |
| 10 | EcoVadis doors (3a, 3b) no longer ask for identity in their own fields | View 3a's Step 2 has exactly three fields (publication date, valid until, overall score) plus the file picker; View 3b's Step 2 has exactly Q1–Q9; identity appears only in each door's Step 1 | [ ] |
| 11 | Files are never stored | No network request uploads the attached PDF or the workbook file itself to Supabase or anywhere else — only filename and size reach the database, inside the `submissions` row | [ ] |
| 12 | Confirmation screen reflects persistence accurately | View 7 shows the updated notice "Your information is stored for The Corporate's review." — not the old "stays in your browser" claim — and the summary matches what was actually written to the database | [ ] |
| 13 | "Start another submission" does not affect saved data | Clicking it resets the browser form to empty; the previously submitted `submissions` row remains unchanged in Supabase | [ ] |
| 14 | Answered-question counts are correct | View 5 and View 6 summaries count out of 28; View 3b counts out of 9; View 3a lists the three headline fields and filename with no count | [ ] |
| 15 | PFAS and water-stress conditional rules still work | Unchanged behaviour from v2.1, verified in both the guided form and the upload review table | [ ] |
| 16 | Visual treatment matches v2.1 throughout, including the new step | Dark hero, card treatments, form treatment (including on the new Company & Contact step), and button hierarchy are all applied with no regression and no new patterns invented | [ ] |
| 17 | No login, no account, anywhere in the build | The tool remains fully usable with no sign-up or sign-in step of any kind | [ ] |
| 18 | Supabase project created correctly | Project `the-corporate-supplier-portal` exists on the Free plan; `companies` and `submissions` tables exist with the fields in Section 5; docs/supabase-setup.md is created and accurate | [ ] |
| 19 | Responsive on mobile | The new Company & Contact step, and all other forms, remain usable one field group at a time on a narrow screen, consistent with v2.1's responsive behaviour | [ ] |
| 20 | Deploys to Netlify | Live URL loads on desktop and mobile; the template downloads correctly; submissions made on the live site appear in the Supabase table editor | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 2

---

### Pre-build steps — complete these before opening Claude Code

- [ ] Tool Architect skill — interview complete, this spec is written and confirmed by the builder
- [ ] Project Governor skill — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created by the builder
- [ ] product-spec.md uploaded to the GitHub repo root
- [ ] CLAUDE.md uploaded to the GitHub repo root
- [ ] PROGRESS.md uploaded to the GitHub repo root
- [ ] `data-leaf-brand` skill file uploaded flat to the GitHub repo root (unchanged from v2.1 — no new brand work needed)
- [ ] `The_Corporate_Supplier_Questionnaire_2026.xlsx` present in `/assets/` in the repo
- [ ] Netlify connected to the GitHub repo (Netlify MCP is not active for this build)
- [ ] No credentials to prepare manually — Supabase keys are created by Claude Code during the build session

---

### Tier 2 — build session

- [ ] Open Claude Code in the project folder (GitHub repo connected to Netlify)
- [ ] Claude Code runs First Session Setup: creates `docs/`, moves reference files, installs `data-leaf-brand` to `.claude/skills/`
- [ ] Claude Code reads product-spec.md, CLAUDE.md, and PROGRESS.md
- [ ] Claude Code proposes the project name `the-corporate-supplier-portal`, waits for the builder's confirmation, then creates the Supabase project via MCP
- [ ] Claude Code builds the `companies` and `submissions` tables per Section 5, then **enables RLS on both and creates the policies in Section 6** — RLS is required at Tier 2, login or no login. `companies` gets no anon policy at all; `submissions` gets insert-only. Company match-or-insert goes through the `resolve_company` `SECURITY DEFINER` function.
- [ ] Claude Code creates docs/supabase-setup.md recording the project name, project ID, both tables, and their fields
- [ ] Claude Code reads v2.1's visual direction (carried into this spec's Section 10) before writing any markup — it is binding and applies to the new Company & Contact step exactly as to every other form
- [ ] Claude Code builds the new Company & Contact step, reused identically across Views 3a, 3b, 5, and 6, and removes the identity fields that previously sat inside those views
- [ ] Claude Code builds the submit logic that writes to `companies` (insert-or-update-on-match by legal_name) and `submissions` for every door
- [ ] Claude Code builds the tool
- [ ] Test locally before deploying — including at least one repeat submission from the same company name to confirm the company record is reused, not duplicated
- [ ] Visual QA pass against acceptance criteria 1, 2, 10, 16, and 19 before deployment
- [ ] Push to main → Netlify deploys automatically
- [ ] Optional post-build: run the Supabase QA skill to verify the schema

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| Everything carried from v2.1's open questions (logo file, nav treatment above the hero, "Why We Are Asking" overline wording, resource document URLs, EcoVadis badge options) remains open and unaffected by this version's changes. | Builder | No — see v2.1 Section 15 for the individual items; none block this build |
| Should a future version show the supplier a reference number for their submission (even without login), so they have something to quote if they contact the EHS Help Desk about it? | Builder | No — not built in this version; noted for v4 discussion |
| What is the deployed URL for this tool? | Builder | No — confirmed after first deployment |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 12 June 2026 | Retroactive spec of the original static supplier onboarding page. Static, D1, Tier 1. |
| v2.0 | 4 September 2026 | In-portal submission across four doors, ending in an on-screen confirmation. Data model D1 → D2 (session-only). Frontend flat HTML → React + Vite + Tailwind. Brand → `data-leaf-brand`. |
| v2.1 | 6 September 2026 | Visual direction pass only — dark hero band, card and form treatments, button hierarchy, timeline hover. No change to data model, access model, tier, arms, views, or logic. |
| v3.0 | 10 September 2026 | Data model D2 → D3: a new Supabase project (`the-corporate-supplier-portal`) persists every full submission. Tier 1 → Tier 2. New universal Company & Contact opening step added as the first screen inside every door (Views 3a, 3b, 5, 6), replacing identity fields previously scattered inside each door and retiring "S1" as a numbered assessment section — S2–S7's 28 questions are now the full assessment content. Submissions link to a reusable `companies` record, matched by legal name, so repeat submissions from the same company accumulate under one record. Files (EcoVadis PDF, uploaded workbook) remain unstored — filename/size only. Transparency notice updated from "stays in your browser" to "stored for The Corporate's review." GDPR confirmed not applicable — class/portfolio context, no consent flow built. No login, no review UI inside the portal, and no email/AI/scheduled arms added — all confirmed deferred to v4 and beyond. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
