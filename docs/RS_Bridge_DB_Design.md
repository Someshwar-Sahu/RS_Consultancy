# RS Bridge Consultancy — DB Design Doc

Status: **In progress, built incrementally, one entity at a time, confirmed with founder before lock.**

---

## Module 1: Candidate

### `candidates`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| full_name | text, required | |
| mobile | text, required, unique | dedup key — re-submission updates existing row, not new |
| email | text, required | |
| current_location | text | |
| preferred_job_location | text | |
| experience_level | enum(Fresher, Intermediate, Expert) | broad bucket, fast filter |
| total_experience_years | decimal | auto-computed from `experiences` on save, user-editable override |
| preferred_category | enum(IT, Sales&Marketing, BPO, BackOffice, Permanent, Bulk) | explicit column, not a table — fast filter, no join |
| expected_salary | text | free text, e.g. "4-5 LPA" |
| notice_period | text | |
| created_at | timestamp | |
| updated_at | timestamp | |
| created_by | uuid, fk → users.id | employee who added record |
| user_id | uuid, fk → users.id, nullable, unique | *(added in Module 6)* bidirectional backref — null if candidate hasn't been given login access yet |

### `skills` (master list, seeded/curated)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| name | text, unique | e.g. "React", "Tally", "Cold Calling" |
| category | text | which hiring line it belongs to, for grouping in UI |

Seed includes special row: `"No Specific Skill (Fresher)"` — always selectable, no empty state.

### `candidate_skills` (junction)
| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid, fk | composite pk with skill_id |
| skill_id | uuid, fk | |

No proficiency field — presence only. Keeps it simple, freshers can't self-rate honestly anyway.

### `education` (multiple rows per candidate)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| candidate_id | uuid, fk | |
| degree | text | "B.Tech", "12th", "MBA" |
| specialization | text, nullable | |
| institution | text | |
| year_of_passing | int | |
| grade | text, nullable | CGPA/% |

### `experiences` (multiple rows, empty = fresher)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| candidate_id | uuid, fk | |
| company_name | text | |
| position | text | |
| start_date | date | |
| end_date | date, nullable | null = current job |
| description | text, nullable | |

Sum of (end_date - start_date, or today - start_date if null) across rows → auto-computed suggestion for `candidates.total_experience_years`.

### `resumes` (multiple per candidate — key feature)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| candidate_id | uuid, fk | |
| label | text | e.g. "IT CV", "Sales CV", "General" — candidate names it |
| file_url | text | Cloudflare R2 link |
| is_default | bool | |
| uploaded_at | timestamp | |

Candidate can hold multiple CV versions. When applying to a specific job (see `applications` table, later module), they pick which resume version to attach.

---

## Decisions Locked
- Skills normalized via master table + junction — no free-text arrays, no per-skill heavy metadata.
- Candidate status is NOT global — will live on `applications` (per-job-application status), not on `candidates`. Same candidate can be Shortlisted for Job A, Rejected for Job B simultaneously.
- Multi-resume model confirmed as good approach for fresher/intermediate/expert breadth.
- Experience years: hybrid auto-calc + manual override, app-layer logic (no DB triggers, keeps it simple).

---

## Module 2: Company

Structure: **Company** (brand/parent) → **CompanyBranch** (contract lives here, one per state/location) → **CompanyContact** (multiple HRs per branch). Handles: same company with different contracts per state, multiple HR contacts per branch, and commission terms that can be uniform or overridden per job requirement later.

### `companies`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| company_name | text, required | |
| industry | text, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |
| created_by | uuid, fk → users.id | |

### `company_branches`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| company_id | uuid, fk | |
| branch_label | text | "Noida HQ", "Pune Office" |
| address | text | |
| city | text | |
| state | text | |
| default_commission_rate | decimal | 8.33–25%, applies unless a job requirement overrides |
| default_payment_terms_days | int | 30–45 typical |
| default_replacement_window_days | int | 60–90 typical |
| status | enum(Lead, Active, Inactive) | |
| terms_agreement_signed | bool, default false | *(added in Functionality doc, CompanyContact Routes)* gates real resume/contact reveal at interview stage |
| terms_signed_at | timestamp, nullable | |
| terms_signed_by_name | text, nullable | typed full name at acceptance — acts as signature |
| terms_signed_ip | text, nullable | audit trail |
| terms_version | text, nullable | which version of T&C text was accepted — terms can update later without invalidating old signatures |
| terms_snapshot_url | text, nullable | exact text/PDF shown at signing time, stored immutably (R2) — proof of what was agreed to |
| created_at | timestamp | |
| updated_at | timestamp | |

