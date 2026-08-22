# RS Bridge Consultancy — Functionality / Page-Route Map

Status: **In progress, built incrementally, one role at a time, confirmed with founder before lock.**
Companion doc: `RS_Bridge_DB_Design.md` (schema this routing plan depends on).

Order: Public → Candidate → CompanyContact → Employee → Admin.

---

## Public Routes (no login)

```
/                          → Landing page (hero, mission, services, process — from brochure)
                             *(togglable — see Stats Page note below)*
/jobs                      → Public listing, capped ~30-40 newest Open jobs, WHERE status='Open' only
/jobs/[id]                 → Detail page, stays reachable via direct link/search even past listing cap.
                             If status flips Filled/Cancelled → shows "This position has been filled"
                             (better for SEO than 404, reinforces "consultancy is active")
/candidates/register       → Candidate self-signup + CV submit
/companies/inquire         → Company lead form → auto-creates Lead-status Company + Branch + first Contact
/login                     → Shared login, redirects by role post-auth
```

## Decisions Locked (Public Routes)
- Listing capped for signup nudge + clean UX; detail pages stay fully crawlable for SEO regardless of cap.
- No hard deletes anywhere in the system — job listings filter by status for display only. Placement/Invoice/ApplicationStatusHistory persist permanently as audit trail AND as the real data source for future public stats (e.g. "50+ placements made," computed from actual Placement rows, not fabricated).
- Company inquiry auto-creates Lead-status records (Company + Branch + Contact) — admin converts Lead → Active after terms are confirmed in writing, matching brochure's stated process.

---

## Feature: Transparency Stats Page (Candidate + Company variants)

Two separate stats routes, each showing role-relevant proof-of-work numbers computed from real Placement/Application data (never fabricated):

```
/stats/candidates          → e.g. "X candidates placed", "avg time to shortlist", success-rate style numbers
/stats/companies           → e.g. "X requirements filled", "avg time-to-fill", replacement-rate (low = good)
```

**Visibility rule:** both routes exist and are buildable now, but stay **silent/unlinked** (no nav link, not set as homepage) until founder manually flips a `site_settings` flag once there's enough real placement data to be worth showing — showing near-empty stats on a brand-new consultancy undermines trust rather than building it. Toggle controlled via `site_settings` table (`Module 7`):
- `key = "stats_page_is_home"` → if true, `/` redirects to `/stats/candidates` (or a combined view) instead of the standard landing page.
- Founder flips this manually via Admin panel once ready — no code deploy needed to change it.

**Anti-Disintermediation cross-check (correction — this was missed initially, flagging openly):** stats shown on both pages must be **aggregate-only, never broken down by named company or named candidate** — e.g. "50+ placements made," "12+ companies trust us," "avg 12 days to fill a role" are fine; "TechCorp filled 5 roles this month" is NOT fine. A per-company breakdown, cross-referenced against `/jobs` listings (same category/location/date range), could let a candidate deanonymize a "Confidential Client" — directly undermining the masking rule already locked in Module 4 of the DB doc. All stats queries must aggregate across the whole dataset, never expose a single company_id or candidate_id's numbers standalone.

**Package-bracket breakdown — safe, locked in:** stats CAN show placement counts by CTC bracket (e.g. "X candidates placed in ₹3-5 LPA", "Y placed in ₹8-12 LPA", "Z placed in ₹12+ LPA") computed from `placements.final_ctc`, grouped into ranges. Safe because a CTC bracket alone doesn't identify a specific company — many companies pay within the same range, no deanonymization risk. Adds real credibility ("we place across all levels") without naming anyone.

**Trust-signal for prospective companies — two independent toggle uses:** the `stats_page_is_home` flag controls whether `/stats/...` replaces the homepage — that's the "big swap," reserved for once there's substantial data. Separately, `/stats/companies` can be **linked directly from `/companies/inquire`** ("See our track record" CTA) as soon as there's even a handful of real placements — a prospective company researching whether RS Bridge is active needs this signal earlier than the full homepage swap makes sense. Same aggregate-only, package-bracket rule applies to this link; controlled by its own `site_settings` key (e.g. `"companies_inquire_stats_link_enabled"`) independent of the homepage flag.

