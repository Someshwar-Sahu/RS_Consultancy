# RS Bridge Consultancy — System Architecture

Companion docs: `RS_Bridge_DB_Design.md` (schema), `RS_Bridge_Functionality_RouteMap.md` (routes/flows).
This doc translates those decisions into an actual buildable system shape.

---

## 1. Tech Stack (locked, zero-budget-to-start)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | Single framework for frontend + backend (API routes/Server Actions) — no separate backend server needed, halves hosting complexity/cost |
| Hosting | **Vercel (Hobby tier)** | Free, zero-config deploys from GitHub, scales to Pro later without migration |
| Database | **Neon Postgres (free tier)** | Serverless Postgres, generous free tier, branches for dev/staging |
| ORM | **Prisma** | Type-safe queries matching the schema in `RS_Bridge_DB_Design.md` 1:1 |
| Auth | **NextAuth (Auth.js)** | Handles password hashing, magic-link reset, session management — self-hosted, free |
| File storage | **Cloudflare R2** | Resumes, terms snapshots, generated PDFs — free 10GB, no egress fees (matters for resume downloads) |
| Background jobs | **Upstash Redis + BullMQ** | Digest emails, invoice-overdue checks, resume PDF generation — free tier sufficient at current scale |
| Email | **Resend** | Transactional email, free tier (100/day, 3000/mo) |
| WhatsApp | **Meta Cloud API (direct)** | ~1000 free conversations/month, no middleman (Gupshup/Interakt) cost at this stage |
| Monitoring | **Sentry** | Free tier error tracking |
| CI/CD | **GitHub Actions** | Auto-deploy on merge to main |

**Scaling path (no rewrite needed):** every piece above has a paid tier that's a config change, not an architecture change — Neon free→paid, Vercel Hobby→Pro, Redis free→paid, WhatsApp direct→Gupshup if volume needs a richer dashboard. Upgrade individual pieces as revenue justifies, never a full-stack swap.

---

## 2. Folder Structure (Next.js App Router)

```
/app
  /(public)                    → landing, /jobs, /jobs/[id], /companies/inquire, /candidates/register, /login
  /candidate/*                 → candidate-role pages, protected by middleware
  /company/*                   → CompanyContact-role pages, protected + branch-scoped
  /employee/*                  → Employee-role pages, protected + financial-field-masked
  /admin/*                     → Admin-role pages, protected, full access
  /api
    /auth/*                    → NextAuth handlers
    /candidates/*               → candidate CRUD, resume upload
    /companies/*                 → company/branch/contact CRUD
    /requirements/*               → job requirement CRUD, approval
    /applications/*                → application pipeline, status changes, assignment
    /placements/*                    → placement creation, resignation/replacement
    /invoices/*                       → invoice lifecycle
    /webhooks/*                        → future payment gateway webhook target (Flow 3 forward-compat)
/lib
  /db.ts                        → Prisma client singleton
  /auth.ts                      → NextAuth config, role helpers
  /permissions.ts                → SERVER-SIDE field-masking + route-guard logic (see Section 4)
  /jobs/*                        → BullMQ job definitions (digest, invoice-check, pdf-gen)
  /notifications/*                → WhatsApp/Email send wrappers, site_settings-driven channel toggle
/prisma
  /schema.prisma                 → mirrors RS_Bridge_DB_Design.md exactly
```

---

## 3. Background Jobs (BullMQ queues)

| Job | Trigger | Frequency |
|---|---|---|
| `job-open-digest` | Scheduled | Daily — batches skill-matching candidates per newly-Open requirement |
| `invoice-overdue-check` | Scheduled | Daily — flips `Sent` invoices past `due_date` to `Overdue`, fires notification |
| `resume-pdf-generate` | On-demand, queued | First time a permitted viewer requests a masked or real resume — generated once, cached |
| `notification-dispatch` | Event-triggered | Fires on: new inquiry, new requirement, resignation submitted, interview scheduled, application assigned, invoice due/overdue |

All jobs are idempotent where possible (e.g. resume PDF generation checks cache before regenerating) to survive retries safely.

---

## 4. Security Architecture — this is the part that actually matters most for this app

**Core principle established across both companion docs: hiding a field in the UI is not security. Every masking/permission rule must be enforced server-side, at the API layer, not just by not-rendering a component.**

### 4.1 Role-based field masking
`/lib/permissions.ts` centralizes every masked-field rule so it's checked in ONE place, not scattered across API routes (avoids the classic bug where one forgotten endpoint leaks a field others correctly hide):
- Candidate contact fields (`mobile`, `email`) — masked from CompanyContact unless `application.status >= InterviewScheduled` AND `company_branch.terms_agreement_signed = true`.
- Company identity fields (`company_name`, branch address/contact) — masked from Candidate, always, no exception.
- Financial fields (`commission_rate_applied`, `commission_amount`, `invoice.total_amount`, etc.) — masked from Employee role, visible to Admin only.

Every API route that returns one of these entities calls a shared `applyFieldMask(entity, viewerRole, viewerContext)` helper — never hand-rolled per-route filtering.

### 4.2 Route-level access control
Middleware checks role on every `/candidate`, `/company`, `/employee`, `/admin` route before rendering. CompanyContact routes additionally scope by `company_branch_id` (never cross-branch, even same parent company) — enforced in the query layer (every query for a CompanyContact automatically filters `WHERE company_branch_id = session.user.companyContact.companyBranchId`), not just in the UI.

### 4.3 Approval gates (three independent, per DB doc)
Enforced as separate checks, never merged into one "is this company okay" boolean:
1. `company_branch.status` — business classification, informational, doesn't block access
2. `company_contact.is_approved` — blocks login entirely if false
3. `company_branch.terms_agreement_signed` — blocks interview-stage reveal specifically, independent of the other two

### 4.4 Audit trail
`application_status_history` + `placements.resignation_proof_url`/`resignation_submitted_at` + `invoices` (immutable once `Sent`) give a real paper trail for disputes. `company_branches.terms_snapshot_url` preserves exact legal text agreed to, independent of future terms edits.

---

## 5. Deployment

1. GitHub repo, `main` branch auto-deploys to Vercel production.
2. Neon branching used for a staging DB per PR (optional, free-tier permitting) or a single shared staging DB if branching gets expensive.
3. Environment variables (DB URL, R2 keys, Meta/Resend API keys, NextAuth secret) stored in Vercel project settings, never committed.
4. Prisma migrations run as part of the deploy pipeline (`prisma migrate deploy`), not manually against production.

---

## Open assumptions (flagging, not blocking — confirm if any are wrong)
- Assuming single-region deployment (India-based user base, Vercel's nearest edge region) — no multi-region need at this scale.
- Assuming Next.js Server Actions are used for internal mutations (form submissions) where a full REST API route isn't otherwise needed for external consumption — reduces boilerplate versus building a full REST API for every internal action.
