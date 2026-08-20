# RS Bridge Consultancy — Software Requirements Specification (SRS)

**Status:** Authoritative. If any other document conflicts with this one, this document wins — flag the conflict and update the other doc.
**Companion docs:** `RS_Bridge_Documentation.md`, `RS_Bridge_DB_Design.md`, `RS_Bridge_Functionality_RouteMap.md`, `RS_Bridge_Architecture.md`, `RS_Bridge_Testing_Plan.md`, `AI_INSTRUCTIONS.md`.

---

## 1. Purpose & Scope

RS Bridge Consultancy requires a full production web application to replace its current static brochure site (form submissions → email only, no tracking, no search, no accounts). The system must support 4 distinct user roles across the recruitment lifecycle: candidate sourcing, company requirement intake, screening/pipeline management, placement, and commission invoicing.

**In scope:** web application (public site + role-based portals), core recruitment CRM functionality, notification system (WhatsApp/Email), financial tracking (commission/invoice), anti-disintermediation protections.

**Out of scope for v1:** native mobile app (PWA-equivalent via responsive web only), payment gateway integration (manual payment marking for now, architected for later automation), AI-based resume matching (schema supports it, not built in v1).

## 2. Stakeholders

| Role | Description |
|---|---|
| Admin | The 2 founders — full system access, financial visibility, approval authority |
| Employee | RS Bridge internal staff (future hires) — operational access, no financial visibility |
| CompanyContact | HR representative at a client company — branch-scoped access |
| Candidate | Job seeker — self-service profile, application tracking |

## 3. Functional Requirements

### FR-1: Candidate Management
- FR-1.1: System shall allow candidate self-registration with core profile (name, mobile, email, location, experience level).
- FR-1.2: System shall support multiple resume versions per candidate, labeled by the candidate.
- FR-1.3: System shall normalize skills via a shared master list with candidate-level presence linking (no free-text duplication).
- FR-1.4: System shall auto-suggest `total_experience_years` from structured Experience entries, with manual override.
- FR-1.5: Candidate status shall be tracked per-application, never globally on the candidate record.

### FR-2: Company Management
- FR-2.1: System shall support one Company (parent) having multiple Branches, each with independently negotiable commission/payment/replacement terms.
- FR-2.2: System shall support multiple HR contacts per branch.
- FR-2.3: New company engagement shall enter the system as `Lead` status via a public inquiry form, requiring Admin conversion to `Active`.
- FR-2.4: A second HR contact joining an existing company (new or existing branch) shall require explicit Admin approval before login activation (fraud-prevention gate).

### FR-3: Job Requirement Management
- FR-3.1: A company shall be able to submit a job requirement request; it shall NOT go live until Admin approval.
- FR-3.2: Commission/payment/replacement terms shall default from the branch but be overridable per requirement.
- FR-3.3: Required skills shall link to the shared skill master list for future matching capability.
- FR-3.4: A requirement's filled-vacancy count shall be computed from active Placements, not raw application status, and shall auto-transition the requirement to `Filled` when vacancies are met.

### FR-4: Application Pipeline
- FR-4.1: A candidate shall be limited to one application per specific job requirement (duplicate prevention).
- FR-4.2: Every application shall auto-assign to an Employee/Admin via round-robin at creation, with manual reassignment always available.
- FR-4.3: Full status history shall be tracked per application, visible to the owning company only for their own requirements.
- FR-4.4: A rejection reason shall be visible to the candidate only if the company/employee explicitly opts to share it.

### FR-5: Anti-Disintermediation (critical requirement)
- FR-5.1: Candidate-facing views shall never expose company identity or contact details, under any circumstance.
- FR-5.2: Company-facing views shall never expose candidate contact details before the application reaches interview stage.
- FR-5.3: Interview-stage contact reveal shall require a signed Terms of Business agreement at the branch level, captured with legally defensible evidence (timestamp, IP, typed name, versioned snapshot).
- FR-5.4: The system shall serve a platform-generated resume (contact-stripped) for pre-interview viewing; the original uploaded file shall only be served post-interview-stage under the same terms-signed gate.

### FR-6: Placement & Replacement
- FR-6.1: A Placement record shall be created upon an application reaching `Joined` status, with commission/payment/replacement terms snapshotted (not live-referenced) from the requirement/branch at that moment.
- FR-6.2: Resignation within the replacement window shall require documented proof and explicit Admin verification before triggering a replacement flow — never automatic.
- FR-6.3: A vacancy shall reopen in real-time upon verified resignation, not on a batch schedule.
- FR-6.4: Each original Placement shall be entitled to exactly one free replacement; subsequent hires for the same vacancy shall be treated as new commercial placements.

### FR-7: Invoicing
- FR-7.1: An invoice draft shall auto-generate upon a non-replacement Placement being confirmed.
- FR-7.2: Free-replacement Placements shall be permanently excluded from invoice eligibility.
- FR-7.3: GST fields shall be present but optional, snapshotted per-invoice from the firm's registration status at creation time.
- FR-7.4: Invoices shall auto-transition to `Overdue` on a scheduled check past their due date, triggering notification.

### FR-8: Notifications
- FR-8.1: The system shall support both WhatsApp and Email channels, with per-event channel assignment configurable via feature flag.
- FR-8.2: High-frequency events (e.g. job-open alerts to matching candidates) shall be batched, not sent per-event.
- FR-8.3: An in-app notification panel shall reflect every notification-worthy event regardless of external channel delivery.

### FR-9: Role-Based Access Control
- FR-9.1: Employee role shall be denied access to all financial fields (commission rates, amounts, invoice totals) at the API level, not merely the UI level.
- FR-9.2: Employee role shall be denied authority to approve job requirements or verify resignations.
- FR-9.3: CompanyContact access shall be scoped strictly to their own branch, never cross-branch even within the same parent company.

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | All masking/permission rules enforced server-side; UI-only hiding is explicitly non-compliant |
| NFR-2 | No hard deletes anywhere in the system — audit trail is permanent by design |
| NFR-3 | System shall operate within free-tier infrastructure limits at current scale, with a documented no-rewrite upgrade path |
| NFR-4 | Electronic Terms of Business acceptance shall meet Indian IT Act §10A / Indian Contract Act validity standards (audit-trail-backed consent) |
| NFR-5 | System shall be built for eventual team growth beyond 2 founders without requiring schema/architecture changes (e.g. `assigned_employee_id`, invite-based onboarding already accommodate this) |

## 5. Constraints & Assumptions

- Zero initial budget — all infrastructure choices must have a genuinely usable free tier.
- Founder is technically capable but learning — documentation must be genuinely readable, not just technically complete.
- Legal Terms of Business text is pending external legal drafting; system architecture must not hard-code assumptions about its content.
- Single-region operation (NCR, India) — no current requirement for multi-region infrastructure.

## 6. External Interfaces

| System | Purpose |
|---|---|
| Meta WhatsApp Cloud API | Time-sensitive notifications |
| Resend | Transactional email |
| Cloudflare R2 | File storage (resumes, terms snapshots, generated PDFs) |
| Neon Postgres | Primary database |
| (Future) Payment gateway | Not yet selected — architecture reserves an extension point |

## 7. Traceability

Every requirement above is derived from and cross-referenced with detailed design decisions in `RS_Bridge_DB_Design.md` and `RS_Bridge_Functionality_RouteMap.md` — this document summarizes and formalizes, it does not replace the reasoning captured in those two documents.