---

## Candidate Routes (logged in)

```
/candidate/dashboard             → Overview: application count by status, quick links
/candidate/profile                → Edit core info, education, experience, skills
/candidate/resumes                 → Manage multiple CV versions (upload/label/set-default)
/candidate/applications             → List of all their applications + status (per-application, not global)
/candidate/applications/[id]        → Single application detail — status + interview_date + rejection reason (if shared)
/candidate/jobs                     → Same as public /jobs but personalized, gated apply button
```

## Decisions Locked (Candidate Routes)
- **Rejection reason visibility:** candidate CAN see `rejected_reason` on their own application, but only if the company/employee explicitly opts in per-application. New schema field added: `applications.share_rejection_with_candidate` (bool, default false) — patched into `RS_Bridge_DB_Design.md`, Module 4. Default hidden, company/employee choice to share.
- **`current_stage_notes` stays internal-only** — never shown on candidate-facing application detail, regardless of share flag. That field is for employee working notes, not candidate communication.
- **No self-service withdraw.** Candidate cannot flip their own application to `Withdrawn`. If they want out, they contact the RS Bridge team — gives the firm a chance to get feedback and potentially retain them in the pipeline. Withdrawal remains a employee/admin-only action.
- **Skill-match scoring** (e.g. showing "80% skill match" on `/candidate/jobs` using `job_requirement_skills` overlap) — schema already supports this (junction tables exist in both `candidate_skills` and `job_requirement_skills`), but scoring/display logic is a v1-nice-to-have, not blocking. Noted for build, not required for route lock.

---

## CompanyContact Routes (logged in)

```
/company/dashboard                → Overview: open requirements, active applications by stage
/company/branch                    → View own branch info, incl. terms agreement status
/company/branch/terms               → View T&C text (lawyer-drafted), checkbox + typed-name accept flow
                                      (blocks real resume/contact reveal until signed — see gate rule below)
/company/requirements               → List own branch's requirements only (access-scope rule, Module 6)
/company/requirements/new            → Submit new requirement → status=PendingApproval
                                      → triggers WhatsApp+email alert to admin (Notification System, designed later)
                                      → admin reviews, sets commission override if needed, flips status→Open
/company/requirements/[id]            → Single requirement + full applicant list (see visibility rule below)
/company/requirements/[id]/applications/[appId] → Single candidate view, masked or unmasked per gate rule
```

**2-Card Vacancy Posting Selector:** Upon visiting `/company/requirements/new`, the employer chooses via a 2-card selector:
1. `🏢 Corporate & Executive Roles (White-Collar)` — loads degree, tech/office skill, and CV-based fields.
2. `🚚 Drivers & Field Staff (Blue-Collar)` — loads driver-specific fields (License category LMV/HMV, vehicle types Sedan/SUV, experience years, onboarding timeline). Eliminates form confusion and irrelevance.

