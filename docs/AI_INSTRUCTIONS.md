# AI Instructions — Read This First

You are working on **RS Bridge Consultancy**, a real production recruitment platform for a real 2-founder business (not a demo/portfolio project — real money, real people's data). This file exists so any AI picking up this codebase doesn't have to rediscover context or accidentally undo a deliberate decision.

---

## Read order before writing any code

1. `RS_Bridge_Documentation.md` — orientation, glossary, what this is
2. `RS_Bridge_DB_Design.md` — full schema, all 8 modules
3. `RS_Bridge_Functionality_RouteMap.md` — every route, every key flow
4. `RS_Bridge_Architecture.md` — tech stack, folder structure, security enforcement pattern
5. `RS_Bridge_Testing_Plan.md` — what "correct" looks like, especially Priority 1
6. `RS_Bridge_SRS.md` — if anything in the above conflicts, this is the tie-breaker

## Who's building this

Founder is a CS student, learning-by-building — comfortable writing/pasting code themselves, wants to understand what's built, not just receive a finished black box. If working interactively with the founder: explain reasoning, don't just output code silently. If working autonomously (e.g. Claude Code executing a task): still leave clear commit messages / comments explaining non-obvious decisions, since the founder will read the code afterward.

## Non-negotiable rules — never violate these regardless of what a task seems to ask for

1. **Never weaken the Anti-Disintermediation masking.** This is the core business protection. Candidate contact info is masked from companies until `application.status >= InterviewScheduled` AND `company_branch.terms_agreement_signed = true`. Company identity is masked from candidates, always, no exception. If a task seems to require bypassing this, STOP and flag it — don't implement it, ask first.

2. **Never enforce permissions/masking in the UI only.** Every masked field must be enforced server-side (API route / Server Action), verified by checking what the API actually returns, not just what the UI hides. A hidden button is not a permission check.

3. **Never let Employee role see financial fields.** `commission_rate_applied`, `commission_amount`, `invoice.total_amount`, `company_branch.default_commission_rate` and siblings — Admin-only, always, across every route and API response.

4. **Never invoice a free-replacement Placement.** Any Placement with `replaces_placement_id` set must be excluded from invoice-eligible queries.

5. **Never hard-delete records.** This system has zero hard deletes by design — Placement/Invoice/ApplicationStatusHistory are permanent audit trail. Status/visibility filtering handles "removal" from active views.

6. **Never skip the Admin verification gate on resignation/replacement.** `is_active` only flips false, `replacement_status` only advances, after explicit Admin confirmation — never automatically on file upload alone.

7. **Never auto-approve a self-added CompanyContact.** `is_approved` starts false, stays false until Admin manually verifies — this is a fraud-prevention gate, not a formality.

8. **Never grant a fresh replacement window to a replacement hire.** One replacement per original placement, consumed once. If challenged on this, refer to the reasoning in `RS_Bridge_Functionality_RouteMap.md` Flow 2 — it was a deliberate anti-abuse decision, not an oversight.

9. **Never auto-execute commands or write code files directly during interactive guidance.** When guiding the founder, output all code snippets, terminal commands, directory structures, and file contents directly in the response chat. Do not execute shell commands or write/modify codebase files directly unless explicitly requested. The founder is building hands-on and will create the files and execute the commands themselves.

## When something is ambiguous or missing from the docs

Don't guess and silently proceed on anything touching money, permissions, or PII — these categories caused real back-and-forth during design specifically because guessing wrong is expensive to undo. Flag the ambiguity to the founder instead. For lower-stakes ambiguity (UI copy, minor UX choices), reasonable defaults are fine — note the assumption made, don't block on it.

## Known open items (not yet resolved, don't assume answers)

- Terms of Business exact legal text — pending founder's lawyer, don't draft legal language yourself
- Payment gateway integration — deliberately deferred, `payment_source` field and shared "mark paid" operation exist as the extension point, no gateway chosen yet
- Skill-match scoring display (`/candidate/jobs`) — schema supports it, explicitly marked "nice to have," not blocking for v1

## Style/convention notes

- TypeScript throughout, Prisma for all DB access (no raw SQL unless a specific query genuinely can't be expressed in Prisma)
- Prefer Server Actions for internal form mutations over building full REST routes, unless the endpoint needs external consumption (webhooks, etc.)
- Match the schema field names in `RS_Bridge_DB_Design.md` exactly — don't rename fields "for clarity" without updating the doc too, the two must stay in sync
