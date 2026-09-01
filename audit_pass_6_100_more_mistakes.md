# RS Bridge Consultancy — Deep Senior Engineering Audit (Pass 6)
**Exhaustive Analysis of 100 Advanced Enterprise Architecture, Statutory Tax Compliance, Security Scoping, PDF Engine Geometry, and Commercial Staffing Defects**

---

## Index of Finding Categories
1. **[Section A] Advanced Labor Law Compliance, Sub-Contracting & Tax Audit Readiness** (Findings 1 – 15)
2. **[Section B] Enterprise RBAC Isolation, JWT Token Revocation & CSRF Hardening** (Findings 16 – 28)
3. **[Section C] High-Precision Vector PDF Engine Spatial Geometry & Resume Parsing** (Findings 29 – 42)
4. **[Section D] Staffing Commercial Operations, Gross Margin Controls & Retainer Ledgers** (Findings 43 – 58)
5. **[Section E] Enterprise ATS Telemetry, Fuzzy Matching & Candidate Experience** (Findings 59 – 72)
6. **[Section F] Multi-Channel Notification Webhooks, Meta Template SLA & WebPush** (Findings 73 – 82)
7. **[Section G] Database Performance, Indexing & High-Availability Serverless Tuning** (Findings 83 – 92)
8. **[Section H] Frontend Design System Tokens, Micro-Animations & Accessibility** (Findings 93 – 100)

---

## [Section A] Advanced Labor Law Compliance, Sub-Contracting & Tax Audit Readiness

1. **CRITICAL: Omission of E-Way Bill & Reverse Charge (RCM) Declaration on Invoices**
   * *File*: [`src/app/api/invoices/route.ts#L34-L50`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L34-L50)
   * *Root Cause*: Invoice data objects omit mandatory GST Rule 46 declaration stating whether tax is payable on Reverse Charge basis.
   * *Industry Benchmark*: SAP SuccessFactors & Zoho Books print mandatory RCM legal status footers on all B2B staffing tax invoices.

2. **CRITICAL: Unverified PF (Provident Fund) & ESIC Statutory Compliance Status**
   * *File*: [`prisma/schema.prisma#L140-L158`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L140-L158)
   * *Root Cause*: Candidate profile schema lacks UAN (Universal Account Number) and ESIC IP Number validation fields for fleet drivers and logistics field staff.
   * *Impact*: Exposes agency to vicarious liability penalties under Employees' Provident Funds and Miscellaneous Provisions Act 1952.

