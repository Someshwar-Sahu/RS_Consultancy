# RS Bridge Consultancy — Deep Senior Engineering Audit (Pass 3)
**Exhaustive Analysis of 100 Advanced Enterprise Architecture, Indian Statutory Compliance, Multi-Tenant Security, ATS Pipeline, and Commercial Operations Defects**

---

## Index of Finding Categories
1. **[Section A] Indian Compliance, GST Taxation & Legal Contract Enforceability** (Findings 1 – 15)
2. **[Section B] Multi-Tenant Isolation & Role-Based Access Control (RBAC) Hardening** (Findings 16 – 28)
3. **[Section C] Advanced Executive & Driver Resume Processing, Formatting & Parsing** (Findings 29 – 42)
4. **[Section D] Commercial Recruitment Governance & Staffing Operations** (Findings 43 – 58)
5. **[Section E] Enterprise ATS Pipeline & Sourcing Matchmaking** (Findings 59 – 72)
6. **[Section F] WhatsApp, SMS & Multi-Channel Communications** (Findings 73 – 82)
7. **[Section G] Database Architecture, Indexing & Query Optimizations** (Findings 83 – 92)
8. **[Section H] Frontend UI/UX, Theme Tokens & Accessibility (a11y)** (Findings 93 – 100)

---

## [Section A] Indian Compliance, GST Taxation & Legal Contract Enforceability

