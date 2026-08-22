# RS Bridge Consultancy — Software Requirements Specification (SRS)

**Status:** Authoritative. If any other document conflicts with this one, this document wins — flag the conflict and update the other doc.  
**Companion docs:** `RS_Bridge_Documentation.md`, `RS_Bridge_DB_Design.md`, `RS_Bridge_Functionality_RouteMap.md`, `RS_Bridge_Architecture.md`, `RS_Bridge_Testing_Plan.md`, `AI_INSTRUCTIONS.md`.

---

## 1. Purpose & Scope

RS Bridge Consultancy requires a full production web application to replace its current static brochure site (form submissions → email only, no tracking, no search, no accounts). The system must support 4 distinct user roles across the recruitment lifecycle: candidate sourcing, company requirement intake, screening/pipeline management, placement, and commission invoicing.

**In scope:** web application (public site + role-based portals), core recruitment CRM functionality across corporate (White-Collar) and Driver/Field Staff (Blue-Collar) hiring lines, notification system (WhatsApp/Email), financial tracking (commission/invoice), anti-disintermediation protections, zero-liability staffing disclaimers.

**Out of scope for v1:** native mobile app (PWA-equivalent via responsive web only), payment gateway integration (manual payment marking for now, architected for later automation), AI-based resume matching (schema supports it, not built in v1).

---

## 2. Stakeholders

| Role | Description |
|---|---|
| Admin | The 2 founders — full system access, financial visibility, approval authority, blacklisting power |
| Employee | RS Bridge internal staff (future hires) — operational access, no financial visibility |
| CompanyContact | HR representative or employer at a client company — branch-scoped access |
| Candidate | Job seeker (Corporate or Driver/Field Staff) — self-service profile, application tracking |

---

## 3. Functional Requirements

### FR-1: Candidate Management (Corporate & Driver/Field Staff)
- FR-1.1: System shall allow candidate self-registration with core profile (name, mobile, email, location, experience level).
- FR-1.2: Corporate candidate profiles shall support multiple resume versions, labeled by the candidate.
- FR-1.3: Driver and Blue-Collar candidate profiles shall **not require a PDF resume**, supporting structured Driving License (DL category: LMV/HMV/Commercial), vehicle types, and experience years.
- FR-1.4: System shall track verification status badges (Aadhaar/DL Uploaded, Police Verification Certificate status: Available vs Post-Hire).
- FR-1.5: System shall support optional candidate reference contacts without blocking profile creation if blank.
- FR-1.6: Candidate status shall be tracked per-application, never globally on the candidate record.
- FR-1.7: System shall support an internal-only candidate blacklisting flag (`is_blacklisted`) to permanently block misconduct actors from future placements.

### FR-2: Company & Vacancy Intake Management
- FR-2.1: System shall support one Company (parent) having multiple Branches, each with independently negotiable terms.
- FR-2.2: Vacancy intake (`/company/requirements/new`) shall provide an initial **2-Card Category Selector**:
  - `Corporate & Executive Roles (White-Collar)`
  - `Drivers & Field Staff (Blue-Collar)`
- FR-2.3: Selecting Driver/Blue-Collar role class shall dynamically load driver-specific vacancy fields (Vehicle Types, DL Category, Work Hours, Timeline).
- FR-2.4: A second HR contact joining an existing company shall require explicit Admin approval (`is_approved`) before login activation.

### FR-3: Job Requirement Approval & Matchmaking
- FR-3.1: Submitted requirements shall enter `PendingApproval` and require Admin approval before going live.
- FR-3.2: Commission/payment/replacement terms shall default from the branch but be overridable per requirement.
- FR-3.3: A requirement's filled-vacancy count shall be computed from active Placements (`is_active=true`), auto-transitioning to `Filled` when met.

### FR-4: Application Pipeline & Assignment
- FR-4.1: Candidate applications shall be limited to one per specific job requirement (duplicate prevention).
- FR-4.2: Every application shall auto-assign to an Employee/Admin via round-robin at creation.
- FR-4.3: Full 7-stage status history shall be tracked per application.
- FR-4.4: Rejection reasons shall be visible to candidates only if explicitly opted-in by recruiter.

### FR-5: Anti-Disintermediation & Staged Contact Reveal
- FR-5.1: Candidate-facing views shall never expose company identity or contact details (displayed as "Confidential Client").
- FR-5.2: Company-facing views shall display a contact-stripped branded resume (for Corporate) or a branded **Driver Profile Card** (for Drivers) prior to interview stage.
- FR-5.3: Interview-stage contact reveal shall require a signed Terms of Business agreement at branch level, captured with legally defensible consent (timestamp, IP, typed name, versioned PDF snapshot).
- FR-5.4: All Driver profile views displayed to hiring companies shall feature a permanent **Recruitment Intermediary Zero-Liability Disclaimer**, transferring operational test-drive, vehicle insurance, and final background responsibility to the employer.

### FR-6: Placement & Replacement Guarantees
- FR-6.1: Placement records shall be created upon `Joined` status, snapshotting terms.
- FR-6.2: Candidate exit within 60–90 days (resignation or driver abandonment/misconduct) shall trigger real-time vacancy re-opening upon Admin verification of exit proof.
- FR-6.3: Each original Placement shall be entitled to exactly one free replacement (`ReplacementCompleted` terminal state); replacement placements (`replaces_placement_id != null`) shall be permanently excluded from invoice generation.

### FR-7: Invoicing & Role Access Control
- FR-7.1: Non-replacement joinings shall auto-generate invoice drafts for Admin review.
- FR-7.2: Scheduled daily check shall transition past-due invoices to `Overdue`.
- FR-7.3: Employee role shall be strictly denied access to financial fields (commission rates, amounts, invoice totals) and blacklisting controls at the API level.

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | All masking/permission rules enforced server-side; UI-only hiding is explicitly non-compliant |
| NFR-2 | Zero hard deletes — full immutable audit log for compliance & dispute resolution |
| NFR-3 | Zero software subscription operating cost ($0 stack: Next.js, Neon, NextAuth, Cloudflare R2, Resend) |
| NFR-4 | Electronic Terms of Business acceptance compliant with Indian IT Act §10A & Contract Act 1872 |
| NFR-5 | Intermediary zero-liability legal disclaimers displayed on all Blue-Collar/Driver hiring views |

---

## 5. External Interfaces

| System | Purpose |
|---|---|
| Meta WhatsApp Cloud API | Time-sensitive alerts |
| Resend | Transactional email |
| Cloudflare R2 | File storage (resumes, DL copies, terms snapshots) |
| Neon Postgres | Primary relational database |
