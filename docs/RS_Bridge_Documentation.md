# RS Bridge Consultancy — Project Documentation

Start here. This doc orients anyone (human or AI) new to the project before they touch any other doc.

---

## 1. What this is

RS Bridge Consultancy is a real recruitment/staffing consultancy operating in the NCR region (Delhi, Noida, Greater Noida, Ghaziabad), run by 2 founders. It connects hiring companies with job candidates across 6 hiring lines: Permanent Recruitment, Bulk Hiring, Sales & Marketing, BPO & Customer Support, Back Office & Administration, IT & Technical.

**Business model:** commission-based, paid by the hiring company only, never the candidate (8.33%–25% of annual CTC depending on role seniority), invoiced 30–45 days after candidate joins, with a 60–90 day free-replacement guarantee if the candidate leaves early.

**What's being built:** a full production web application (not just a marketing site) — candidate portal, company client portal, internal team dashboard, admin panel — replacing what was previously just a static brochure site with email-only form submissions.

## 2. Document map

| Document | What it covers | Read this when... |
|---|---|---|
| `RS_Bridge_DB_Design.md` | Full database schema, all 8 modules, cross-cutting rules | You need to know what data exists and how it relates |
| `RS_Bridge_Functionality_RouteMap.md` | Every page/route per role, 4 key business flows, notification system | You need to know what a specific page does or how a process works end-to-end |
| `RS_Bridge_Architecture.md` | Tech stack, folder structure, security enforcement, deployment | You're setting up the project or need to know WHERE something should live in code |
| `RS_Bridge_Testing_Plan.md` | What to test and how, per layer | You're writing tests or reviewing what "done" means for a feature |
| `RS_Bridge_SRS.md` | Formal requirements spec — the single source of truth if other docs ever disagree | You need the authoritative, numbered requirement list |
| `AI_INSTRUCTIONS.md` | Rules for any AI assistant working on this codebase | You are an AI about to write code for this project — read this FIRST |

## 3. Glossary — terminology that has caused real confusion before, be precise

| Term | Meaning | NOT to be confused with |
|---|---|---|
| **Employee** | Internal RS Bridge staff — screens candidates, runs the pipeline, works FOR the consultancy | ❌ NOT "CompanyContact" — this was an actual naming collision earlier in the project ("Recruiter" was used for both), now fixed by this rename |
| **CompanyContact** | HR person at a client company — posts requirements, reviews shortlists, works FOR the client | ❌ NOT "Employee" — see above |
| **Admin** | Owner/partner tier (the 2 founders) — full financial visibility, approval authority, verification authority | Distinct from Employee: Employee has operational access only, no financial figures, no approval power |
| **CompanyBranch** | Where the actual contract/commission terms live — one company can have multiple branches with different terms | Not the same as `Company`, which is just the parent brand record |
| **Placement** | A confirmed hire — the record that drives commission/invoice tracking | Not the same as `Application` (the pipeline record) — a Placement is created only once an Application reaches `Joined` |
| **Lead vs Active vs Inactive** | Business relationship classification on `CompanyBranch` | NOT the same as `terms_agreement_signed` (legal gate) or `is_approved` (fraud/identity gate) — 3 separate flags, see DB doc |

## 4. Core business rule to never lose sight of: Anti-Disintermediation

The entire point of this platform's access-control design is preventing companies and candidates from identifying each other and cutting RS Bridge out of the deal. This shaped almost every hard design decision in this project (masked resumes, staged contact reveal, signed Terms of Business, invoice-exclusion for free replacements). Any future feature request should be checked against this principle before being built — if it creates a path for company and candidate to bypass RS Bridge, it needs the same scrutiny this rule got during design (see DB doc, Module 4 cross-cutting rule).

## 5. Current build status (update this section as work progresses)

- [x] Database schema — fully designed, 8 modules locked
- [x] Route map — all 4 roles + public routes designed
- [x] Key flows — Application Submit, Company Self-Join, Resignation/Replacement, Invoice Lifecycle all designed
- [x] Notification system — designed
- [x] Architecture doc — written
- [x] Next.js 16 + TypeScript + Tailwind CSS setup
- [ ] Dev File Storage — local filesystem (`src/lib/storage.ts`) active for dev
- [ ] Production File Storage — Cloudflare R2 setup & credentials (DEFERRED TO PRE-PRODUCTION)
- [ ] Actual implementation — in progress
- [ ] Testing — plan written, tests not yet written
- [ ] Terms of Business legal text — pending founder's lawyer contact
