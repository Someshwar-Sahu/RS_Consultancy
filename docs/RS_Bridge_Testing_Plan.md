# RS Bridge Consultancy — Testing Plan

Companion docs: `RS_Bridge_DB_Design.md`, `RS_Bridge_Functionality_RouteMap.md`, `RS_Bridge_Architecture.md`.

This app has unusually high stakes on **permission boundaries and financial logic** — a masking bug leaks PII/commission data or breaks the business model, not just a cosmetic bug. Testing priority reflects that.

---

## 1. Test types & tools

| Type | Tool | What it covers |
|---|---|---|
| Unit tests | Vitest | Business logic functions — commission calc, vacancy-fill count, round-robin assignment, GST tax split |
| Integration tests | Vitest + test DB (Neon branch or local Postgres) | API routes — especially permission/masking enforcement per role |
| E2E tests | Playwright | Full user journeys across roles — application submit through to placement |
| Manual QA checklist | — | Legal/compliance-adjacent items that are hard to automate meaningfully (terms signing flow, invoice PDF correctness) |

---

## 2. Priority 1: Permission & Masking Tests (highest stakes, test first)

These directly protect the business model — get these wrong and the whole anti-disintermediation design is worthless.

- [ ] CompanyContact CANNOT see candidate `mobile`/`email` when application status < `InterviewScheduled`
- [ ] CompanyContact CANNOT see candidate contact info even at interview stage if `terms_agreement_signed = false`
- [ ] CompanyContact CAN see candidate contact info at interview stage when `terms_agreement_signed = true`
- [ ] Candidate CANNOT see `company_name`/branch address/contact under any circumstance
- [ ] Employee role CANNOT retrieve `commission_rate_applied`, `commission_amount`, `invoice.total_amount` via API — test the API response directly, not just the UI (UI-only hiding is not security)
- [ ] Employee CANNOT flip a `PendingApproval` requirement to `Open` (API-level check, not just missing button)
- [ ] Employee CANNOT verify resignation proof / flip `is_active` on a Placement
- [ ] CompanyContact from Branch A CANNOT query/see data scoped to Branch B, even under the same parent Company
- [ ] Self-added `CompanyContact` with `is_approved=false` CANNOT log in / access any `/company/*` route
- [ ] Test the masking helper (`applyFieldMask`) in isolation with every role × every entity combination — this is the single point of failure if it has a bug, so it deserves the most direct unit-test coverage

## 3. Priority 2: Financial Correctness

- [ ] Commission snapshot: changing `company_branch.default_commission_rate` AFTER a Placement exists does NOT change that Placement's `commission_rate_applied`
- [ ] Free replacement Placement (`replaces_placement_id` set) is NEVER selectable in the invoice-creation flow
- [ ] `commission_amount` computed correctly: `final_ctc × commission_rate_applied / 100`
- [ ] GST tax split correct for both CGST/SGST (intra-state) and IGST (inter-state) when `gst_applicable = true`
- [ ] Invoice `due_date` correctly computed from snapshotted `payment_terms_days_applied`, not from any live branch value
- [ ] Overdue auto-detection job correctly flips only `Sent` (not `Draft`/`Paid`/`Cancelled`) invoices past due_date
- [ ] `ReplacementCompleted` is genuinely terminal — attempting a second replacement on the same original placement is blocked

## 4. Priority 3: Core Pipeline Logic

- [ ] `unique(candidate_id, job_requirement_id)` constraint actually prevents duplicate applications, and the UI shows the friendly "already applied" message instead of a raw DB error
- [ ] Auto-assignment round-robin distributes fairly across active Employees+Admins, doesn't always pick the same one
- [ ] Manual reassignment works without breaking the original assignment's audit trail
- [ ] `vacancies_filled` computed correctly from `Placements where is_active=true` — NOT from Application status (this was a corrected bug during design, worth a regression test specifically)
- [ ] `JobRequirement.status` auto-flips to `Filled` exactly when `vacancies_filled == no_of_vacancies`, and reopens correctly when a Placement's `is_active` flips false
- [ ] Skill-overlap warning shows but never blocks application submission

## 5. Priority 4: Flows (E2E, Playwright)

- [ ] **Full Application Submit flow:** candidate registers → uploads resume → applies to job → sees skill-mismatch warning if applicable → application created → Employee gets notified → Employee sees it in "assigned to me"
- [ ] **Full Company Self-Join flow:** new HR searches existing company → selects/creates branch → self-registers as contact → login blocked until Admin approves → Admin approves → login works
- [ ] **Full Resignation/Replacement flow:** company reports resignation (both self-service AND admin-assisted paths) → Admin verifies → requirement reopens → new hire made → original placement's `replacement_status` reaches `ReplacementCompleted` → new placement excluded from invoicing
- [ ] **Full Invoice Lifecycle:** placement Joined → draft auto-created → Admin sends → due_date passes without payment → auto-flips Overdue → notification fires
- [ ] **Terms signing flow:** CompanyContact views T&C → accepts via checkbox+typed name → `terms_signed_at`/`ip`/`version`/`snapshot_url` all correctly captured → interview-stage reveal now works for that branch

## 6. Manual QA checklist (not easily automated)

- [ ] Terms of Business legal text renders correctly, checkbox genuinely blocks acceptance without reading (no pre-checked box)
- [ ] Generated branded resume PDF actually excludes all contact info, visually inspect a sample
- [ ] WhatsApp message templates render correctly in Meta Business Manager preview before going live
- [ ] Invoice PDF (if/when built) shows correct GST breakup for a sample GST-registered scenario, and correct simple format for non-GST scenario

## 7. What NOT to over-invest in for v1

- Load/performance testing — premature at current scale (2 founders, early customer base), revisit once real traffic data exists
- Cross-browser exhaustive testing — target modern evergreen browsers only, no legacy IE-class support needed