1. **CRITICAL: GSTIN Checksum & Format Validation Missing on Client Onboarding**
   * *File*: [`src/app/api/companies/inquire/route.ts#L45-L65`](file:///e:/Projects/rs_consultancy/src/app/api/companies/inquire/route.ts#L45-L65)
   * *Root Cause*: Accepts client GST numbers without regex verification (`^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$`). Invalid GST numbers cause tax portal rejections under Indian GST Rules 2017.
   * *Industry Benchmark*: Workday & Zoho Books run real-time GSTIN checksum validation.

2. **CRITICAL: State-Level CGST/SGST vs IGST Calculation Flaw**
   * *File*: [`src/app/api/admin/placements/route.ts#L65-L85`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L65-L85)
   * *Root Cause*: Assumes fixed 18% GST splits (CGST 9% + SGST 9%) without comparing Agency State Code (e.g. 07-Delhi) vs Client Branch State Code (e.g. 09-UP). Inter-state placements require IGST 18%.
   * *Impact*: Generates legally invalid Tax Invoices causing GST audit penalties under Section 122 of CGST Act.

3. **CRITICAL: Missing Reverse Charge Mechanism (RCM) Declaration on Invoices**
   * *File*: [`src/app/api/invoices/route.ts#L40-L70`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L40-L70)
   * *Root Cause*: Invoice data objects omit mandatory GST Rule 46 declaration stating whether tax is payable on Reverse Charge basis.

4. **HIGH: Lack of Digital Signature / Document SHA-256 Hash on Terms Acceptance**
   * *File*: [`src/app/api/companies/terms/route.ts#L80-L105`](file:///e:/Projects/rs_consultancy/src/app/api/companies/terms/route.ts#L80-L105)
   * *Root Cause*: `TermsSnapshot` stores raw IP and timestamp without storing a cryptographically verifiable SHA-256 hash of the accepted agreement text, failing Indian IT Act 2000 §10A requirements.

5. **HIGH: Absence of Statutory Candidate Notice Period Expiry Validation**
   * *File*: [`src/app/api/admin/placements/route.ts#L50-L65`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L50-L65)
   * *Root Cause*: Placement creation accepts joining dates that precede the candidate's mandatory contract notice period, exposing client companies to tortious interference lawsuits.

6. **HIGH: TDS (Tax Deducted at Source) Form 16A Reconciliation Gap**
   * *File*: [`prisma/schema.prisma#L379-L403`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L379-L403)
   * *Root Cause*: Schema lacks fields (`tdsCertificateUrl`, `tdsQuarter`) to track 10% Section 194J TDS deductions against Form 26AS tax credits.

7. **MEDIUM: Prohibited Dual Agency Representation Conflict Check Missing**
   * *File*: [`src/app/api/applications/route.ts#L130-L155`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L130-L155)
   * *Root Cause*: If Candidate X is submitted by Recruiter A to Client Y for Mandate 1, the platform permits Recruiter B to submit the same candidate to Client Y for Mandate 2, violating commercial agency exclusivity agreements.

8. **MEDIUM: Unsigned Zero-Liability Acknowledgment ID on Driver Profile Dispatch**
   * *File*: [`src/app/company/requirements/[id]/page.tsx#L400-L450`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L400-L450)
   * *Root Cause*: Displays driver disclaimer visually, but does not record an explicit digital checkbox acknowledgment ID from client contacts before exposing driver contact details.

9. **MEDIUM: Absence of Statutory Credit Note (CDN) Expiry Lock**
   * *File*: [`src/app/api/admin/placements/resignation/route.ts#L45-L75`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L45-L75)
   * *Root Cause*: Indian GST Section 34 requires Credit Notes to be issued before 30th November following financial year end. System allows placement deactivation after tax cutoffs.

10. **MEDIUM: Incomplete PAN / Tax Exemption Certificate (Form 197) Storage**
    * *File*: [`prisma/schema.prisma#L222-L244`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L222-L244)
    * *Root Cause*: Company branch schema lacks fields for Client PAN number or Form 197 lower-TDS deduction certificates.

11. **LOW: Missing Stamp Duty Jurisdiction Notation on Digital Mandates**
    * *File*: [`src/app/api/companies/terms/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/companies/terms/route.ts)
    * *Root Cause*: Commercial staffing contracts require stamp duty compliance based on state jurisdiction (e.g. Maharashtra vs Delhi Stamp Act).

12. **LOW: Multi-Currency Billing Override Excluded from Invoicing Engine**
    * *File*: [`src/app/api/admin/placements/route.ts#L70-L85`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L70-L85)
    * *Root Cause*: GCC / Middle East branch placements bill in AED or USD, but invoice generator hardcodes INR formatting.

13. **LOW: Missing MSME Payment Mandate (45-Day Rule under Section 43B(h))**
    * *File*: [`src/app/api/invoices/route.ts#L50-L65`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L50-L65)
    * *Root Cause*: Lacks MSME registration flag on agency profile to enforce statutory 45-day invoice due date caps under Income Tax Act Section 43B(h).

14. **LOW: Missing DPDP Act 2023 Candidate Consent Audit Trail**
    * *File*: [`src/app/api/candidates/register/route.ts#L90-L120`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/register/route.ts#L90-L120)
    * *Root Cause*: Does not record explicit, withdrawable candidate consent timestamps under India's Digital Personal Data Protection Act 2023.

15. **LOW: Lack of Escrow Account Mapping for Retained Search Advances**
    * *File*: [`prisma/schema.prisma#L379`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L379)
    * *Root Cause*: Invoice model has no designation for retained search advance retainer deposits versus final joining payments.

---

## [Section B] Multi-Tenant Isolation & Role-Based Access Control (RBAC) Hardening

16. **CRITICAL: Candidate Recruiter Screening Notes Exposed Across Unrelated Branches**
    * *File*: [`src/app/api/employee/candidates/route.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L20-L40)
    * *Root Cause*: `db.candidate.findMany` includes candidate application history across all companies without filtering internal screening notes by branch authorization.

17. **CRITICAL: Company Branch Parameter Manipulation (IDOR)**
    * *File*: [`src/app/api/requirements/route.ts#L15-L30`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L15-L30)
    * *Root Cause*: Passing a modified `companyBranchId` in query parameters can allow client contacts to inspect job mandates belonging to other client branches.

18. **HIGH: Unrestricted Admin Settings Access for Standard Recruiter Role**
    * *File*: [`src/app/api/admin/settings/route.ts#L10-L25`](file:///e:/Projects/rs_consultancy/src/app/api/admin/settings/route.ts#L10-L25)
    * *Root Cause*: API route handler checks `if (!session?.user)` but fails to check `userRole === "ADMIN"`, allowing standard recruiters to modify global site settings.

19. **HIGH: Salary Range Exposure in Unmasked Candidate API Endpoints**
    * *File*: [`src/app/api/candidates/route.ts#L40-L60`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/route.ts#L40-L60)
    * *Root Cause*: `currentSalary` and `expectedSalary` are returned in raw JSON payloads to external recruiters without explicit permission checks.

20. **HIGH: Missing Active Session Revocation on User Password Reset**
    * *File*: [`src/app/api/auth/reset-password/route.ts#L40-L65`](file:///e:/Projects/rs_consultancy/src/app/api/auth/reset-password/route.ts#L40-L65)
    * *Root Cause*: Resetting user password updates password hash but does not invalidate pre-existing JWT tokens stored in active browser cookies.

21. **MEDIUM: Unrestricted Talent Pool Scraping via Unpaginated API Iteration**
    * *File*: [`src/app/api/employee/candidates/route.ts#L22-L35`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L22-L35)
    * *Root Cause*: Sourcing endpoint lacks rate limiting or max limit bounds, allowing rogue employees to export the entire talent database.

22. **MEDIUM: Insecure OTP Verification Timing Comparison**
    * *File*: [`src/lib/otp.ts#L55-L75`](file:///e:/Projects/rs_consultancy/src/lib/otp.ts#L55-L75)
    * *Root Cause*: Uses standard string comparison (`otpCode === cleanCode`) instead of `crypto.timingSafeEqual`, exposing OTP verification to side-channel timing attacks.

23. **MEDIUM: Invoice ID Direct Enumeration Risk**
    * *File*: [`src/app/api/invoices/route.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L20-L40)
    * *Root Cause*: Route permits fetching invoices by UUID without checking if the user belongs to the company billed on that invoice.

24. **LOW: Internal Screening Notes Leak in Candidate Dashboard Payload**
    * *File*: [`src/app/api/candidates/dashboard/route.ts#L30-L50`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/dashboard/route.ts#L30-L50)
    * *Root Cause*: Includes full `ApplicationStatusHistory` array which contains recruiter internal feedback comments (`notes`).

25. **LOW: Missing Host Subdomain Multi-Tenant Boundary Isolation**
    * *File*: [`src/proxy.ts#L1-L35`](file:///e:/Projects/rs_consultancy/src/proxy.ts#L1-L35)
    * *Root Cause*: Middleware does not check host subdomains (e.g. `client.rsbridge.com` vs `admin.rsbridge.com`).

26. **LOW: Missing IP Allowlisting on Financial & Settlement Endpoints**
    * *File*: [`src/app/api/admin/financials/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts)
    * *Root Cause*: High-risk financial revenue reports lack IP subnet restrictions for enterprise office locations.

27. **LOW: Unrestricted Skill Taxonomy Creation via Public API**
    * *File*: [`src/app/api/skills/route.ts#L10-L30`](file:///e:/Projects/rs_consultancy/src/app/api/skills/route.ts#L10-L30)
    * *Root Cause*: Public visitors can post arbitrary skill strings directly into the master database.

28. **LOW: Missing Route Guard on Candidate Document Upload Status**
    * *File*: [`src/app/api/candidates/resumes/route.ts#L40-L60`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/resumes/route.ts#L40-L60)
    * *Root Cause*: Candidate can upload new resumes while active background checks are under progress.

---

## [Section C] Advanced Executive & Driver Resume Processing, Formatting & Parsing

29. **CRITICAL: Multi-Column Resume Interleaving Corruption in Text Stream**
    * *File*: [`src/lib/resumeParser.ts#L45-L80`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L45-L80)
    * *Root Cause*: Linear stream extraction merges two-column resumes across horizontal scanlines, merging phone numbers into education degree titles.
    * *Industry Benchmark*: Sovren / Textkernel use 2D spatial layout analysis before text extraction.

30. **CRITICAL: Unicode & Smart Punctuation Character Alignment Shift in PDF**
    * *File*: [`src/lib/pdf.ts#L170-L185`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L170-L185)
    * *Root Cause*: PDF string width calculation (`cleaned.length * size * charWidthRatio`) over-estimates width on CJK characters or non-breaking spaces, causing misaligned right headers.

31. **HIGH: Lack of Optical Character Recognition (OCR) Fallback for Scanned PDFs**
    * *File*: [`src/lib/resumeParser.ts#L20-L35`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L20-L35)
    * *Root Cause*: Scanned image PDF resumes return empty text strings without triggering OCR alerts for driver license documents.

32. **HIGH: Multiline Bullet Indentation Overlap on Page 2 Transition**
    * *File*: [`src/lib/pdf.ts#L315-L330`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L315-L330)
    * *Root Cause*: Multiline project bullets wrapped across page boundaries lose bullet offset formatting and left align to page margin.

33. **MEDIUM: Missing PDF Document Outline Tree Bookmarks (`/Outlines`)**
    * *File*: [`src/lib/pdf.ts#L395-L425`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L395-L425)
    * *Root Cause*: Executive resumes spanning 3+ pages lack native PDF document outline bookmarks for PDF reader navigation.

34. **MEDIUM: Truncation of Heavy Vehicle Endorsements on Driver Cards**
    * *File*: [`src/lib/pdf.ts#L255-L270`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L255-L270)
    * *Root Cause*: Driver profile cards clip vehicle types list if candidate holds more than 4 commercial endorsements.

35. **MEDIUM: Silent Text Merge on PDF Table-Formatted Resumes**
    * *File*: [`src/lib/resumeParser.ts#L95-L125`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L95-L125)
    * *Root Cause*: Resumes using HTML/PDF table cells drop column dividers, merging salary numbers with years of experience.

36. **LOW: Missing Embedded Font Subsetting for Special International Names**
    * *File*: [`src/lib/pdf.ts#L415-L430`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L415-L430)
    * *Root Cause*: Standard Type1 Helvetica fonts fail to render diacritics in international candidate names.

37. **LOW: Missing Dynamic "Page X of Y" Footer Numbering**
    * *File*: [`src/lib/pdf.ts#L370-L385`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L370-L385)
    * *Root Cause*: Multi-page PDF output lacks page count tags in footer.

38. **LOW: Linear Over-Counting of Concurrent Experience Years**
    * *File*: [`src/lib/resumeParser.ts#L180-L210`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L180-L210)
    * *Root Cause*: Parser sums total experience years linearly across overlapping roles, inflating candidate total experience.

39. **LOW: Truncation of Fractional CGPA Scores in Education Normalization**
    * *File*: [`src/lib/resumeParser.ts#L130-L145`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L130-L145)
    * *Root Cause*: Converts "8.4 CGPA" to integer "8", truncating precision.

40. **LOW: Missing PDF Security Permissions Flag on Unmasked Profile Downloads**
    * *File*: [`src/lib/pdf.ts#L410-L435`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L410-L435)
    * *Root Cause*: Downloaded PDFs omit `/Encrypt` permissions restricting unauthorized text copying by third-party headhunters.

41. **LOW: Unformatted Timestamp Formatting in Work Experience Items**
    * *File*: [`src/lib/resumeParser.ts#L205`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L205)
    * *Root Cause*: Outputs raw ISO dates (`2021-05-01T00:00:00.000Z`) instead of clean formatted dates (`May 2021`).

42. **LOW: Misaligned Hyperlink Hitboxes on Wrapped Line Links**
    * *File*: [`src/lib/pdf.ts#L305-L315`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L305-L315)
    * *Root Cause*: Hyperlink bounding box assumes single text line; wrapped project URLs create clickable hitboxes over unrelated body text.

---

## [Section D] Commercial Recruitment Governance & Staffing Operations

43. **CRITICAL: Unenforced Candidate Exclusivity Representation Window (180 Days)**
    * *File*: [`src/app/api/applications/route.ts#L135-L160`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L135-L160)
    * *Root Cause*: When an agency submits a candidate to a client, representation rights last 180-365 days. If a client rejects the candidate for Mandate A but hires them for Mandate B 4 months later, system has no tracking to claim legal commission fees.

44. **CRITICAL: Inability to Schedule Retained Search Milestone Billing (1/3 - 1/3 - 1/3)**
    * *File*: [`src/app/api/admin/placements/route.ts#L60-L95`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L60-L95)
    * *Root Cause*: System only supports Contingency billing on candidate joining; Retained search mandates (1/3 upfront retainer, 1/3 shortlist presentation, 1/3 joining) cannot be scheduled.

45. **HIGH: Absence of Split Placement Commission Rules (Sourcing vs Account Management)**
    * *File*: [`src/app/api/admin/placements/route.ts#L50-L65`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L50-L65)
    * *Root Cause*: Stores single recruiter ID. When Recruiter A sources candidate and Recruiter B manages client account, agency 50/50 commission split cannot be computed.

46. **HIGH: Replacement Guarantee Reset Vulnerability on Rehire**
    * *File*: [`src/app/api/admin/placements/resignation/route.ts#L35-L55`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L35-L55)
    * *Root Cause*: Deactivating a placement does not lock candidate profile against re-registering and triggering duplicate replacement cycles.

47. **HIGH: Missing Monthly Recruiter Billed Revenue Target Models**
    * *File*: [`prisma/schema.prisma#L94-L108`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L94-L108)
    * *Root Cause*: Database lacks fields (`monthlyQuotaAmount`) for Admins to track recruiter performance against monthly billing quotas.

48. **MEDIUM: Notice Period Buyout & Sign-On Bonus Tax Breakdown Omitted**
    * *File*: [`src/app/api/admin/placements/route.ts#L40-L45`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40-L45)
    * *Root Cause*: Sign-on bonuses and notice buyout compensation are added to agreed CTC without separating non-commissionable expense items.

49. **MEDIUM: Client Credit Limit Threshold Enforcement Missing**
    * *File*: [`src/app/api/requirements/route.ts#L70-L85`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L70-L85)
    * *Root Cause*: Client companies have no credit limit thresholds (e.g. ₹10,00,000 max open unpaid risk), allowing over-leveraged clients to post mandates.

50. **MEDIUM: Missing Experience Level Gap Validation on Placement**
    * *File*: [`src/app/api/admin/placements/route.ts#L25-L40`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L25-L40)
    * *Root Cause*: Allows placing a candidate with 0.5 years experience into a Senior requirement requesting 8+ years without requiring Admin override justification.

51. **MEDIUM: Missing Candidate Offer Rejection / Counter-Offer Capture**
    * *File*: [`src/app/candidate/applications/page.tsx#L70-L90`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L70-L90)
    * *Root Cause*: Candidates declining job offer letters cannot submit counter-offer figures or formal rejection reasons.

52. **LOW: Absence of Automatic Candidate Cool-off Period (90 Days)**
    * *File*: [`src/app/api/applications/route.ts#L135-L150`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L135-L150)
    * *Root Cause*: Candidates rejected by a client can re-apply to the exact same client requirement within 48 hours.

53. **LOW: Missing Multi-Agency Sub-Contractor Vendor Tiering**
    * *File*: [`prisma/schema.prisma#L211-L244`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L211-L244)
    * *Root Cause*: Lacks taxonomy for sub-vendor partners (Tier-1 Sourcing Partner vs Sub-Contractor).

54. **LOW: Missing Client Master Service Agreement Expiry Alerts**
    * *File*: [`src/app/api/requirements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts)
    * *Root Cause*: System does not alert account managers when client annual Master Service Agreements (MSAs) expire.

55. **LOW: Unvalidated Probation Period Replacement Terms**
    * *File*: [`src/app/api/admin/placements/route.ts#L60`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L60)
    * *Root Cause*: Custom client probation terms (e.g. 180 days) revert to default 60 days without contractual warning.

56. **LOW: Absence of Volume Placement Discount Rebate Engine**
    * *File*: [`src/app/api/admin/placements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts)
    * *Root Cause*: Clients hiring 10+ candidates per month receive no automated volume discount tier calculations.

57. **LOW: Candidate Relocation Allowance Improperly Bundled in CTC**
    * *File*: [`src/app/api/admin/placements/route.ts#L40`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40)
    * *Root Cause*: One-time relocation bonuses paid by clients are bundled into annual base CTC calculations.

58. **LOW: Incomplete Client Candidate Rejection Reason Taxonomy**
    * *File*: [`src/app/api/applications/route.ts#L325`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L325)
    * *Root Cause*: Client rejection notes lack standardized categories (`SKILL_FIT`, `SALARY_EXPECTATION`, `CULTURE_FIT`).

---

## [Section E] Enterprise ATS Pipeline & Sourcing Matchmaking

59. **CRITICAL: Lack of Bulk Candidate CSV/XLSX Sourcing Import**
    * *File*: [`src/app/employee/candidates/new/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/new/page.tsx)
    * *Root Cause*: Recruiters provisioning 100 logistics drivers or corporate candidates must enter them one-by-one through UI forms.
    * *Industry Benchmark*: Lever & Zoho Recruit support bulk CSV/XLSX imports with column mapping.

60. **CRITICAL: Candidate Duplicate Detection & Merge Engine Missing**
    * *File*: [`src/app/api/employee/candidates/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts)
    * *Root Cause*: If a candidate creates two accounts (one with personal email, one with work email), recruiters have no merge tool to consolidate interaction history.

61. **HIGH: Missing Automated Interview Calendar Invites (.ics / iCal)**
    * *File*: [`src/lib/notifications.ts#L15-L40`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L15-L40)
    * *Root Cause*: Scheduling interviews dispatches plain text emails without attaching standard `.ics` calendar invitation files.

62. **HIGH: Recruiter Candidate Pinning & Star Queue Missing**
    * *File*: [`src/app/employee/candidates/page.tsx#L320-L350`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L320-L350)
    * *Root Cause*: Sourcing queue sorts strictly by `createdAt: desc` without priority candidate pinning or recruiter star tagging.

63. **MEDIUM: Missing Online Assessment Link Integration**
    * *File*: [`src/app/api/applications/route.ts#L200-L230`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L200-L230)
    * *Root Cause*: Pipeline cards cannot store technical coding assessment links or driver psychometric test URLs.

64. **MEDIUM: Missing Application Stage Undo / Re-Open Action**
    * *File*: [`src/app/api/applications/route.ts#L250-L280`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L250-L280)
    * *Root Cause*: Mistakenly marking a candidate as "Rejected" cannot be undone without manual database intervention.

65. **MEDIUM: Lack of Candidate Reschedule Slot Proposal Workflow**
    * *File*: [`src/app/candidate/applications/page.tsx#L90-L120`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L90-L120)
    * *Root Cause*: Declining an interview simply withdraws application rather than offering 3 selectable alternative time slots.

66. **LOW: Missing Employer Offer Letter Document Attachment Upload**
    * *File*: [`src/app/api/applications/route.ts#L215-L225`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L215-L225)
    * *Root Cause*: Employers extending offers can only type numeric CTC without uploading the formal PDF Offer Letter.

67. **LOW: Unrecorded Telephonic Screening Call Logs**
    * *File*: [`prisma/schema.prisma#L340-L352`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L340-L352)
    * *Root Cause*: Recruiter telephonic screening notes are overwritten on status update instead of creating chronological call entries.

68. **LOW: Missing Visual Candidate Profile Completeness Score**
    * *File*: [`src/app/candidate/profile/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/candidate/profile/page.tsx)
    * *Root Cause*: Candidate profiles missing education or experience entries lack visual progress bars (e.g. "Profile 60% Complete").

69. **LOW: Missing Shift Preference Filters for Driver Candidates**
    * *File*: [`src/app/employee/candidates/page.tsx#L100-L120`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L100-L120)
    * *Root Cause*: Fleet drivers cannot be filtered by Night Shift vs Day Shift availability.

70. **LOW: Lack of Application Source Attribution Analytics**
    * *File*: [`src/app/admin/dashboard/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/admin/dashboard/page.tsx)
    * *Root Cause*: Admin dashboard cannot measure ROI between LinkedIn, Naukri, Referral, and Field Scout sourcing channels.

71. **LOW: Absence of Structured Client Interviewer Scorecards**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L550-L580`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L550-L580)
    * *Root Cause*: Client HR contacts cannot submit 1-5 star scorecards across technical assessment criteria.

72. **LOW: Missing Bulk Application Status Advancement Tool**
    * *File*: [`src/app/employee/candidates/page.tsx#L350-L380`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L350-L380)
    * *Root Cause*: Recruiters shortlisting 20 candidates must click status dropdowns 20 times individually.

---

## [Section F] WhatsApp, SMS & Multi-Channel Communications

73. **CRITICAL: WhatsApp Meta Template Parameter Interpolation Omitted**
    * *File*: [`src/lib/notifications.ts#L60-L80`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L60-L80)
    * *Root Cause*: Sends raw text strings instead of structured Meta Cloud API registered template components (`parameters: [{ type: "text", text: candidateName }]`).
    * *Impact*: Non-template WhatsApp messages sent outside 24-hour customer service windows are rejected by Meta API.

74. **HIGH: Lack of WhatsApp Webhook Delivery & Read Receipt Tracking**
    * *File*: [`prisma/schema.prisma#L424-L437`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L424-L437)
    * *Root Cause*: `InAppNotification` model has no fields for `whatsappMessageId` or delivery receipts (Sent/Delivered/Read).

75. **HIGH: Missing Email Delivery Retry Queue & Dead Letter Logging**
    * *File*: [`src/lib/notifications.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L20-L40)
    * *Root Cause*: If Resend API rate limits or network times out, notification is permanently dropped without background job retry.

76. **MEDIUM: Missing Automated 2-Hour Interview Arrival Reminders**
    * *File*: [`src/lib/notifications.ts`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts)
    * *Root Cause*: No scheduled worker checks for upcoming interviews today to send SMS/WhatsApp arrival reminders to candidates.

77. **MEDIUM: Hardcoded Email Sender Domain (`notifications@rsbridge.com`)**
    * *File*: [`src/lib/notifications.ts#L25`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L25)
    * *Root Cause*: Development and staging environments trigger SPF/DKIM verification failures.

78. **LOW: Unvalidated WhatsApp Message Length Truncation**
    * *File*: [`src/lib/notifications.ts#L65`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L65)
    * *Root Cause*: Does not validate body text length against Meta's 4096-character limit before POSTing.

79. **LOW: Missing Unsubscribe Preference Management Endpoint**
    * *File*: [`src/lib/notifications.ts#L30`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L30)
    * *Root Cause*: Unsubscribe link in email footer directs candidates to unhandled route.

80. **LOW: Missing Browser Web Push Audio / Haptic Notification Triggers**
    * *File*: [`src/components/Navbar.tsx`](file:///e:/Projects/rs_consultancy/src/components/Navbar.tsx)
    * *Root Cause*: New interview invites update badge state silently without Web Push Audio API triggers.

81. **LOW: Plaintext WhatsApp Message Formatting**
    * *File*: [`src/lib/notifications.ts#L68`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L68)
    * *Root Cause*: WhatsApp payloads omit WhatsApp markdown formatting (`*bold*`, `_italic_`).

82. **LOW: Missing Candidate Opt-In / Opt-Out Consent Verification**
    * *File*: [`src/lib/notifications.ts#L50`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L50)
    * *Root Cause*: Dispatches WhatsApp alerts without checking if candidate opted out of messaging.

---

## [Section G] Database Architecture, Indexing & Query Optimizations

83. **CRITICAL: Unindexed Case-Insensitive Skill Search Query Scans**
    * *File*: [`prisma/schema.prisma#L110-L119`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L110-L119)
    * *Root Cause*: `Skill.name` searches using `LOWER(name)` perform full table scans without a PostgreSQL `citext` or functional index.

84. **HIGH: Missing Composite Index on `candidates(preferred_category, experience_level)`**
    * *File*: [`prisma/schema.prisma#L121-L156`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L121-L156)
    * *Root Cause*: Candidate sourcing pool queries filtering by category and experience level execute sequential table scans.

85. **HIGH: Missing Connection Pool Limit Query Parameter on Neon Postgres**
    * *File*: [`src/lib/db.ts#L1-L15`](file:///e:/Projects/rs_consultancy/src/lib/db.ts#L1-L15)
    * *Root Cause*: Database connection URL lacks `connection_limit=10` parameter, risking connection exhaustion under serverless cold starts.

86. **MEDIUM: Unbounded Application History Sub-Query Loads**
    * *File*: [`src/app/api/employee/candidates/route.ts#L50-L80`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L50-L80)
    * *Root Cause*: Pipeline query fetches complete `history` array for every application card without `take: 5` bounds.

87. **MEDIUM: Missing Partial Index on Active Unpaid Invoices**
    * *File*: [`prisma/schema.prisma#L379-L403`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L379-L403)
    * *Root Cause*: Finance queries scanning overdue payments search through paid and cancelled historical invoices.

88. **LOW: High-Churn Table Dead Tuple Accumulation**
    * *File*: [`prisma/schema.prisma#L444-L457`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L444-L457)
    * *Root Cause*: `verification_otps` and `in_app_notifications` accumulate dead tuple bloat without automated vacuum cleanup.

89. **LOW: Unoptimized Sequential Count Queries on Requirement Dashboard**
    * *File*: [`src/app/api/requirements/route.ts#L33-L47`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L33-L47)
    * *Root Cause*: Fetches total counts using separate sub-queries per card instead of single aggregated `groupBy`.

90. **LOW: Missing Index on `company_contacts(company_branch_id, is_approved)`**
    * *File*: [`prisma/schema.prisma#L246-L262`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L246-L262)
    * *Root Cause*: Admin verification approval queues execute unindexed table scans.

91. **LOW: Heavy Column Selection on Summary Candidate Cards**
    * *File*: [`src/app/api/employee/candidates/route.ts#L25-L35`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L25-L35)
    * *Root Cause*: Sourcing API returns heavy text columns (`policeVerificationDocUrl`, `blacklistReason`) when rendering light summary cards.

92. **LOW: Missing Foreign Key Cascade Deletion Rules on Branch Relations**
    * *File*: [`prisma/schema.prisma#L276-L305`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L276-L305)
    * *Root Cause*: Soft-deleting a company branch leaves orphaned `job_requirements` records.

---

## [Section H] Frontend UI/UX, Theme Tokens & Accessibility (a11y)

93. **HIGH: Lack of Modal Focus Trap and ESC Key Listeners on Screening Dialogs**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L700-L750`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L700-L750)
    * *Root Cause*: Screening modal dialogs allow keyboard focus to escape into background DOM elements.

94. **HIGH: Hardcoded Color Hex Strings Violating CSS Theme Custom Properties**
    * *File*: [`src/app/globals.css`](file:///e:/Projects/rs_consultancy/src/app/globals.css) & [`src/app/employee/candidates/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx)
    * *Root Cause*: Components use inline hex strings (`#0F172A`, `#2563EB`) instead of design tokens (`var(--primary)`, `var(--surface)`).

95. **MEDIUM: Missing Form Dirty State Confirmation (`beforeunload`)**
    * *File*: [`src/app/company/requirements/new/page.tsx#L125-L200`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/new/page.tsx#L125-L200)
    * *Root Cause*: Accidental navigation discards typed job specifications without confirmation alerts.

96. **MEDIUM: Raw Unformatted Salary Numerals in Public Job Badges**
    * *File*: [`src/components/JobList.tsx#L320-L325`](file:///e:/Projects/rs_consultancy/src/components/JobList.tsx#L320-L325)
    * *Root Cause*: Renders max salary as raw integer without locale formatting (`₹18.0 Lakhs / Year`).

97. **LOW: Missing Screen Reader ARIA Attributes on Candidate Status Badges**
    * *File*: [`src/app/employee/candidates/page.tsx#L530-L550`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L530-L550)
    * *Root Cause*: Status badges use visual unicode bullets (`●`) without `aria-label="Status: Shortlisted"`.

98. **LOW: Sourcing Filter Bar Mobile Viewport Overflow**
    * *File*: [`src/app/employee/candidates/page.tsx#L500-L530`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L500-L530)
    * *Root Cause*: Multi-column filter bar overflows horizontally on 375px mobile viewports.

99. **LOW: Missing Animated Skeleton Loaders during Data Fetching**
    * *File*: [`src/app/company/dashboard/page.tsx#L115-L125`](file:///e:/Projects/rs_consultancy/src/app/company/dashboard/page.tsx#L115-L125)
    * *Root Cause*: Displays generic "Loading requirements..." text causing layout shift (CLS).

100. **LOW: Plaintext Location Display Missing Navigation Map Hyperlinks**
     * *File*: [`src/app/company/requirements/[id]/page.tsx#L765-L780`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L765-L780)
     * *Root Cause*: Text address is sent without generating a clickable Google Maps navigation URL for driver/field candidates.
