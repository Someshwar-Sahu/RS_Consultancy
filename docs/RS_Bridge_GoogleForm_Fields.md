# RS Bridge Consultancy — Google Form Field Spec (interim intake, pre-app)

Purpose: minimal-friction forms to start collecting real data NOW, while the app is being built. Every field below maps directly to a DB column in `RS_Bridge_DB_Design.md`, so exported CSVs can be bulk-imported later with zero data loss and zero guesswork.

**Design principle:** short enough that people actually finish it. Anything not strictly needed to start a conversation later is left OUT — deep profile detail (education history, multiple resumes, skill tagging) happens inside the app after launch, not here.

---

## Form 1: Candidate Intake

| # | Question | Type | Required? | Maps to DB field | If left blank |
|---|---|---|---|---|---|
| 1 | Full Name | Short answer | Yes | `candidates.full_name` | — |
| 2 | Mobile Number (WhatsApp preferred) | Short answer | Yes | `candidates.mobile` | — (this is the dedup key, must be required) |
| 3 | Email | Short answer | Yes | `candidates.email` | — |
| 4 | Current Location (City) | Short answer | Yes | `candidates.current_location` | — |
| 5 | Are you a Fresher, or do you have work experience? | Multiple choice: Fresher / 0–2 years / 2–5 years / 5+ years | Yes | `candidates.experience_level` + rough `total_experience_years` | — |
| 6 | Which field are you looking for? | Multiple choice: IT / Sales & Marketing / BPO & Customer Support / Back Office / Permanent Role (Other) | Yes | `candidates.preferred_category` | — |
| 7 | Preferred Job Location | Short answer | No | `candidates.preferred_job_location` | Fill `"NA"` on import |
| 8 | Highest Qualification | Short answer | No | new `education` row, `degree` field | Fill `"NA"` on import |
| 9 | Current/Last Company & Position (if any) | Short answer | No | new `experiences` row, `company_name`/`position` | Fill `"NA"` on import |
| 10 | Expected Salary | Short answer | No | `candidates.expected_salary` | Fill `"NA"` on import |
| 11 | Notice Period | Short answer | No | `candidates.notice_period` | Fill `"NA"` on import |
| 12 | Upload Resume (PDF/Word) | File upload | Yes | `resumes.file_url` (label defaults to `"General"`) | — |

**Total: 12 questions, ~4 required-only if someone's in a rush.** Matches your instinct — nobody finishes a 20-field form.

---

## Form 2: Company / Hiring Requirement Intake

| # | Question | Type | Required? | Maps to DB field | If left blank |
|---|---|---|---|---|---|
| 1 | Company Name | Short answer | Yes | `companies.company_name` | — |
| 2 | Your Name (Contact Person) | Short answer | Yes | `company_contacts.contact_person` | — |
| 3 | Your Designation | Short answer | No | `company_contacts.designation` | Fill `"NA"` on import |
| 4 | Mobile Number | Short answer | Yes | `company_contacts.mobile` | — |
| 5 | Email | Short answer | Yes | `company_contacts.email` | — |
| 6 | City / Location of this office | Short answer | Yes | `company_branches.city` | — |
| 7 | Position(s) You're Hiring For | Short answer | Yes | `job_requirements.job_title` | — |
| 8 | Number of Vacancies | Short answer (number) | Yes | `job_requirements.no_of_vacancies` | — |
| 9 | Hiring Category | Multiple choice: IT / Sales & Marketing / BPO / Back Office / Permanent / Bulk Hiring | Yes | `job_requirements.category` | — |
| 10 | Experience Required | Short answer | No | `job_requirements.experience_required` | Fill `"NA"` on import |
| 11 | Salary Range Offered | Short answer | No | `job_requirements.salary_range` | Fill `"NA"` on import |
| 12 | Brief Job Description | Paragraph | No | `job_requirements.job_description` | Fill `"NA"` on import |
| 13 | Expected Joining Timeline | Short answer | No | `job_requirements.expected_joining_date` | Fill `"NA"` on import (needs manual date parse later) |

**Total: 13 questions, 8 required.** Commission/payment/replacement terms are deliberately NOT asked here — those get confirmed in writing separately by Admin, per your existing brochure process; a Google Form isn't the place to negotiate terms.

---

## Import Strategy (both forms)

- Every response becomes one row in the respective Google Sheet (auto-linked when you build the Form).
- Export that Sheet as CSV → feed into the Admin CSV Import feature (see `RS_Bridge_Functionality_RouteMap.md`, new Flow 5) once the app is live.
- Blank optional fields get `"NA"` inserted at import time, not left as empty strings — makes it visually obvious in the app which records need follow-up enrichment, versus a blank field that might just look like a bug.
- Mobile number is the dedup key on both sides (`candidates.mobile` unique, `company_contacts.mobile` not unique but paired with company name for dedup logic) — if the same person fills the form twice, import logic should update rather than duplicate.

## What's deliberately NOT in these forms (goes into the full app profile later)
- Candidate: multiple resume versions, detailed education/experience history, skill tagging
- Company: multiple branches, commission/payment/replacement term negotiation, Terms of Business signing

These require the actual app's structured UI to do properly — forcing them into a Google Form would defeat the "short form" goal you asked for.