### `company_contacts` (multiple HRs per branch)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| company_branch_id | uuid, fk | |
| contact_person | text, required | |
| designation | text, nullable | "HR Manager", "Talent Head" |
| mobile | text | |
| email | text | |
| is_primary | bool | default contact for quick reference |
| created_at | timestamp | |
| updated_at | timestamp | |
| user_id | uuid, fk → users.id, nullable, unique | *(added in Module 6)* bidirectional backref — null if this HR hasn't been given login access yet |
| is_approved | bool, default false | *(added in Functionality doc, Company Self-Join flow)* self-added HR contacts to an existing company stay unapproved — login stays inactive — until Admin manually verifies. Contacts created via the original `/companies/inquire` Lead flow are approved automatically as part of that Lead review (same admin gate, different entry point). |

**Three separate gates exist across Company/CompanyBranch/CompanyContact — do not conflate them, they serve different purposes:**
1. `company_branches.status` (Lead/Active/Inactive) — Admin's **business relationship classification**. Changed manually as the relationship matures.
2. `company_contacts.is_approved` — **fraud/identity gate** for a specific person's login. Blocks account activation until Admin confirms this person is really affiliated with the company.
3. `company_branches.terms_agreement_signed` — **legal gate** specifically for interview-stage real-contact reveal (Anti-Disintermediation rule, Module 4). Independent of the other two — a branch could be `Active` with an `is_approved` contact and still have zero interview-stage reveals until terms are separately signed.

A branch/contact can be in any combination of these three states simultaneously — they are not sequential steps of one flow, they're three independent checks for three independent risks (business fit, identity fraud, legal/financial protection).

## Decisions Locked (Module 2)
- Commission/payment/replacement terms live at branch level as defaults, with per-job-requirement override capability (nullable override columns, designed in Module 3).
- Multiple HR contacts per branch supported via separate junction-style table — no rework needed if brochure's "one contact" assumption changes.
- Login/auth deliberately deferred to its own final module — `users` table will be role-based (Admin, Employee, CompanyContact, Candidate) with nullable FKs out to the relevant profile table depending on role.

---

## Module 3: Job Requirement

The actual vacancy a company branch posts. Commission/payment/replacement terms inherit from branch default unless overridden per-role here (nullable override columns).

### `job_requirements`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| company_branch_id | uuid, fk | |
| job_title | text, required | |
| category | enum(IT, Sales&Marketing, BPO, BackOffice, Permanent, Bulk) | matches candidate.preferred_category for matching |
| no_of_vacancies | int | covers bulk hiring too — no separate structure needed |
| job_location | text | |
| qualification_required | text | |
| experience_required | text | "0-1 yr", "3-5 yr" |
| salary_range | text | |
| job_description | text | |
| expected_joining_date | date, nullable | |
| commission_rate_override | decimal, nullable | null = inherit branch default |
| payment_terms_days_override | int, nullable | null = inherit branch default |
| replacement_window_days_override | int, nullable | null = inherit branch default |
| status | enum(Open, OnHold, Filled, Cancelled) | auto-flips to Filled — see rule below |
| created_at | timestamp | |
| updated_at | timestamp | |
| created_by | uuid, fk → users.id | |

### `job_requirement_skills` (junction)
| Column | Type | Notes |
|---|---|---|
| job_requirement_id | uuid, fk | composite pk with skill_id |
| skill_id | uuid, fk | |