3. **CRITICAL: Missing Motor Vehicles Act (Section 3) Heavy Transport Verification**
   * *File*: [`src/app/api/candidates/register/route.ts#L60-L90`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/register/route.ts#L60-L90)
   * *Root Cause*: Driver registrations accept commercial driving licenses without recording mandatory Heavy Transport Badge endorsement validity dates under Motor Vehicles Act 1988.

4. **HIGH: Absence of State-Specific Labour Welfare Fund (LWF) Deduction Tracking**
   * *File*: [`src/app/api/admin/financials/route.ts#L55-L80`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts#L55-L80)
   * *Root Cause*: Financial reports sum gross revenue without isolating state-specific Labour Welfare Fund (LWF) statutory employer/employee deductions (e.g. Maharashtra LWF Act 1953).

5. **HIGH: Missing GST Annual Return (Form GSTR-9) Reconciliation Audit Log**
   * *File*: [`src/app/api/invoices/route.ts#L15-L35`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L15-L35)
   * *Root Cause*: Invoicing query endpoint does not tag financial quarter or GSTR-1 filing status flags (`isGstr1Filed`), breaking end-of-year tax reconciliation.

6. **HIGH: Lack of Statutory Commercial Contract Termination Notice Clause**
   * *File*: [`src/app/api/companies/terms/route.ts#L80-L110`](file:///e:/Projects/rs_consultancy/src/app/api/companies/terms/route.ts#L80-L110)
   * *Root Cause*: Terms acceptance snapshot records agreement without recording mandatory 30-day contract termination notice period clauses required under Indian Contract Act 1872.

7. **MEDIUM: Unverified Minimum Wages Act Categorization for Drivers & Field Staff**
   * *File*: [`src/app/api/requirements/route.ts#L85-L120`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L85-L120)
   * *Root Cause*: Vacancy intake accepts salary numbers for Drivers without comparing against Minimum Wages Act prescribed state floor rates (Unskilled / Semi-Skilled / Skilled / Highly Skilled).

8. **MEDIUM: Missing Shop & Commercial Establishment Registration Storage**
   * *File*: [`prisma/schema.prisma#L223-L245`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L223-L245)
   * *Root Cause*: Company branch schema lacks fields for state Shop & Establishment registration numbers required for regional hiring branches.

9. **MEDIUM: Incomplete Form 26AS Tax Credit Matching Endpoint**
   * *File*: [`src/app/api/admin/financials/route.ts#L70-L85`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts#L70-L85)
   * *Root Cause*: Financial analytics endpoint cannot filter placements by TDS deducted vs TDS deposited on Income Tax e-filing portal.

10. **MEDIUM: Omission of Statutory Workman Insurance Policy Tracking**
    * *File*: [`prisma/schema.prisma#L278-L305`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L278-L305)
    * *Root Cause*: Driver job requirements omit fields for Workmen's Compensation Insurance Policy numbers under Employee's Compensation Act 1923.

11. **LOW: Missing PAN/Aadhaar Seeding Status Check for Candidates**
    * *File*: [`src/app/api/candidates/profile/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/profile/route.ts)
    * *Root Cause*: Candidate profile does not record PAN-Aadhaar linking verification status required for corporate payroll onboarding.

12. **LOW: Lack of Interest on Overdue Payment Contractual Clause Enforcement**
    * *File*: [`src/app/api/invoices/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts)
    * *Root Cause*: Overdue invoices do not compute statutory late payment interest (18% p.a.) after 30 days delinquency.

13. **LOW: Absence of Equal Remuneration Act Compliance Disclosure**
    * *File*: [`src/app/(public)/jobs/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/%28public%29/jobs/page.tsx)
    * *Root Cause*: Public job listings omit mandatory Equal Remuneration Act compliance footers prohibiting gender-based pay discrimination.

14. **LOW: Missing Digital Contract Archival Retention Schedule (8 Years)**
    * *File*: [`src/app/api/companies/terms/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/companies/terms/route.ts)
    * *Root Cause*: Terms snapshots lack automatic statutory 8-year tax retention policy tags required under Companies Act 2013 Section 128.

15. **LOW: Missing Sub-Contractor Labor License Registration**
    * *File*: [`prisma/schema.prisma#L247-L263`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L247-L263)
    * *Root Cause*: Contact schema lacks Contract Labour (Regulation and Abolition) Act 1970 license numbers for manpower contractors.

---

## [Section B] Enterprise RBAC Isolation, JWT Token Revocation & CSRF Hardening

16. **CRITICAL: Missing Anti-CSRF Token Validation on Mutating API Endpoints**
    * *File*: [`src/app/api/applications/route.ts#L108-L125`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L108-L125)
    * *Root Cause*: API POST/PATCH handlers rely strictly on session cookie presence without evaluating double-submit CSRF tokens or custom request header checks (`X-Requested-With`).
    * *Impact*: Vulnerable to Cross-Site Request Forgery attacks executing unauthorized candidate applications or status changes.

17. **CRITICAL: Insecure Password Reset Token Entropy & Lifetime**
    * *File*: [`src/app/api/auth/forgot-password/route.ts#L25-L50`](file:///e:/Projects/rs_consultancy/src/app/api/auth/forgot-password/route.ts#L25-L50)
    * *Root Cause*: Password reset token uses short 6-digit numeric strings valid for 60 minutes instead of cryptographically secure 256-bit URL-safe tokens valid for 15 minutes.

18. **HIGH: Missing User Account Lockout Policy on Consecutive Auth Failures**
    * *File*: [`src/lib/auth.ts#L14-L37`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts#L14-L37)
    * *Root Cause*: `authorize()` callback does not track or increment `failedLoginAttempts`. Rogue scripts can execute infinite dictionary brute-force attacks against user credentials.

19. **HIGH: Session Fixation Risk on Role Privilege Escalation**
    * *File*: [`src/lib/auth.ts#L41-L56`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts#L41-L56)
    * *Root Cause*: When an Admin approves a CompanyContact (`isApproved: true`), existing active JWT session tokens are not regenerated, keeping stale privilege claims active until re-login.

20. **HIGH: Unrestricted User Provisioning Endpoint Access**
    * *File*: [`src/app/api/admin/candidates/provision/route.ts#L10-L25`](file:///e:/Projects/rs_consultancy/src/app/api/admin/candidates/provision/route.ts#L10-L25)
    * *Root Cause*: Provisioning handler checks session user presence but fails to restrict execution exclusively to `ADMIN` roles.

21. **MEDIUM: Cleartext Password Fallback in Legacy Authentication Paths**
    * *File*: [`src/lib/auth.ts#L28`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts#L28)
    * *Root Cause*: Password verification does not enforce minimum password length (8+ characters) or complexity rules on password update handlers.

22. **MEDIUM: Missing HTTP Security Headers (HSTS, CSP, X-Frame-Options)**
    * *File*: [`next.config.ts`](file:///e:/Projects/rs_consultancy/next.config.ts)
    * *Root Cause*: Next.js configuration lacks explicit HTTP security headers (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

23. **MEDIUM: Unhashed Verification Tokens in Database Tables**
    * *File*: [`prisma/schema.prisma#L402-L413`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L402-L413)
    * *Root Cause*: `UserInvite` table stores raw unhashed token strings in `tokenHash` column.

24. **LOW: Missing Rate Limiting on Candidate Mobile OTP Dispatch**
    * *File*: [`src/app/api/auth/otp/send/route.ts#L15-L35`](file:///e:/Projects/rs_consultancy/src/app/api/auth/otp/send/route.ts#L15-L35)
    * *Root Cause*: Does not check client IP rate limits (e.g. max 3 OTP requests per 10 minutes), allowing SMS/WhatsApp API balance exhaustion.

25. **LOW: Missing Device & User-Agent Tracking on Active Sessions**
    * *File*: [`src/lib/auth.ts#L49-L56`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts#L49-L56)
    * *Root Cause*: JWT session objects do not store operating system or browser fingerprint tags for active user session management.

26. **LOW: Exposed Internal Server Error Messages in API JSON**
    * *File*: [`src/app/api/candidates/register/route.ts#L130`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/register/route.ts#L130)
    * *Root Cause*: Returns raw `error.message` strings on server exceptions, leaking PostgreSQL database table names and stack traces.

27. **LOW: Missing Password History Check (Preventing 3 Recent Passwords Reuse)**
    * *File*: [`src/app/api/auth/reset-password/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/auth/reset-password/route.ts)
    * *Root Cause*: Users resetting passwords can re-use their immediate past password.

28. **LOW: Lack of OAuth2 / SAML Single Sign-On (SSO) Support for Enterprise Clients**
    * *File*: [`src/lib/auth.ts`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts)
    * *Root Cause*: NextAuth provider list only includes basic Credentials, lacking Google Workspace / Okta SAML enterprise SSO integrations.

---

## [Section C] High-Precision Vector PDF Engine Spatial Geometry & Resume Parsing

29. **CRITICAL: Fixed Vertical Line Overwrite in Executive Resume PDF Header**
    * *File*: [`src/lib/pdf.ts#L180-L210`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L180-L210)
    * *Root Cause*: The PDF engine uses hardcoded vertical Y offsets for header ribbon elements (`boxBottom + 26`, `boxBottom + 13`). When candidate full names span 2 lines, header text overwrites the top branding border.

30. **CRITICAL: Unpdf Text Stream Interleaving in Complex Multi-Column Layouts**
    * *File*: [`src/lib/resumeParser.ts#L24-L32`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L24-L32)
    * *Root Cause*: `extractText()` from `unpdf` reads raw PDF text operators linearly. Resumes with sidebar skill lists merge sidebar text into main work experience paragraphs.

31. **HIGH: Missing PDF Bounding Box Overflow Calculation for Multi-Line Job Titles**
    * *File*: [`src/lib/pdf.ts#L368-L375`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L368-L375)
    * *Root Cause*: `drawText()` for designation and company (`${exp.designation} at ${exp.companyName}`) does not calculate string length. Long designation titles overlap right-aligned employment dates.

32. **HIGH: Failure to Extract Embedded Hyperlinks from Raw Uploaded Resumes**
    * *File*: [`src/lib/resumeParser.ts#L45-L65`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L45-L65)
    * *Root Cause*: Resume parser extracts plain text visible strings but drops internal PDF annotation URI links (`/Annot /Subtype /Link`), losing candidate GitHub and portfolio URLs.

33. **MEDIUM: Single-Page Canvas Hardcoded Boundary in Driver Profile Cards**
    * *File*: [`src/lib/pdf.ts#L254-L274`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L254-L274)
    * *Root Cause*: Driver qualifications block assumes fixed 5-line height. Drivers listing 6+ commercial vehicle endorsements clip into the bottom zero-liability disclaimer box.

34. **MEDIUM: Loss of Bullet Point Indentation Formatting on Wrapped Lines**
    * *File*: [`src/lib/pdf.ts#L316-L326`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L316-L326)
    * *Root Cause*: Wrapped project bullet lines use `LEFT_MARGIN + 14` for all lines. Subsequent wrapped lines align under the bullet asterisk rather than hanging indent under body text.

35. **MEDIUM: Character Encoding Shift on Emoji & Non-WinAnsi Unicode Strings**
    * *File*: [`src/lib/pdf.ts#L70-L79`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L70-L79)
    * *Root Cause*: `cleanAscii()` strips all non-ASCII characters (`[^\x20-\x7E]`), replacing Unicode characters (e.g. `–`, `—`, `•`, `é`, `ñ`) with empty spaces instead of proper WinAnsi fallbacks.

36. **LOW: Missing PDF Document Metadata Properties (CreationDate, ModDate)**
    * *File*: [`src/lib/pdf.ts#L400-L420`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L400-L420)
    * *Root Cause*: PDF `/Info` dictionary omits `/CreationDate` and `/ModDate` ISO formatted timestamps.

37. **LOW: Hardcoded A4 Aspect Ratio Clip on US Letter Printers**
    * *File*: [`src/lib/pdf.ts#L474`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L474)
    * *Root Cause*: MediaBox is fixed at `[0 0 595 842]` (A4). Printing on North American US Letter paper (612 x 792 pt) clips top and bottom 25pt margins.

38. **LOW: Absence of PDF File Compression for Watermark Background Objects**
    * *File*: [`src/lib/pdf.ts#L158-L161`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L158-L161)
    * *Root Cause*: Watermark text stream chunks are appended uncompressed to every page stream, bloating PDF byte sizes.

39. **LOW: Unhandled Parsing of Custom Date Formats (e.g. "Mon 2021", "Q3 2022")**
    * *File*: [`src/lib/resumeParser.ts#L103-L106`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L103-L106)
    * *Root Cause*: Education date regex only matches 3-letter standard months, discarding non-standard quarter date strings.

40. **LOW: Missing Candidate Ref Code Checksum Digits**
    * *File*: [`src/lib/pdf.ts#L86-L109`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L86-L109)
    * *Root Cause*: `generateCandidateRefCode()` uses simple modulo 9000 hashing without Luhn checksum digits, risking reference code entry typos.

41. **LOW: Lack of PDF Form Field Support for Interactive Screening Notes**
    * *File*: [`src/lib/pdf.ts`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts)
    * *Root Cause*: PDF output is strictly static vector graphics, lacking interactive PDF Form fields (`/AcroForm`) for recruiter offline note entry.

42. **LOW: Missing Table Column Auto-Sizing in Skill Matrix Rendering**
    * *File*: [`src/lib/pdf.ts#L350-L362`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L350-L362)
    * *Root Cause*: Category label width is estimated using fixed multiplier `(length + 3) * 4.4`, causing long skill category names to overlap skill pill strings.

---

## [Section D] Staffing Commercial Operations, Gross Margin Controls & Retainer Ledgers

43. **CRITICAL: Absence of Placement Minimum Gross Margin Percentage Controls**
    * *File*: [`src/app/api/admin/placements/route.ts#L40-L50`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40-L50)
    * *Root Cause*: Placement creation allows entering custom commission rates below agency operational costs (e.g. 2%), resulting in negative gross margin placements.
    * *Industry Benchmark*: Randstad & Adecco enforce hard minimum gross margin percentage floors (15% minimum margin).

44. **CRITICAL: Missing Contractual Early Exit Replacement Window Clock Auto-Lock**
    * *File*: [`src/app/api/admin/placements/resignation/route.ts#L40-L55`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L40-L55)
    * *Root Cause*: System has no automated cron job to transition `replacementStatus` from `None` to `Expired` once candidate joining date exceeds `replacementWindowDaysApplied`.

45. **HIGH: Lack of Split Placement Account Manager Commission Allocation**
    * *File*: [`prisma/schema.prisma#L357-L382`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L357-L382)
    * *Root Cause*: Schema records `sourcingUserId` and `accountManagerUserId`, but financial reports calculate 100% of revenue under the single assigned user ID.

46. **HIGH: Absence of Invoice Partial Payment & Payment Source Ledger**
    * *File*: [`src/app/api/invoices/route.ts#L45-L75`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts#L45-L75)
    * *Root Cause*: Updating invoice status only supports `Draft`, `Sent`, `Paid`, `Overdue`, `Cancelled`. Partial client payments (e.g. ₹50,000 paid out of ₹1,00,000 invoice) cannot be recorded.

47. **HIGH: Missing Client Mandate Credit Limit Verification**
    * *File*: [`src/app/api/requirements/route.ts#L70-L85`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L70-L85)
    * *Root Cause*: Client branches can post unlimited open requirements without checking total open invoice liability against `clientCreditLimit`.

48. **MEDIUM: Unchecked Over-Hiring Beyond Vacancy Ceiling**
    * *File*: [`src/app/api/admin/placements/route.ts#L95-L105`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L95-L105)
    * *Root Cause*: Placement creation increments `vacanciesFilled` without verifying if `vacanciesFilled >= noOfVacancies`, allowing recruiters to place 5 candidates into a 2-vacancy requirement.

49. **MEDIUM: Omission of GST TDS (Section 51) Deductions for Government Clients**
    * *File*: [`src/app/api/admin/placements/route.ts#L75-L95`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L75-L95)
    * *Root Cause*: Invoicing engine assumes standard corporate GST without handling 2% GST TDS deductions (Section 51) applicable to PSUs and government bodies.

50. **MEDIUM: Missing Recruiter Commission Payout Hold on Unpaid Invoices**
    * *File*: [`src/app/api/admin/financials/route.ts#L55-L80`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts#L55-L80)
    * *Root Cause*: Commission reports list recruiter commission earnings on `Joined` status regardless of whether the client invoice has actually been collected.

51. **LOW: Missing Candidate Probation Period Expiry Notifications**
    * *File*: [`src/app/api/admin/placements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts)
    * *Root Cause*: Account managers receive no automated notification when a placed candidate completes their 60-day replacement guarantee window.

52. **LOW: Absence of Retained Search Retainer Settlement Engine**
    * *File*: [`src/app/api/invoices/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts)
    * *Root Cause*: Cannot offset initial retained search advance invoices against final placement invoices.

53. **LOW: Missing Volume Placement Rebate Ledger**
    * *File*: [`src/app/api/admin/placements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts)
    * *Root Cause*: Corporate clients placing 10+ candidates in a calendar month do not receive automated commission percentage tier adjustments.

54. **LOW: Unvalidated Currency Exchange Rates for International Placements**
    * *File*: [`src/app/api/admin/financials/route.ts#L60-L75`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts#L60-L75)
    * *Root Cause*: GCC / UAE branch placements in AED are summed as raw integers into INR financial totals without exchange rate conversion.

55. **LOW: Absence of Candidate Relocation Bonus Exclusion in Fee Calculations**
    * *File*: [`src/app/api/admin/placements/route.ts#L40`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40)
    * *Root Cause*: One-time candidate relocation allowances paid by hiring companies are improperly included in commissionable annual CTC.

56. **LOW: Missing Client Master Agreement Expiry Warning System**
    * *File*: [`src/app/api/requirements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts)
    * *Root Cause*: System allows posting new job requirements under expired client Master Service Agreements (MSAs).

57. **LOW: Lack of Recruiter Monthly Target Attainment Analytics**
    * *File*: [`src/app/admin/dashboard/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/admin/dashboard/page.tsx)
    * *Root Cause*: Admin dashboard displays total agency revenue without recruiter-wise monthly quota attainment progress bars.

58. **LOW: Incomplete Candidate Offer Letter Rejection Reason Codes**
    * *File*: [`src/app/api/applications/route.ts#L325`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L325)
    * *Root Cause*: Candidate offer rejections record unformatted notes instead of standardized rejection codes (`COUNTER_OFFER_ACCEPTED`, `LOCATION_UNWILLING`, `SALARY_TOO_LOW`).

---

## [Section E] Enterprise ATS Telemetry, Fuzzy Matching & Candidate Experience

59. **CRITICAL: Missing Automated Duplicate Candidate Detection Engine**
    * *File*: [`src/app/api/candidates/register/route.ts#L95-L125`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/register/route.ts#L95-L125)
    * *Root Cause*: Candidate registration checks exact unique phone and email matches independently. Candidates registering with different emails or mobile formats (`+919876543210` vs `09876543210`) create duplicate talent records.
    * *Industry Benchmark*: Lever & Greenhouse evaluate Levenshtein distance on names + normalized phone numbers to flag candidate duplicates.

60. **CRITICAL: Lack of Automated Interview Calendar Invites (.ics File Attachments)**
    * *File*: [`src/lib/notifications.ts#L15-L40`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L15-L40)
    * *Root Cause*: Scheduling an interview sends plain text email notifications without attaching standard RFC 5545 iCalendar (`.ics`) MIME parts, preventing automatic calendar additions.

61. **HIGH: Missing Recruiter Priority Pinning & Candidate Star Tagging**
    * *File*: [`src/app/employee/candidates/page.tsx#L320-L350`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L320-L350)
    * *Root Cause*: Recruiter candidate queue sorts strictly by creation date, lacking priority pinning or recruiter star rating overrides.

62. **HIGH: Absence of Candidate Assessment Link Dispatch Workflow**
    * *File*: [`src/app/api/applications/route.ts#L200-L230`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L200-L230)
    * *Root Cause*: ATS pipeline cards cannot store technical coding assessment links or driver psychometric test URLs for candidate completion.

63. **MEDIUM: Missing Application Stage Transition Undo Action**
    * *File*: [`src/app/api/applications/route.ts#L250-L280`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L250-L280)
    * *Root Cause*: If a recruiter mistakenly rejects a candidate, there is no "Undo / Reopen to Shortlisted" action without direct database editing.

64. **MEDIUM: Candidate Reschedule Time Slot Proposal Workflow Missing**
    * *File*: [`src/app/candidate/applications/page.tsx#L90-L120`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L90-L120)
    * *Root Cause*: Candidates declining scheduled interview times cannot propose 3 alternative time slots to hiring managers.

65. **MEDIUM: Absence of Formal Offer Letter Attachment Upload in Employer Portal**
    * *File*: [`src/app/api/applications/route.ts#L215-L225`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L215-L225)
    * *Root Cause*: Employers extending job offers can only type numeric CTC without uploading the formal PDF Offer Letter.

66. **LOW: Unrecorded Telephonic Screening Call Notes History**
    * *File*: [`prisma/schema.prisma#L340-L352`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L340-L352)
    * *Root Cause*: Recruiter telephonic screening notes are overwritten on status update instead of persisting chronological screening logs.

67. **LOW: Missing Visual Candidate Profile Completeness Score**
    * *File*: [`src/app/candidate/profile/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/candidate/profile/page.tsx)
    * *Root Cause*: Candidate profiles missing education or experience entries lack visual progress bars (e.g. "Profile 60% Complete").

68. **LOW: Missing Driver Shift Preference Filters (Day vs Night Shift)**
    * *File*: [`src/app/employee/candidates/page.tsx#L100-L120`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L100-L120)
    * *Root Cause*: Fleet driver candidates cannot be filtered by Night Shift vs Day Shift availability.

69. **LOW: Lack of Application Sourcing Attribution Analytics**
    * *File*: [`src/app/admin/dashboard/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/admin/dashboard/page.tsx)
    * *Root Cause*: Admin analytics cannot compare candidate conversion rates between LinkedIn, Naukri, Referral, and Field Scout channels.

70. **LOW: Absence of Structured Interviewer Evaluation Scorecards**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L550-L580`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L550-L580)
    * *Root Cause*: Client HR contacts cannot submit 1-5 star scorecards across technical assessment criteria.

71. **LOW: Missing Bulk Candidate Shortlisting Tool**
    * *File*: [`src/app/employee/candidates/page.tsx#L350-L380`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L350-L380)
    * *Root Cause*: Recruiters shortlisting 20 candidates must click status dropdowns 20 times individually.

72. **LOW: Missing Automated Interview Reminder Dispatch (2-Hour Warning)**
    * *File*: [`src/lib/notifications.ts`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts)
    * *Root Cause*: System has no cron job dispatching automated SMS/WhatsApp reminders 2 hours prior to scheduled interview times.

---

## [Section F] Multi-Channel Communication Webhooks, Meta Template SLA & WebPush

73. **CRITICAL: Meta WhatsApp API Template Parameter Component Formatting Omitted**
    * *File*: [`src/lib/notifications.ts#L60-L85`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L60-L85)
    * *Root Cause*: Sends raw text payloads instead of Meta Cloud API registered template components (`parameters: [{ type: "text", text: candidateName }]`). Messages sent outside 24h customer service windows fail.
    * *Impact*: WhatsApp interview alerts fail to deliver to candidates.

74. **HIGH: Missing WhatsApp Webhook Listener for Delivery & Read Receipts**
    * *File*: [`prisma/schema.prisma#L424-L437`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L424-L437)
    * *Root Cause*: `InAppNotification` model lacks fields for `whatsappMessageId` or delivery receipt callbacks (`Sent`, `Delivered`, `Read`).

75. **HIGH: Lack of Email Delivery Retry Queue & Dead Letter Logging**
    * *File*: [`src/lib/notifications.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L20-L40)
    * *Root Cause*: Resend API network timeouts cause email alerts to be permanently dropped without background job retry.

76. **MEDIUM: Hardcoded Email Sender Domain (`notifications@rsbridge.com`)**
    * *File*: [`src/lib/notifications.ts#L25`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L25)
    * *Root Cause*: Development and staging environments trigger SPF/DKIM verification failures.

77. **MEDIUM: Missing WhatsApp Message Character Length Truncation Guards**
    * *File*: [`src/lib/notifications.ts#L65`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L65)
    * *Root Cause*: Payloads exceeding Meta's 4096-character limit trigger HTTP 400 rejection errors.

78. **LOW: Unhandled Email Unsubscribe Route Handler**
    * *File*: [`src/lib/notifications.ts#L35`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L35)
    * *Root Cause*: Unsubscribe links in email footers direct candidates to an unhandled 404 route.

79. **LOW: Missing Browser Web Push Audio / Haptic Notification Triggers**
    * *File*: [`src/components/Navbar.tsx`](file:///e:/Projects/rs_consultancy/src/components/Navbar.tsx)
    * *Root Cause*: In-app notification badge updates silently without Web Push Audio API triggers.

80. **LOW: Plaintext WhatsApp Message Bullet Formatting**
    * *File*: [`src/lib/notifications.ts#L68`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L68)
    * *Root Cause*: WhatsApp payloads omit WhatsApp markdown formatting (`*bold*`, `_italic_`).

81. **LOW: Missing Candidate Opt-In Consent Verification**
    * *File*: [`src/lib/notifications.ts#L50`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L50)
    * *Root Cause*: Dispatches WhatsApp alerts without checking if candidate opted out of messaging.

82. **LOW: Absence of SMS Fallback Dispatch Engine**
    * *File*: [`src/lib/notifications.ts`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts)
    * *Root Cause*: If WhatsApp dispatch fails, system lacks fallback SMS gateway integration (e.g. Twilio / DLTRoute).

---

## [Section G] Database Performance, Indexing & High-Availability Serverless Tuning

83. **CRITICAL: Full Table Scan on Case-Insensitive Skill Name Lookups**
    * *File*: [`prisma/schema.prisma#L110-L119`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L110-L119)
    * *Root Cause*: `Skill.name` lookups using `LOWER(name)` execute full table scans without a PostgreSQL `citext` column type or functional index.

84. **HIGH: Missing Composite Index on `candidates(preferred_category, experience_level)`**
    * *File*: [`prisma/schema.prisma#L121-L156`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L121-L156)
    * *Root Cause*: Sourcing pool queries filtering by candidate category and experience level scan the whole database.

85. **HIGH: Missing Connection Pool Limit Configuration on Neon Serverless Postgres**
    * *File*: [`src/lib/db.ts#L1-L15`](file:///e:/Projects/rs_consultancy/src/lib/db.ts#L1-L15)
    * *Root Cause*: Database connection string lacks `connection_limit=10` parameter, risking connection exhaustion under serverless cold starts.

86. **MEDIUM: Unbounded Application History Sub-Query Payload Bloat**
    * *File*: [`src/app/api/employee/candidates/route.ts#L50-L80`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L50-L80)
    * *Root Cause*: Pipeline query fetches complete `history` array for every application card without `take: 5` bounds.

87. **MEDIUM: Missing Partial Index on Active Unpaid Invoices**
    * *File*: [`prisma/schema.prisma#L379-L403`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L379-L403)
    * *Root Cause*: Financial reports scanning overdue invoices search through paid and cancelled historical records.

88. **LOW: Dead Tuple Accumulation on High-Churn Tables**
    * *File*: [`prisma/schema.prisma#L444-L457`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L444-L457)
    * *Root Cause*: `verification_otps` and `in_app_notifications` accumulate dead tuple bloat without automated vacuum cleanup.

89. **LOW: Sequential Sub-Query Execution on Requirements Dashboard**
    * *File*: [`src/app/api/requirements/route.ts#L33-L47`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L33-L47)
    * *Root Cause*: Counts application totals using separate sub-queries per card instead of a single aggregated `groupBy`.

90. **LOW: Missing Index on `company_contacts(company_branch_id, is_approved)`**
    * *File*: [`prisma/schema.prisma#L246-L262`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L246-L262)
    * *Root Cause*: Admin verification approval queues execute unindexed table scans.

91. **LOW: Heavy Text Column Selection on Summary Candidate Cards**
    * *File*: [`src/app/api/employee/candidates/route.ts#L25-L35`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L25-L35)
    * *Root Cause*: Sourcing API returns heavy text columns (`policeVerificationDocUrl`, `blacklistReason`) when rendering summary cards.

92. **LOW: Missing Foreign Key Cascade Rules on Branch Soft-Deletes**
    * *File*: [`prisma/schema.prisma#L276-L305`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L276-L305)
    * *Root Cause*: Deleting a company branch leaves orphaned `job_requirements` records.

---

## [Section H] Frontend Design System Tokens, Micro-Animations & Accessibility

93. **HIGH: Missing Modal Focus Trap and ESC Key Listeners on Screening Dialogs**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L700-L750`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L700-L750)
    * *Root Cause*: Modal dialogs allow keyboard Tab focus to escape into background DOM elements.

94. **HIGH: Hardcoded Color Hex Strings Violating Theme Design Tokens**
    * *File*: [`src/app/globals.css`](file:///e:/Projects/rs_consultancy/src/app/globals.css) & [`src/app/employee/candidates/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx)
    * *Root Cause*: Inline styles use raw hex strings (`#0F172A`, `#2563EB`) instead of CSS custom properties (`var(--primary)`).

95. **MEDIUM: Unsaved Form State Warning Omitted on Mandate Creation**
    * *File*: [`src/app/company/requirements/new/page.tsx#L125-L200`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/new/page.tsx#L125-L200)
    * *Root Cause*: Accidental navigation discards typed job specifications without confirmation alerts (`beforeunload`).

96. **MEDIUM: Raw Unformatted Salary Numerals in Public Job Cards**
    * *File*: [`src/components/JobList.tsx#L320-L325`](file:///e:/Projects/rs_consultancy/src/components/JobList.tsx#L320-L325)
    * *Root Cause*: Renders max salary as raw integer without locale formatting (`₹18.0 Lakhs / Year`).

97. **LOW: Missing Screen Reader ARIA Attributes on Status Badges**
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