**Approval flow:** company cannot self-post a live requirement. Every submission starts `PendingApproval`, admin reviews and confirms terms in writing (matches brochure's stated process), then flips to `Open`. Fast admin response enabled via WhatsApp/email alert on submission — not by skipping the approval step.

**Applicant visibility — full funnel, not pre-filtered:** company sees ALL applicants regardless of status (New/Screening/Shortlisted/etc.), not just pre-screened ones. This works because contact info stays masked regardless of stage — full visibility doesn't create the disintermediation risk it would if masking were absent. Company applies filters themselves. Suggested filter set: skill (multi-select), experience level (Fresher/Intermediate/Expert), total experience (range), current/preferred location, qualification, expected salary (range), notice period, application status, applied date (range); sort by recency, experience, or skill-match % (if scoring feature built).

**Contact/resume reveal gate — this is the core trust-vs-risk resolution, locked after extended discussion:**
- **Pre-interview stage:** resume shown is the platform-generated version (name + skills/education/experience, NO phone/email) — matches Anti-Disintermediation rule already locked in Module 4.
- **At interview stage (`application.status` moves to `InterviewScheduled` or later):** real resume + contact info is revealed automatically — company needs this to actually conduct an interview, masking further would be impractical and was correctly identified as unworkable.
- **Gate condition:** this reveal is BLOCKED entirely unless `company_branch.terms_agreement_signed = true`. A branch cannot reach interview-stage reveal on ANY requirement until its Terms of Business agreement is accepted once (covers all future requirements from that branch — sign once, not per-candidate).
- **Why this works over pure in-app masking:** masking can't survive the interview step (company must contact candidate directly to interview them) — so protection shifts from a technical control to a **signed legal agreement** binding the company to pay commission on any candidate RS Bridge introduced who is later hired, regardless of channel. This is standard staffing-industry practice, not a new invention.
- **Terms acceptance mechanics:** checkbox + typed full name, captured with timestamp + IP + version + immutable snapshot of exact text shown (see `company_branches` schema additions, patched into Module 2 of DB doc). Legally valid in India under IT Act §10A + Indian Contract Act — confirmed via research, actual T&C drafting deferred to founder's lawyer contact, out of scope for this doc.

**Rejected explored options (keeping for record, avoids re-litigating later):**
- Pay-to-unlock-early-contact — rejected: a company could pay a small unlock fee and dodge a much larger commission with no enforcement mechanism.
- Trust-tier-based early reveal (reward repeat companies) — rejected in favor of the simpler universal rule: everyone gets the same reveal timing (interview stage), gated by the same signed agreement, not by relationship history. Simpler to build, doesn't require a "trust score," treats every company fairly from day one — which better matches the trust-first philosophy driving this whole decision.

---

## Employee Routes (logged in)

```
/employee/dashboard                    → "Assigned to me" by default (toggle: view all firm-wide)
                                          Shows: my active applications, upcoming interviews, pending tasks,
                                          my performance stats (placements made, pipeline count — no ₹ figures)
/employee/candidates                    → Full candidate DB search/browse — UNMASKED (internal team, no
                                          anti-disintermediation restriction applies internally)
/employee/candidates/new                 → Manually add candidate (walk-in, referral, phone intake)
/employee/candidates/[id]                 → Full profile view/edit
/employee/requirements                     → List requirements (scoped by assigned/all toggle)
/employee/requirements/[id]                 → Requirement detail
/employee/requirements/[id]/pipeline         → Kanban board: New→Screening→Shortlisted→InterviewScheduled→
                                              Interviewed→Selected→Joined/Rejected/OnHold. Drag-drop status
                                              change → auto-logs to ApplicationStatusHistory
/employee/requirements/pending-approval       → Company-submitted requirements awaiting review. Employee can
                                              add prep notes, verify details, flag "Ready for Admin Review" —
                                              cannot flip status to Open themselves (Admin-only action)
/employee/companies                            → View company/branch/contact records — can edit contact info,
                                              CANNOT edit commission_rate/payment_terms/replacement_window
                                              (Admin-only fields)
/employee/placements                            → Mark candidate as Joined (auto-creates Placement row —
                                              commission fields auto-snapshotted from branch/requirement
                                              defaults, employee never manually enters a %). Does NOT include
                                              resignation-proof review/replacement approval — Admin-only, see below.
```

## Decisions Locked (Employee Routes)

**Financial field masking — concrete rule, not vague:** Employee role is blocked from viewing these specific fields across the app: `company_branches.default_commission_rate/payment_terms_days/replacement_window_days`, `job_requirements.commission_rate_override` (and its 2 sibling overrides), `placements.commission_rate_applied/commission_amount`, `invoices.total_amount` and `invoice_placements.amount`. Employee still sees non-financial fields on these same records (status, dates, candidate/job info) — just not the ₹ figures. Admin/founder sees everything.

**"General overview that attracts, doesn't disclose"** — resolved as: employee dashboard shows **their own performance count** ("14 placements this quarter", "3 in interview stage") — real, motivating, zero currency figures. No firm-wide revenue total shown to Employee role either, only Admin.

**Commission auto-snapshot, not manual entry:** since `commission_rate_applied` is copied automatically from `job_requirement.commission_rate_override` (or branch default) the moment a Placement is created, the Employee marking someone "Joined" never needs to type in a percentage — the field-masking rule doesn't create a workflow gap, the system fills it silently in the background.

**Requirement approval stays Admin-gated:** Employee's `pending-approval` route is prep/flagging only — visually, the "Approve & set terms" action either doesn't render for Employee role or renders disabled, enforced at both UI and API layer (not just hidden button — actual permission check server-side, since a hidden button alone isn't real security).

**Resignation/replacement verification — Admin/founder only, confirmed.** Reviewing `resignation_proof_url` submissions and flipping `is_active=false` / `replacement_status` moves entirely to Admin Routes (next module) — matches the fraud-sensitivity already flagged when this field was designed; a control meant to prevent fraud shouldn't be approvable by the same tier of user it's meant to guard against being socially-engineered.

**Default view scope:** Employee dashboard/pipeline defaults to "assigned to me" (via `applications.assigned_employee_id`), with a toggle to view firm-wide — keeps focus for daily work while still allowing coordination visibility when needed. Matters once team grows beyond the current 2 founders.

---

## Admin Routes (logged in — Admin = owner/partner tier only)

```
/admin/dashboard                          → Firm-wide overview: revenue (paid + pending), overdue invoices,
                                           active pipeline count across ALL employees, replacement windows
                                           closing soon, pending company-requirement approvals
/admin/employees                           → List team members, invite new Employee, deactivate/reactivate
/admin/employees/invite                     → Send invite (email + role) — creates user_invites row
/admin/employees/[id]/performance            → Individual employee performance (placements, pipeline load)
/admin/companies                              → Full company/branch/contact management, incl. Lead→Active
                                            status change
/admin/companies/[id]/branches/[id]            → Branch detail — edit commission/payment/replacement defaults,
                                            view terms agreement audit trail (signed_at, IP, typed name,
                                            snapshot link)
/admin/requirements/pending-approval             → Review Employee-flagged requirements, set commission
                                            override, approve→Open or reject
/admin/placements                                 → Full placement list, financial fields visible
                                            (commission_rate_applied, commission_amount — Admin-only view)
/admin/placements/[id]/resignation-review          → Verify resignation_proof_url, confirm/deny replacement
                                            trigger — flips is_active=false + replacement_status (Admin-only,
                                            per fraud-sensitivity decision in Employee Routes module)
/admin/invoices                                     → Create/manage invoices, batch placements into one
                                            invoice, mark Paid/Overdue
/admin/settings                                      → site_settings toggles (stats_page_is_home,
                                            companies_inquire_stats_link_enabled, etc.)
/admin/stats                                          → Full internal stats — real per-company/per-candidate
                                            breakdown for Admin's own reference. NOT the same as public
                                            /stats/* routes (which stay aggregate-only, no identifying data)
```

## Decisions Locked (Admin Routes)

**Admin sees everything unmasked** — full financial data (commission %, invoice amounts, placement CTC), full candidate contact info, full company details, no restrictions. This is the "owner/partner" tier explicitly, distinct from Employee.

**Two separate "stats" concepts, not to be confused:** `/admin/stats` is Admin's real internal reporting (per-company breakdown, actual figures, for business decisions) — completely separate from the public `/stats/candidates` and `/stats/companies` routes (aggregate-only, anonymized, built earlier for trust-building). Same underlying data, two very different access levels and purposes. Worth keeping this distinction explicit in the doc so it's never accidentally merged into one view during build.

**Lead→Active is a separate concern from terms_agreement_signed — do not conflate:** `company_branch.status` (Lead/Active/Inactive) is Admin's business classification of the relationship ("are we actively working with this client"), changed manually once initial engagement feels real. `terms_agreement_signed` is the legal gate specifically for interview-stage contact reveal (Module 4/CompanyContact Routes). A branch could theoretically be `Active` before signing terms (e.g. early conversation, first requirement being drafted) — terms signing is required before ANY interview-stage reveal happens, independent of the Lead/Active label. Two different gates, two different purposes, both live on `company_branches` but shouldn't share logic.

**Resignation/replacement verification — Admin-only, confirmed and now placed here:** matches the fraud-sensitivity decision made in the Employee Routes module — a control meant to catch potential fraud shouldn't be verifiable by the same tier of user it's meant to guard against.

---

## Core Route Map: Complete (4 roles)

Public → Candidate → CompanyContact → Employee → Admin, all locked. Next: **Employee Routes rename impact check** (already done via find/replace + this doc), then remaining functionality pieces — Notification System, key flows (application submit, resignation trigger, invoice lifecycle), then SRS + Architecture docs.

---

# PART 3: Notification System

Hybrid channel model — important/time-sensitive events go WhatsApp + Email together, routine events go Email only. Keeps WhatsApp free-tier usage (~1000 convos/month) reserved for what actually needs speed.

## Important (WhatsApp + Email)
| Event | Recipient |
|---|---|
| New company inquiry submitted | Admin |
| New job requirement submitted (PendingApproval) | Admin |
| Resignation proof submitted | Admin |
| Interview scheduled | Candidate + Company Contact |
| Invoice overdue | Admin |

## Routine (Email only)
| Event | Recipient |
|---|---|
| New application assigned to Employee | Assigned Employee (real-time, not batched — this is a work-assignment trigger, not a passive update) |
| Application status change (Shortlisted/Rejected/OnHold) | Candidate |
| Requirement approved → went Open | Batched digest to skill-matching candidates (not per-event — avoids spam) |
| Employee invite sent | Invitee |
| Invoice due soon (before overdue) | Admin |

## Decisions Locked (Notifications)
- **No `NotificationLog` table built** for delivery/audit tracking. Meta Cloud API (WhatsApp) and Resend (Email) both maintain their own delivery/status logs with built-in export — Admin pulls a CSV directly from those provider dashboards when an audit is needed.
- **In-app notification panel IS built** (`in_app_notifications` table, DB doc Module 8) — separate concern from provider delivery logs. Shows unread badge/list inside the app regardless of email/WhatsApp channel used for the same event. Every notification event in both tables above also creates an in-app row for the recipient.
- **Job-open digest is batched, not real-time-per-candidate** — prevents one popular category (e.g. IT) from spamming WhatsApp/email limits every time a new IT role opens. Runs as a background job (BullMQ/Redis, per existing stack) on a schedule (e.g. daily digest), not triggered instantly per requirement.
- **Channel is expandable via `site_settings` toggle, not hardcoded:** e.g. `key = "new_application_whatsapp_enabled"` (default false) — lets founders flip "new application assigned" from Email-only to Email+WhatsApp later once ready to spend on WhatsApp API volume, without a code change or redeploy. Same toggle pattern already used for the stats-page-as-home feature (Module 7).
- Delivery is fire-and-forget from the app's perspective — actual success/failure tracking lives in the provider's system, not ours.

---

# PART 4: Key Flows

## Flow 1: Application Submit (finalized)

1. Candidate on `/jobs/[id]` clicks Apply → if not logged in, redirected to register/login first, returns to same job after auth.
2. Logged in → Apply modal: pick an existing resume (from `/candidate/resumes`) or upload a new one inline.
3. System checks skill overlap (`candidate_skills` vs `job_requirement_skills`) → low/no overlap shows a dismissible warning, never blocks submission (locked earlier, Module 3 of DB doc).
4. On confirm: creates `Application` row (`status=New`, `applied_at=now`, chosen `resume_id`).
   - `unique(candidate_id, job_requirement_id)` blocks duplicates — if already applied, UI shows "You've already applied — view status here" (deep link to `/candidate/applications/[id]`) instead of a raw constraint error.
5. **Auto-assignment fires immediately:** round-robin assigns `assigned_employee_id` from the pool of active Employees (+ Admins acting as Employees, given current 2-founder reality) — no application sits unassigned waiting for someone to notice it.
6. **Manual reassignment stays available** on top of auto-assign — an Employee can hand off or claim additional applications from a teammate if workload is uneven. This isn't a replacement for auto-assign, it's an escape hatch for real-world load balancing.
7. Assigned Employee gets: in-app notification (immediate) + Email (immediate, real-time, not digested) — WhatsApp reserved for later via the `site_settings` toggle once the firm is ready to spend on that channel at volume.

## Decisions Locked (Flow 1)
- Auto-assign + manual-reassign coexist — not either/or, resolves the "don't want one person stuck, but don't want unclaimed apps sitting idle either" tension directly.
- Application-assignment notification treated as real-time/mandatory (per your explicit call), but routed Email+in-app now, WhatsApp deferred behind a toggle for cost control at current 2-person scale.

---

# PART 3.5: Audit Corrections (post-review, before Flow 2)

Caught during a deliberate re-check pass — documenting the fix, not just the final state, so the reasoning isn't lost.

**Correction 1 — Auto-assign pool.** Admins are included in the auto-assign round-robin pool by default (currently only 2 users exist, both Admin). This is NOT a temporary stopgap that disappears once Employees are hired — manual claim/reassign stays a **permanent** feature at any team size, since Admin/founder will likely always want the option to hand-pick candidates for certain requirements, not just supervise.

**Correction 2 — Resignation-triggered reopen is real-time, not batched.** The moment Admin verifies resignation proof and flips `placements.is_active=false`, the linked `job_requirement`'s open/reopen status recalculates immediately (app-layer, right after that write) — not on a scheduled job. Justified because this is a rare, manually-verified event, not high-frequency, so no batching/overflow risk.

**Correction 3 — Employee vs CompanyContact confusion, root cause identified and fixed.** Early in this project, "Recruiter" was used loosely for both internal RS Bridge staff AND company-side HR — a genuine terminology collision. The rename to **Employee** (internal RS Bridge team) resolved this; `CompanyContact` (company-side HR — what the founder calls "recruiter" colloquially) has been a fully separate table/role since. **Terminology, for the record:** `Employee` = RS Bridge internal staff (screens candidates, runs pipeline, works for the consultancy). `CompanyContact` = HR person at a client company (posts requirements, reviews shortlist, works for the client). Never the same person, never the same table, never the same route namespace.

**Correction 4 — Self-service branch/contact joining an existing company needed a fraud gate — added.** See Flow 3 below, new flow, not previously designed.

**Correction 5 — Resume serving, both types, unified under one lazy-serve principle:** neither the branded/masked resume (generated from structured data) nor the real uploaded resume (already-stored file) is proactively pushed, pre-attached, or preloaded anywhere. Both are only fetched/rendered at the exact moment a permitted viewer opens that specific view — masked version generated-then-cached on that first request, real resume served via signed URL only when the interview-stage + terms-signed conditions (already locked) are both met. Consistent security posture across both resume types, not two different rules to maintain.

---

## Flow 3: Company Self-Join (new branch or new HR contact under an existing company)

Scenario: Company X already exists in the system (via original `/companies/inquire` Lead flow). A second HR person — either at the same branch, or opening a new branch in another state — wants to join.

1. New person visits `/companies/inquire` (or a dedicated `/companies/join` variant) → searches/selects existing Company by name from a dropdown (prevents duplicate company records).
2. Choose: join an **existing branch** (select from that company's branch list) or create a **new branch** (new state/location, enters branch details).
3. Enters own HR contact details (name, designation, mobile, email) → creates a `CompanyContact` row with `is_approved=false`.
4. **Fraud gate (this was the missing piece):** login stays inactive until Admin manually verifies this person is legitimately affiliated with the company (quick call/email check) and flips `is_approved=true`. Without this gate, anyone could search "Reliance," find it exists, and self-register as HR — eventually gaining access to real candidate contact info post terms-signing. This mirrors the trust boundary already built everywhere else in the system (company inquiries, requirement approvals, resignation verification) — no new precedent, same pattern applied consistently.
5. If a NEW branch was created in this flow, it starts at `status=Lead` (same as the original company flow) — commission/payment/replacement defaults still require Admin to set them before the branch can be `Active`, and before its Terms of Business agreement can be signed (Module 4/CompanyContact Routes reveal-gate still applies).

## Decisions Locked (Flow 3)
- Existing-company lookup via dropdown prevents duplicate `Company` records when multiple HRs from the same org sign up separately.
- Self-added contact approval gate (`is_approved`) applies uniformly — whether joining an existing branch or spinning up a new one, whether it's the 2nd HR ever or the 20th.
- New branches created through this flow follow the exact same Lead→Active and terms-signing gates as the original single-branch flow — no shortcut path exists for self-service branch creation.

---

## Flow 2: Resignation / Replacement Trigger

### New route
```
/company/placements/[id]/report-resignation   → Company self-uploads resignation proof + left_date
```

### Steps
1. Candidate leaves within `replacement_window_days_applied` of the original placement.
2. Company reports it one of two ways — both valid, both land at the same gate:
   - **Self-service:** Company logs in, uploads proof via `/company/placements/[id]/report-resignation` → sets `placements.resignation_proof_url`, `left_date`, `resignation_submitted_at`.
   - **Assisted:** Company just WhatsApps/emails Admin directly → Admin uploads the same fields on their behalf via `/admin/placements/[id]/resignation-review`.
3. **Admin verification gate (unchanged from earlier lock):** regardless of entry path, `is_active` only flips to `false` and `replacement_status` only moves to `ReplacementTriggered` after Admin manually confirms — never automatic on upload alone. Prevents fraud either way.
4. **Real-time reopen (Correction 2, already locked):** the moment Admin confirms, `job_requirement`'s vacancy count recalculates immediately — reopens for new applications or lets an Employee/Admin directly move a known candidate into the pipeline.
5. New hire made → new `Placement` row created, `replaces_placement_id` points to the original.
6. **Free replacement enforced at invoicing, not via a new schema flag:** any Placement with `replaces_placement_id` set is automatically excluded from the invoice-creation flow (`/admin/invoices`) — it's never offered as invoiceable. `commission_amount` is still computed and stored on the row for internal stats ("what this would've earned"), just never billed.
7. Once this replacement placement is confirmed joined, original placement's `replacement_status` → `ReplacementCompleted` — terminal state.

### Decisions Locked (Flow 2)
- **One replacement per original placement, consumed once — no repeat cycles.** If the replacement candidate also leaves, that's a fresh commercial placement (full commission applies) if the company wants another hire — not a second free swap. The firm's obligation was to source one working replacement, not guarantee indefinite retention, which is outside the firm's control.
- **No fresh replacement window granted to the new hire** — deliberate, prevents an infinite "keep swapping, keep getting free replacements" loop the founder specifically flagged as a real risk.
- `replacement_status` enum simplified: dropped unreachable `NA` state, defaults straight to `WithinWindow` at Placement creation (schema patched, DB doc Module 5).
- Dual-channel resignation reporting (self-service vs Admin-assisted) — both are equally valid, no channel is treated as more "official"; the Admin-verification step is the actual trust boundary, not the upload method.

---

## Flow 3: Invoice Lifecycle

### Steps
1. Application status flips to `Joined` (Employee/Admin action) → `Placement` row created.
2. **Auto-draft trigger:** if this Placement is NOT a free replacement (`replaces_placement_id IS NULL`), the system immediately creates a `Draft` Invoice, 1:1 with this placement — `subtotal_amount` = placement's `commission_amount`, GST fields snapshotted from current `site_settings` (`firm_gst_registered`/`firm_gstin`) if applicable, `total_amount` computed with tax if GST-applicable. Free-replacement placements never trigger this — matches the "never invoiced" rule locked in Flow 2.
3. Admin reviews the draft (`/admin/invoices`) — can send as-is, edit, or **merge multiple Draft invoices for the same `company_branch_id`** into one batched invoice if that matches how the client prefers to be billed (junction table already supports this — auto-draft just defaults to 1:1, doesn't force it).
4. Admin sends (status → `Sent`), `due_date` calculated from placement's snapshotted `payment_terms_days_applied`.
5. **Overdue detection — automatic, not manual checking:** scheduled job (daily) checks `Sent` invoices past `due_date` → auto-flips to `Overdue` → fires the already-locked "Invoice overdue" notification (WhatsApp+Email to Admin).
6. **Marking Paid:** for now, manual Admin action (`payment_source='Manual'`) — no payment gateway in the stack yet. Built with room to automate later: `payment_source` field and a dedicated internal "mark paid" operation (usable by both the manual Admin UI action and, later, an automated webhook handler) means adding real payment gateway automation later doesn't require a schema change or redesign — just a new caller of the same operation.

### Decisions Locked (Flow 3)
- **GST is optional infrastructure, not a forced feature.** Firm isn't registered now; fields exist and snapshot correctly whenever that changes, nothing breaks either way in the meantime.
- **Auto-draft on Joined, not on manual Admin trigger** — reduces missed/forgotten invoices, Admin's job becomes review-and-send rather than remembering to create every single one.
- **1:1 is the default, batching is the escape hatch** — matches how most of this system has been designed: simple default behavior, manual override available when a real relationship needs something different.
- **Payment automation deliberately deferred, but not designed into a corner** — the `payment_source` field and the shared "mark paid" operation are the actual future-proofing, not a promise of a specific gateway.

---

## All 4 Key Flows: Complete
Application Submit, Company Self-Join, Resignation/Replacement Trigger, Invoice Lifecycle — all locked, cross-referenced against each other and against the DB schema.

---

## Flow 5: CSV Import / Export (Admin)

Added post-launch-planning: firm wants to start collecting real data via Google Forms *before* the app is ready, then bulk-import that data once it's live. This flow makes that path real, and doubles as a general data-portability feature for Admin going forward.

### New routes
```
/admin/data/import              → Upload CSV, map columns, preview, confirm import
/admin/data/export               → Select entity (Candidates/Companies/Requirements/Placements) + filters, download CSV
```

### Import steps
1. Admin uploads a CSV (e.g. exported from the Google Form intake Sheet — see `RS_Bridge_GoogleForm_Fields.md` for the exact expected columns).
2. System auto-detects columns matching known field names (case-insensitive, tolerant of minor header variation) and shows a mapping preview — Admin confirms or manually remaps any column before import runs.
3. **Dedup on import:** Candidates deduped by `mobile` (matches the existing unique constraint — a repeat submission updates the existing row rather than creating a duplicate, same rule as the live app's own form). Companies deduped by `company_name` + `city` combination (since `company_name` alone isn't unique across branches).
4. **Blank/missing optional fields get `"NA"` inserted**, not left as empty strings — matches the Google Form doc's stated strategy, makes incomplete records visually obvious for later follow-up rather than looking like a data bug.
5. Required fields missing from a row (e.g. no mobile number) → that row is skipped and flagged in an import summary report (shown to Admin after import completes: X imported, Y skipped, reasons listed) — never silently dropped.
6. Import is transactional per-batch where practical — a bad row doesn't fail the whole batch, just gets flagged and skipped.

### Export
- Admin selects an entity + optional filters (date range, status, category) → downloads a CSV snapshot.
- Useful for backup, external reporting, or handing data to the founders' lawyer/accountant without needing direct DB access.

### Decisions Locked (Flow 5)
- **CSV library:** `papaparse` (already in the approved stack per Architecture doc's artifact/frontend conventions) for parsing, kept consistent rather than introducing a second CSV library.
- **No separate `ImportLog` table** — same reasoning as the earlier notification-log decision: the import summary report is generated and shown once, not persisted as a queryable table. If Admin needs a permanent record, they can export the summary itself as a CSV (meta, but consistent — no special-cased extra schema).
- **This is explicitly a bridge feature, not a replacement for the real intake flows** (`/candidates/register`, `/companies/inquire`) — those remain the canonical way people join once the app is live. CSV import exists specifically to backfill the pre-launch Google Form data, and to give Admin an ongoing data-portability tool, not to become the primary intake method.