## Decisions Locked (Module 3)
- Bulk hiring = just a category tag + `no_of_vacancies` count, no separate schema structure.
- Required skills linked via junction table (many-to-many with `skills`) — enables future AI/overlap-based candidate matching.
- **Business rule (app-layer, not schema):** when candidate applies with little/no skill overlap vs job's required skills, show a dismissible warning — never a hard block.
- **Auto-cleanup rule — SUPERSEDED, see Module 5:** `vacancies_filled` is NOT computed from Application status. The correct, final rule is `count(Placements where is_active=true)` — defined in full in Module 5, because it needed to account for resignation/replacement reopening logic that didn't exist when this module was first written. When `vacancies_filled == no_of_vacancies`, status auto-transitions to `Filled` and drops off active/open listings. Admin can manually reopen (status → Open) if more vacancies added later.
- User/Auth table design confirmed as planned: separate `users` table, role enum, nullable FKs out to relevant profile table per role — O(1) lookup, built as final module.

---

## Module 4: Application (Pipeline)

Core entity linking Candidate ↔ JobRequirement, tracks the 7-step process.

### `applications`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| candidate_id | uuid, fk | |
| job_requirement_id | uuid, fk | |
| resume_id | uuid, fk → resumes.id | which CV version used |
| status | enum(New, Screening, Shortlisted, InterviewScheduled, Interviewed, Selected, Joined, Rejected, OnHold, Withdrawn) | |
| current_stage_notes | text, nullable | employee running notes |
| interview_date | timestamp, nullable | |
| rejected_reason | text, nullable | |
| share_rejection_with_candidate | bool, default false | *(added in Functionality doc, Candidate Routes)* company/employee opts in per-application to reveal reason to candidate — default hidden |
| applied_at | timestamp | |
| updated_at | timestamp | |
| assigned_employee_id | uuid, fk → users.id | which employee owns this application — built for team growth beyond current 2 founders |

**Constraint:** `unique(candidate_id, job_requirement_id)` — prevents duplicate/spam applications to the same posting. A genuinely new job requirement (new id, even same company/title, created after old one closes) is a separate row — candidate can naturally apply again. No cooldown-timer logic needed; constraint + status flow (Filled/Cancelled) already produces the desired behavior.

### `application_status_history`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| application_id | uuid, fk | |
| from_status | enum, nullable | |
| to_status | enum | |
| changed_by | uuid, fk → users.id | |
| changed_at | timestamp | |
| note | text, nullable | |

**Visibility rule (access-layer, not schema):** a company only sees status history for applications under their own job requirements (`job_requirement.company_branch_id` ownership filter) — never another company's data.

---

## Cross-Cutting Rule: Anti-Disintermediation

Real risk: if candidate and company can identify/contact each other directly through the platform, they cut RS Bridge out and the firm loses commission. This is an access-layer rule applied across Candidate, Company, and Application modules — not a schema change to already-locked tables.

**Note: this rule was refined during Functionality-doc discussion (CompanyContact Routes) — the version below is the FINAL rule, not the original absolute-masking version this section first stated.**

- **Candidate-facing views** (job listings, own applications): NEVER expose `company_name`, `company_branch.address/contact`, or any `company_contact.*` field. Company shown as "Confidential Client" (or similar) until firm decides to reveal, if ever. This restriction is unconditional — no exception exists on the candidate-facing side.
- **Company-facing views — staged, not absolute:** pre-interview stage, company NEVER sees `candidate.mobile`/`candidate.email` raw fields — only the platform-generated resume (skills/education/experience, no contact info). **At interview stage** (`application.status` reaches `InterviewScheduled` or later), real contact info IS revealed — but ONLY if `company_branch.terms_agreement_signed = true` (a one-time signed Terms of Business per branch, see Module 2 schema + Functionality doc's CompanyContact Routes for full reasoning). Masking cannot survive the interview step in practice (company must contact the candidate directly to interview them) — protection shifts at that point from technical masking to a signed legal agreement binding the company to pay commission regardless of channel.
- Pre-interview, all real coordination (scheduling, offer discussion) routes through the RS Bridge team (WhatsApp/email) — contact fields never handed to either side via the app itself before that stage.

**Resume file leak gap:** raw uploaded PDF almost always has candidate's phone/email printed in it — hiding the DB field doesn't help once company downloads the actual file.

**Decision: build the real fix, not a stopgap.** Platform will **generate its own branded resume PDF** from structured data (`education`, `experience`, `skills`, candidate summary) for company-facing pre-interview view — contact section replaced with "Contact via RS Bridge Consultancy." Candidate's original raw uploaded file is only served post-interview-stage under the same terms_agreement_signed gate described above — never shown to companies before that point. Both resume versions are generated/served lazily, on-demand, never pre-attached or preloaded (see Functionality doc, Audit Correction 5).

---

## Module 5: Placement

Final hire record — where commission/replacement tracking lives. Terms (commission %, payment terms, replacement window) are **snapshotted** from JobRequirement/branch at placement time, not referenced live — protects against retroactive recalculation if branch defaults change later.

### `placements`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| application_id | uuid, fk, unique | one placement per successful application |
| candidate_id | uuid, fk | denormalized, fast lookup |
| job_requirement_id | uuid, fk | denormalized |
| final_ctc | decimal | actual agreed salary |
| commission_rate_applied | decimal | snapshotted |
| commission_amount | decimal | final_ctc × commission_rate_applied / 100 |
| joining_date | date | |
| payment_terms_days_applied | int | snapshotted |
| replacement_window_days_applied | int | snapshotted |
| is_active | bool, default true | false once resignation verified — drives vacancy-reopen logic |
| left_date | date, nullable | |
| resignation_proof_url | text, nullable | company-submitted evidence — required before replacement flow triggers, prevents fraud |
| resignation_submitted_at | timestamp, nullable | |
| replacement_status | enum(WithinWindow, ReplacementTriggered, ReplacementCompleted, WindowClosed), default WithinWindow | `NA` dropped — dead state, every Placement starts WithinWindow at creation. `ReplacementCompleted` is terminal — one free replacement per original placement, consumed once, no repeat cycles (locked policy, see Functionality doc Flow 2). |
| replaces_placement_id | uuid, nullable, self-fk | traceable chain to the placement this one replaced |
| created_at | timestamp | |
| updated_at | timestamp | |

**Vacancy reopen rule (supersedes earlier Module 3 rule):** `job_requirement.vacancies_filled` = `count(Placements where is_active=true)`, NOT `Application.status=Joined` count. When a placement's `is_active` flips to false (post-verified resignation), the count drops and the requirement auto-reopens — existing candidate pool can apply again, or employee can directly move a known candidate into pipeline without re-application.

**Replacement flow:** candidate leaves within window → company must submit resignation proof (document) → admin verifies → `is_active=false` + `replacement_status=ReplacementTriggered` on old placement → requirement reopens → new hire made → new Placement row created with `replaces_placement_id` pointing to the original. No in-place row mutation — full audit trail preserved.

---

## Module 5b: Invoice

Kept separate from Placement — batching model (per-placement vs multi-placement batched invoice) not yet finalized, so decoupled via junction table now to avoid rework later.

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| company_branch_id | uuid, fk | invoices raised per branch, matches contract structure |
| invoice_number | text, unique | |
| status | enum(Draft, Sent, Paid, Overdue, Cancelled) | |
| issued_date | date | |
| due_date | date | |
| subtotal_amount | decimal | sum of linked placements' commission_amount, before tax |
| gst_applicable | bool, default false | snapshotted from firm's GST registration status (`site_settings`) at invoice creation — doesn't retroactively change if firm's registration status changes later |
| gstin | text, nullable | firm's own GSTIN, snapshotted at creation, only populated if gst_applicable |
| client_gstin | text, nullable | company's GSTIN, optional, for their records |
| tax_type | enum(None, CGST_SGST, IGST), nullable | intra-state vs inter-state — determines tax split |
| cgst_amount | decimal, nullable, default 0 | |
| sgst_amount | decimal, nullable, default 0 | |
| igst_amount | decimal, nullable, default 0 | |
| total_amount | decimal | subtotal_amount + tax — final billed amount |
| paid_date | date, nullable | |
| payment_source | text, nullable, default 'Manual' | how it was marked paid — 'Manual' now, room for 'Razorpay'/'BankWebhook'/etc. later without schema change |
| created_at | timestamp | |
| updated_at | timestamp | |

**Related `site_settings` keys:** `"firm_gst_registered"` (bool) and `"firm_gstin"` (text) — toggled by Admin as the firm's registration status actually changes. Not mandatory to ever be true; feature exists but isn't forced.

### `invoice_placements` (junction — supports 1:1 or batched invoicing)
| Column | Type | Notes |
|---|---|---|
| invoice_id | uuid, fk | |
| placement_id | uuid, fk | |
| amount | decimal | snapshot of commission_amount at invoicing time |

---

## Module 6: Users / Auth

Final core module — links Admin/Employee/CompanyContact/Candidate logins into everything already built.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| email | text, required, unique | login identifier |
| password_hash | text | NextAuth (Auth.js) handles hashing |
| full_name | text | used directly for Admin/Employee — they have no separate profile table |
| role | enum(Admin, Employee, CompanyContact, Candidate) | |
| candidate_id | uuid, fk, nullable, unique | set only if role=Candidate |
| company_contact_id | uuid, fk, nullable, unique | set only if role=CompanyContact |
| is_active | bool | disable access without deleting record |
| last_login_at | timestamp, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |
| invited_via | uuid, fk → user_invites.id, nullable | set only for Admin/Employee accounts created via invite flow — audit trail of who invited whom |

### `user_invites` (Admin/Employee onboarding only — Candidate/CompanyContact self-register directly, don't need this)
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| email | text, required | invitee's email |
| role | enum(Admin, Employee) | role being granted |
| token_hash | text | hashed invite token, raw token sent via email link, never stored plain |
| invited_by | uuid, fk → users.id | which Admin sent this invite |
| expires_at | timestamp | invite link expiry |
| accepted_at | timestamp, nullable | null = still pending |
| created_at | timestamp | |

## Decisions Locked (Module 6)
- Bidirectional FK: `users` → `candidates`/`company_contacts` AND back — added `user_id` (nullable, unique) columns to both `candidates` and `company_contacts` tables (patched into Modules 1 & 2 above).
- Password reset / email verification: handled via NextAuth's built-in magic-link/email-token flow — no custom OTP or reset-token table needed.
- **Access scope rule (app-layer):** a CompanyContact sees only requirements/applications/shortlists under their own `company_branch_id` — not other branches of the same parent company, even if same company_id. Prevents cross-branch data collision.
- **Employee/Admin account creation is invite-only**, via `user_invites` table — Admin enters new team member's email + role, system emails a signed token link, invitee sets their own password on accept. Admin never sees/sets another team member's password directly.

---

## Module 7: SiteSettings (utility)

Lightweight key-value table for admin-toggleable feature flags — avoids schema migrations for simple on/off product decisions (e.g. "is the public stats page currently the homepage").

### `site_settings`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| key | text, unique | e.g. `"stats_page_is_home"`, `"candidate_stats_enabled"` |
| value | text | store as JSON string if structured, plain string if simple flag |
| updated_at | timestamp | |
| updated_by | uuid, fk → users.id | |

---

## Module 8: InAppNotification

Different from the delivery/audit logging deliberately skipped in Module 7's notification design (that was provider-side WhatsApp/email logs, exportable via Meta/Resend dashboards). This is the actual **in-app notification panel state** — what a logged-in user sees inside the app itself (unread badge, notification list), independent of whether an email/WhatsApp was also sent for the same event.

### `in_app_notifications`
| Column | Type | Notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid, fk → users.id | recipient — works for any role, though primarily used by Employee/Admin for now |
| type | text | e.g. "ApplicationAssigned", "RequirementPendingApproval", "ResignationSubmitted", "InvoiceOverdue" — reusable across all internal event types, not just applications |
| title | text | |
| message | text | |
| link_url | text, nullable | deep link to relevant page, e.g. `/employee/applications/[id]` |
| is_read | bool, default false | |
| created_at | timestamp | |

---

## Core Data Model: Complete

All 8 modules locked: Candidate, Company (+Branch+Contact), Job Requirement, Application (+History), Placement (+Invoice), Users/Auth (+Invites), SiteSettings, InAppNotification. Anti-Disintermediation cross-cutting rule documented and applies across the model.

## Related documents
- Functionality / Page-Route map: see `RS_Bridge_Functionality_RouteMap.md`
- SRS: to be started once functionality map is further along
- Architecture doc: to be started once functionality map is further along
