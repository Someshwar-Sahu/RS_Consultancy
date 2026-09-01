# RS Bridge Consultancy — Deep Senior Engineering Codebase Audit (Pass 2)
**Exhaustive Analysis of 100 Advanced Concurrency, Security, Data Isolation, ATS Pipeline, and Commercial Compliance Defects**

---

## Index of Finding Categories
1. **[Section A] Concurrency, Race Conditions & Transaction Integrity** (Findings 1 – 15)
2. **[Section B] Data Privacy, Public Storage Leaks & RBAC Boundaries** (Findings 16 – 28)
3. **[Section C] Custom PDF Generation, Canvas Overflow & File Processing** (Findings 29 – 42)
4. **[Section D] Staffing Agency Business Logic & Commercial Governance** (Findings 43 – 58)
5. **[Section E] ATS Workflow Synchronization & Pipeline Friction** (Findings 59 – 72)
6. **[Section F] WhatsApp, SMS & Email Communication Layer Flaws** (Findings 73 – 82)
7. **[Section G] Database Performance, Indexing & Query Bottlenecks** (Findings 83 – 92)
8. **[Section H] Frontend Architecture, Debounce & Accessibility (a11y)** (Findings 93 – 100)

---

## [Section A] Concurrency, Race Conditions & Transaction Integrity

1. **CRITICAL: Parallel Round-Robin Allocation Collapses into Single Recruiter**
   * *File*: [`src/lib/assignment.ts#L30-L45`](file:///e:/Projects/rs_consultancy/src/lib/assignment.ts#L30-L45)
   * *Root Cause*: `assignApplicationRoundRobin()` executes an asynchronous read of active applicant counts (`db.application.count`) without a mutex or atomic database sequence.
   * *Impact*: When 15 candidates apply simultaneously during peak traffic, all concurrent read operations evaluate the lowest count on the exact same recruiter, assigning all 15 candidates to one person.

2. **CRITICAL: Desynchronization of `JobRequirement.vacanciesFilled` on Placement**
   * *File*: [`src/app/api/admin/placements/route.ts#L45-L65`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L45-L65)
   * *Root Cause*: When a placement is finalized (`status: Joined`), the transaction creates a `Placement` and `Invoice`, but fails to execute an atomic `increment` on `JobRequirement.vacanciesFilled`.
   * *Impact*: Mandates never show accurate filled counts and never auto-close when all open positions are filled.

3. **CRITICAL: Orphaned Replacement Count on Placement Deactivation**
   * *File*: [`src/app/api/admin/placements/resignation/route.ts#L45-L70`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L45-L70)
   * *Root Cause*: Verifying candidate exit marks the original placement as inactive, but does not decrement `vacanciesFilled` on the parent mandate, causing historical discrepancy.

4. **HIGH: Race Condition on Simultaneous Candidate Registration via Same Phone**
   * *File*: [`src/app/api/candidates/register/route.ts#L98-L135`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/register/route.ts#L98-L135)
   * *Root Cause*: Non-transactional check-then-insert pattern between phone lookup and candidate creation. Parallel requests trigger raw PostgreSQL P2002 unique constraint crashes.

5. **HIGH: Non-Atomic Multiple Resume Default Flag Updates**
   * *File*: [`src/app/api/candidates/resumes/route.ts#L90-L105`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/resumes/route.ts#L90-L105)
   * *Root Cause*: Unsetting previous defaults (`updateMany`) and inserting new resume (`create`) are not wrapped in a `db.$transaction`, leading to inconsistent default pointers if network drops midway.

6. **HIGH: Unchecked Concurrent Status Advancement (Recruiter vs Employer)**
   * *File*: [`src/app/api/applications/route.ts#L290-L305`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L290-L305)
   * *Root Cause*: Lacks optimistic locking (`version` field). If a recruiter rejects a candidate while the employer simultaneously clicks "Schedule Interview", the last write silently overwrites without notification.

7. **MEDIUM: Duplicate Invoice Number Collision Risk Under High Volume**
   * *File*: [`src/app/api/admin/placements/route.ts#L74`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L74)
   * *Root Cause*: Generates invoice numbers using `Date.now().toString().slice(-6)`. Placements processed within the same millisecond generate identical numbers, failing unique constraints.

8. **MEDIUM: Race Condition on OTP Generation and Verification**
   * *File*: [`src/lib/otp.ts#L15-L40`](file:///e:/Projects/rs_consultancy/src/lib/otp.ts#L15-L40)
   * *Root Cause*: Multiple rapid clicks on "Send Code" create multiple unexpired OTP rows for the same email without invalidating previous tokens.

9. **MEDIUM: Unbounded Concurrent File Disk Writes**
   * *File*: [`src/lib/storage.ts#L10-L35`](file:///e:/Projects/rs_consultancy/src/lib/storage.ts#L10-L35)
   * *Root Cause*: `fs.writeFile` writes directly to local disk without a stream buffer queue, risking file descriptor exhaustion during bulk candidate imports.

10. **MEDIUM: Transaction Rollback Inconsistency in Free Replacement Spawning**
    * *File*: [`src/app/api/placements/[id]/resignation/verify/route.ts#L50-L70`](file:///e:/Projects/rs_consultancy/src/app/api/placements/%5Bid%5D/resignation/verify/route.ts#L50-L70)
    * *Root Cause*: If creating the replacement job requirement fails, error logging catches the exception but does not return structured rollback diagnostics to caller.

11. **LOW: Lack of Lock Timeout on PostgreSQL Transactions**
    * *File*: [`src/lib/db.ts`](file:///e:/Projects/rs_consultancy/src/lib/db.ts)
    * *Root Cause*: Prisma client uses default unbounded transaction timeout (5000ms), which can cause lock contention under heavy connection loads.

12. **LOW: Missing Idempotency Key on Application Submission**
    * *File*: [`src/app/api/applications/route.ts#L140-L170`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L140-L170)
    * *Root Cause*: Rapid double-clicks on "Apply Now" trigger parallel database queries before unique constraints resolve.

13. **LOW: Simultaneous Skill Normalization Duplication**
    * *File*: [`src/app/api/skills/route.ts#L15-L30`](file:///e:/Projects/rs_consultancy/src/app/api/skills/route.ts#L15-L30)
    * *Root Cause*: Two candidates simultaneously adding "FastAPI" and "fastapi" can bypass case-insensitive checks if written concurrently.

14. **LOW: Non-Atomic In-App Notification Dispatch**
    * *File*: [`src/lib/notifications.ts#L25-L60`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L25-L60)
    * *Root Cause*: Notifications are created outside the main application status transition transaction; if database write succeeds but notification service fails, records desynchronize.

15. **LOW: Race Condition in Digital Terms Version Registration**
    * *File*: [`src/app/api/companies/terms/route.ts#L85-L105`](file:///e:/Projects/rs_consultancy/src/app/api/companies/terms/route.ts#L85-L105)
    * *Root Cause*: Multiple branch administrators clicking "Accept Terms" concurrently create redundant snapshot rows.

---

## [Section B] Data Privacy, Public Storage Leaks & RBAC Boundaries

16. **CRITICAL: Public File System Exposure of Unmasked Resumes**
    * *File*: [`src/lib/storage.ts#L4`](file:///e:/Projects/rs_consultancy/src/lib/storage.ts#L4) & [`public/uploads/resumes/`](file:///e:/Projects/rs_consultancy/public/uploads/resumes/)
    * *Root Cause*: Files are written directly into Next.js `public/` directory. Next.js serves all files in `public/` statically without routing through authentication middleware.
    * *Impact*: Any unauthenticated user who guesses or scrapes the timestamp URL (`/uploads/resumes/178807...pdf`) can download private candidate resumes containing unmasked personal phone numbers and home addresses.

17. **CRITICAL: Typo in Company Masking String Leaking Incomplete Brand Label**
    * *File*: [`src/lib/permissions.ts#L46`](file:///e:/Projects/rs_consultancy/src/lib/permissions.ts#L46)
    * *Root Cause*: `brandName: "[Confidential Clien]"` contains an uncorrected typo (missing 't').
    * *Impact*: Shows unprofessional placeholder across client candidate portals.

18. **HIGH: Public Unauthenticated Visitors See Unmasked Client Names on `/jobs`**
    * *File*: [`src/lib/permissions.ts#L42-L49`](file:///e:/Projects/rs_consultancy/src/lib/permissions.ts#L42-L49)
    * *Root Cause*: `maskCompanyForViewer()` checks `if (viewer.role === "CANDIDATE")`. For guest visitors where `viewer.role` is `undefined`, client names are left unmasked.
    * *Impact*: Competitors and candidates can bypass the consultancy and apply to client companies directly.

19. **HIGH: JWT Token Validity Maintained After User Deactivation (`isActive: false`)**
    * *File*: [`src/lib/auth.ts#L40-L57`](file:///e:/Projects/rs_consultancy/src/lib/auth.ts#L40-L57)
    * *Root Cause*: JWT callback only embeds user data at sign-in time. If an Admin terminates a rogue employee, their JWT remains fully valid until cookie expiration.

20. **HIGH: Direct In-Memory Inspection of Candidate ID in URL Parameters**
    * *File*: [`src/app/api/candidates/[id]/resume/route.ts#L30-L50`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/%5Bid%5D/resume/route.ts#L30-L50)
    * *Root Cause*: API accepts candidate UUID in route parameter without verifying if the requesting company contact has an active mandate application for that candidate.

21. **MEDIUM: Unfiltered Salary History Exposure to Other Recruiters**
    * *File*: [`src/app/api/employee/candidates/route.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L20-L40)
    * *Root Cause*: `currentSalary` and `expectedSalary` are returned in plaintext to all recruiters without permission scoping.

22. **MEDIUM: Leftover Node Internals Import in Permissions Utility**
    * *File*: [`src/lib/permissions.ts#L2`](file:///e:/Projects/rs_consultancy/src/lib/permissions.ts#L2)
    * *Root Cause*: `import { cachedDataVersionTag } from "v8";` is an unreferenced dependency that bloats bundle compilation.

23. **MEDIUM: Candidate Police Verification Documents Publicly Accessible**
    * *File*: [`prisma/schema.prisma#L140`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L140)
    * *Root Cause*: `policeVerificationDocUrl` references static storage without expiring signed access tokens.

24. **LOW: Missing Referrer Policy Headers on Outbound Video Links**
    * *File*: [`src/app/candidate/applications/page.tsx#L350-L380`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L350-L380)
    * *Root Cause*: Google Meet / Zoom links lack `rel="noreferrer noopener"` in several sub-components, leaking token parameters.

25. **LOW: Candidate Email Address Searchable by Partial Substrings**
    * *File*: [`src/app/api/candidates/route.ts#L32-L37`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/route.ts#L32-L37)
    * *Root Cause*: Case-insensitive `contains` lookup on emails allows malicious brute-force enumeration of registered candidates.

26. **LOW: Missing IP Geolocation Anomaly Detection on Admin Actions**
    * *File*: [`src/app/api/admin/settings/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/settings/route.ts)
    * *Root Cause*: Sensitive financial settings changes do not record admin IP geolocation or browser signatures.

27. **LOW: Company Contact Phone Numbers Visible to Candidates**
    * *File*: [`src/app/api/applications/route.ts#L225-L235`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L225-L235)
    * *Root Cause*: Requirement relation join includes `branch.contacts`, which can expose personal HR mobile numbers in JSON payloads.

28. **LOW: Unrestricted File Upload Size Limit Missing in Route Handlers**
    * *File*: [`src/app/api/candidates/resumes/route.ts#L75-L85`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/resumes/route.ts#L75-L85)
    * *Root Cause*: Does not check `file.size <= 10 * 1024 * 1024` (10MB limit), permitting large files that could cause Node memory exhaustion.

---

## [Section C] Custom PDF Generation, Canvas Overflow & File Processing

29. **CRITICAL: Single-Page Canvas Overflow in Custom Executive PDF Engine**
    * *File*: [`src/lib/pdf.ts#L250-L440`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L250-L440)
    * *Root Cause*: The PDF generator uses a single static page (`PAGE_HEIGHT = 841.89`) and decrements `curY`.
    * *Impact*: When an executive candidate has 4 projects, 3 degrees, and 15 skills, `curY` drops below `0` and **content is drawn outside the PDF boundary into negative space**, rendering the bottom half of the resume invisible.

30. **CRITICAL: Server Crash on Non-PDF File Buffer (DOCX / TXT / Images)**
    * *File*: [`src/lib/resumeParser.ts#L25-L45`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L25-L45)
    * *Root Cause*: `extractText()` from `unpdf` assumes valid PDF byte headers. If a candidate uploads `.docx` or `.png`, it throws an unhandled exception that causes an API 500 error.

31. **HIGH: Silent Failure on Encrypted or Password-Protected PDFs**
    * *File*: [`src/lib/resumeParser.ts#L30-L50`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L30-L50)
    * *Root Cause*: Lacks encryption detection (`PDFDocument.isEncrypted`), falling back to an empty profile without alerting the user.

32. **HIGH: Multi-Column Resume Text Interleaving Corruption**
    * *File*: [`src/lib/resumeParser.ts#L75-L110`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L75-L110)
    * *Root Cause*: Linear stream extraction merges two-column resumes across horizontal scanlines, merging phone numbers into education degree titles.

33. **MEDIUM: Character Encoding Corruption on Smart Punctuation in PDF**
    * *File*: [`src/lib/pdf.ts#L70-L80`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L70-L80)
    * *Root Cause*: Standard Type 1 PostScript fonts in PDF (Helvetica/Times) only support WinAnsiEncoding. Unicode emojis or non-ASCII characters break string width measurements.

34. **MEDIUM: Clickable Hyperlink Annotations Misaligned on Multi-Line Wrapping**
    * *File*: [`src/lib/pdf.ts#L305-L315`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L305-L315)
    * *Root Cause*: `linkAnnotations` calculates bounding box assuming a single text line; wrapped project URLs create clickable hitboxes over unrelated body text.

35. **MEDIUM: Lack of PDF Compression & In-Memory Stream Leaks**
    * *File*: [`src/lib/pdf.ts#L440-L460`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L440-L460)
    * *Root Cause*: Generated PDFs do not compress internal content streams (`/FlateDecode`), producing files 5x larger than necessary.

36. **LOW: Hardcoded A4 Aspect Ratio Failing on US Letter Formats**
    * *File*: [`src/lib/pdf.ts#L125`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L125)
    * *Root Cause*: Fixed at 595.28 x 841.89 points, causing clipping when printed on North American US Letter (8.5 x 11 in) paper.

37. **LOW: Missing PDF Metadata (Title, Author, Subject, Keywords)**
    * *File*: [`src/lib/pdf.ts#L450`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L450)
    * *Root Cause*: Generated PDF lacks `/Info` dictionary containing agency copyright and candidate reference tags.

38. **LOW: Hardcoded Margins Causing Overflow on Ultra-Long Institution Names**
    * *File*: [`src/lib/pdf.ts#L280-L290`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L280-L290)
    * *Root Cause*: Long university titles (e.g. "Dr. A.P.J. Abdul Kalam Technical University, Lucknow") overwrite right-aligned graduation dates.

39. **LOW: Zero-Liability Disclaimer Truncated on Long Driver Profiles**
    * *File*: [`src/lib/pdf.ts#L267-L274`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L267-L274)
    * *Root Cause*: Legal disclaimer box is positioned at a fixed offset that clips into the footer when driver vehicle lists exceed 4 items.

40. **LOW: Missing Agency Header Watermark in Background**
    * *File*: [`src/lib/pdf.ts#L180-L220`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L180-L220)
    * *Root Cause*: Does not render subtle diagonal security watermark ("RS BRIDGE VERIFIED PROFILE") to prevent unauthorized client redistribution.

41. **LOW: Project Tech Stack String Wrapping Split Mid-Word**
    * *File*: [`src/lib/pdf.ts#L306`](file:///e:/Projects/rs_consultancy/src/lib/pdf.ts#L306)
    * *Root Cause*: `drawTextRight()` truncates tech stack tags without soft hyphenation.

42. **LOW: Date Parsing Fallback Returns "Present" for Historical Roles**
    * *File*: [`src/lib/resumeParser.ts#L140-L155`](file:///e:/Projects/rs_consultancy/src/lib/resumeParser.ts#L140-L155)
    * *Root Cause*: If end date is missing in text, parser defaults to current date, overestimating candidate total experience years.

---

## [Section D] Staffing Agency Business Logic & Commercial Governance

43. **CRITICAL: Missing Candidate Representation Ownership Window (6-12 Months)**
    * *File*: [`prisma/schema.prisma`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma) & [`src/app/api/applications/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts)
    * *Root Cause*: In recruitment staffing, when an agency submits a candidate to a client, the agency owns representation rights for 180–365 days. If a client rejects the candidate for Job A but hires them for Job B 4 months later, the agency is legally entitled to a commission.
    * *Impact*: System has no tracking for candidate ownership expiration, allowing clients to bypass agency fees legally.

44. **CRITICAL: Lack of Overdue Invoice Enforcement on Client Mandate Creation**
    * *File*: [`src/app/api/requirements/route.ts#L50-L80`](file:///e:/Projects/rs_consultancy/src/app/api/requirements/route.ts#L50-L80)
    * *Root Cause*: A client company with ₹5,00,000 in overdue unpaid invoices can continue posting new job mandates and scheduling interviews without credit hold restrictions.

45. **HIGH: Absence of Split Placement Commission Tracking (Sourcing vs Account Management)**
    * *File*: [`src/app/api/admin/placements/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts)
    * *Root Cause*: When Recruiter A sources the candidate and Recruiter B manages the Client Account, standard agency practice splits commissions (e.g. 50/50). Current schema only stores a single `assignedUserId`.

46. **HIGH: Missing Notice Period Buyout & Sign-On Bonus Invoicing Calculation**
    * *File*: [`src/app/api/admin/placements/route.ts#L40-L43`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40-L43)
    * *Root Cause*: Commission is calculated strictly as `agreedCtc * rate / 100`. In executive search, sign-on bonuses and notice buyout compensations are either included or excluded based on contract terms.

47. **HIGH: 60-Day Replacement Guarantee Clock Does Not Auto-Expire**
    * *File*: [`src/app/api/admin/placements/resignation/route.ts#L20-L45`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L20-L45)
    * *Root Cause*: No automated cron job checks if `joiningDate + replacementWindowDays < currentDate` to permanently lock `replacementStatus: None`.

48. **MEDIUM: Multi-Currency Conflict (INR vs AED vs USD)**
    * *File*: [`src/app/api/admin/financials/route.ts#L45-L60`](file:///e:/Projects/rs_consultancy/src/app/api/admin/financials/route.ts#L45-L60)
    * *Root Cause*: Sums all financial amounts as raw numbers assuming INR (₹), corrupting totals if Dubai branch bills in AED.

49. **MEDIUM: Missing Partial Invoice Payment & TDS (Tax Deducted at Source) Handling**
    * *File*: [`prisma/schema.prisma#L376-L400`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L376-L400)
    * *Root Cause*: Indian corporate clients deduct 10% TDS (Section 194J) before paying recruitment invoices. The schema has no field for `tdsDeducted` or `netReceivedAmount`.

50. **MEDIUM: No Verification of Candidate Resignation Date vs Joining Date**
    * *File*: [`src/app/api/admin/placements/resignation/route.ts#L45-L60`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts#L45-L60)
    * *Root Cause*: Accepts resignation proofs where resignation date is before the actual candidate joining date.

51. **MEDIUM: Missing Retained Search Milestone Billing Stages**
    * *File*: [`prisma/schema.prisma#L376`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L376)
    * *Root Cause*: System only supports Contingency billing on joining; Retained search mandates (1/3 on mandate signing, 1/3 on shortlist presentation, 1/3 on joining) cannot be scheduled.

52. **LOW: Contractual Interest Calculation on Overdue Invoices (18% p.a.)**
    * *File*: [`src/app/api/invoices/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/invoices/route.ts)
    * *Root Cause*: Terms of Business specify overdue interest after 30 days, but system does not compute late penalty fees.

53. **LOW: Candidate Blacklist Enforcement Missing on Application Submission**
    * *File*: [`src/app/api/applications/route.ts#L50-L75`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L50-L75)
    * *Root Cause*: If a candidate is flagged `isBlacklisted: true`, they can still submit applications to open mandates.

54. **LOW: Missing Recruiter Monthly Quota & Performance Target Model**
    * *File*: [`prisma/schema.prisma`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma)
    * *Root Cause*: Admins have no database fields to assign monthly placement targets (e.g. ₹5,00,000 billed revenue/month) to recruiters.

55. **LOW: Missing Client Company Hierarchy (Parent Enterprise vs Child Branches)**
    * *File*: [`prisma/schema.prisma#L211-L244`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L211-L244)
    * *Root Cause*: Master agreements signed at conglomerate parent level do not automatically cascade consent down to newly created regional city branches.

56. **LOW: Driver Zero-Liability Indemnity Document Not Stored on Application**
    * *File*: [`src/app/api/applications/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts)
    * *Root Cause*: The driver disclaimer is displayed on the PDF, but no signed digital acknowledgement timestamp is recorded on the application record.

57. **LOW: Minimum Placement Fee Floor Not Enforced**
    * *File*: [`src/app/api/admin/placements/route.ts#L40-L45`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/route.ts#L40-L45)
    * *Root Cause*: If candidate CTC is entered as ₹1,00,000, commission calculates to ₹8,330, violating standard agency minimum placement floor (e.g. ₹25,000 minimum).

58. **LOW: Lack of Automated Credit Note Generation on Placement Reversal**
    * *File*: [`src/app/api/admin/placements/resignation/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/admin/placements/resignation/route.ts)
    * *Root Cause*: Deactivating a placement where an invoice was already issued does not generate an official GST Credit Note (`CDN`).

---

## [Section E] ATS Workflow Synchronization & Pipeline Friction

59. **CRITICAL: Candidate Application Status History History Missing Changed User Name**
    * *File*: [`src/app/api/applications/route.ts#L295-L304`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L295-L304)
    * *Root Cause*: `ApplicationStatusHistory` only records `changedByUserId`. When rendering candidate timelines, it cannot display the human recruiter's name without separate user joins.

60. **HIGH: Employer Offer Letter Document Attachment Missing**
    * *File*: [`src/app/api/applications/route.ts#L217-L220`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L217-L220)
    * *Root Cause*: When extending an offer, employers can only input an offered CTC number; they cannot upload the formal PDF Offer Letter.

61. **HIGH: Candidate Offer Acceptance Lacks Document Signature / Counter-Offer Form**
    * *File*: [`src/app/candidate/applications/page.tsx#L70-L90`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L70-L90)
    * *Root Cause*: Clicking "Accept Offer" merely sets status without collecting signed acceptance or capturing counter-offer compensation requests.

62. **HIGH: Candidate Cannot Request Interview Reschedule with Alternative Time Slots**
    * *File*: [`src/app/candidate/applications/page.tsx#L90-L120`](file:///e:/Projects/rs_consultancy/src/app/candidate/applications/page.tsx#L90-L120)
    * *Root Cause*: Declining an interview simply withdraws the application rather than offering 3 selectable alternative time slots to the recruiter.

63. **MEDIUM: Application Stage Transition Rollback Missing**
    * *File*: [`src/app/api/applications/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts)
    * *Root Cause*: If an employer mistakenly marks a candidate as "Rejected", there is no "Undo / Reopen to Shortlisted" action without manual database editing.

64. **MEDIUM: In-Person Interview Venue Does Not Extract Map Coordinates / Google Maps Link**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L765-L780`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L765-L780)
    * *Root Cause*: Text address is sent without generating a clickable Google Maps navigation URL for driver/field candidates.

65. **MEDIUM: Lack of Duplicate Candidate Merge Utility**
    * *File*: [`src/app/api/employee/candidates/route.ts`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts)
    * *Root Cause*: If a candidate created two accounts (one with personal email, one with work email), recruiters have no merge tool to consolidate history.

66. **LOW: Application History Notes Text Truncated in Table Views**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L560-L570`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L560-L570)
    * *Root Cause*: Long screening notes lack an expandable "Read More" drawer.

67. **LOW: Missing Bulk CSV Candidate Import for Enterprise Fleet Drivers**
    * *File*: [`src/app/employee/candidates/new/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/new/page.tsx)
    * *Root Cause*: Recruiters provisioning 100 logistics drivers from fleet partner depots must enter them one by one through the UI form.

68. **LOW: Inability to Tag Candidate Source (LinkedIn, Naukri, Field Scout, Referral)**
    * *File*: [`prisma/schema.prisma#L144`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L144)
    * *Root Cause*: Candidate source defaults to `"PUBLIC"`, lacking attribution for agency referral bonuses.

69. **LOW: Missing Interviewer Name Auto-Complete from Branch Contacts**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L780-L795`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L780-L795)
    * *Root Cause*: Employers must retype interviewer names on every scheduled round instead of picking from registered branch HR contacts.

70. **LOW: Candidate Experience Level Inconsistency (Fresher vs 0 Years Experience)**
    * *File*: [`src/components/JobList.tsx#L120-L140`](file:///e:/Projects/rs_consultancy/src/components/JobList.tsx#L120-L140)
    * *Root Cause*: Filter displays "Fresher" while card displays "0.0 Yrs", causing filter mismatch.

71. **LOW: Recruiter Cannot Pin Priority Candidates to Top of Queue**
    * *File*: [`src/app/employee/candidates/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx)
    * *Root Cause*: Application queue sorts strictly by `createdAt: "desc"` without priority star pinning.

72. **LOW: Missing Custom Candidate Rejection Reasons Taxonomy**
    * *File*: [`src/app/api/applications/route.ts#L325`](file:///e:/Projects/rs_consultancy/src/app/api/applications/route.ts#L325)
    * *Root Cause*: Lacks standardized rejection codes (`TECH_SKILL_GAP`, `SALARY_MISMATCH`, `NOTICE_TOO_LONG`, `LOCATION_UNWILLING`).

---

## [Section F] WhatsApp, SMS & Email Communication Layer Flaws

73. **CRITICAL: WhatsApp Mobile Number Formatting Rejection by Meta Graph API**
    * *File*: [`src/lib/notifications.ts#L62`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L62)
    * *Root Cause*: Passes `payload.recipientMobile` directly without stripping spaces or plus signs (`.replace(/\D/g, "")`).
    * *Impact*: Numbers stored as `+91 9876543210` cause HTTP 400 parameter errors on Meta Cloud WhatsApp API, failing to deliver interview alerts.

74. **HIGH: Missing Email Retry Queue & Dead Letter Logging**
    * *File*: [`src/lib/notifications.ts#L23-L39`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L23-L39)
    * *Root Cause*: If Resend API rate limits or network times out, the notification is permanently dropped without a retry queue.

75. **HIGH: Plaintext Email Rendering (Missing Branded HTML Templates)**
    * *File*: [`src/lib/notifications.ts#L28`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L28)
    * *Root Cause*: Sends raw unformatted `text: payload.bodyText` instead of responsive agency-branded HTML emails with logo and calendar CTA buttons.

76. **MEDIUM: Missing Automated 2-Hour Interview Reminder Dispatch**
    * *File*: [`src/lib/notifications.ts`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts)
    * *Root Cause*: No scheduled worker checks for upcoming interviews today to send SMS/WhatsApp arrival reminders to candidates.

77. **MEDIUM: Hardcoded Sender Email Domain (`notifications@rsbridge.com`)**
    * *File*: [`src/lib/notifications.ts#L25`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L25)
    * *Root Cause*: Fails SPF/DKIM verification if deployment environment has not configured custom DNS records for `rsbridge.com`.

78. **LOW: WhatsApp Message Character Limit Truncation**
    * *File*: [`src/lib/notifications.ts#L64`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L64)
    * *Root Cause*: Does not validate text payload against Meta's 4096-character limit before POSTing.

79. **LOW: Missing Opt-Out Unsubscribe Link in Candidate Emails**
    * *File*: [`src/lib/notifications.ts`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts)
    * *Root Cause*: Marketing/Transactional emails lack standard CAN-SPAM / GDPR unsubscribe footers.

80. **LOW: In-App Notification Badge Missing Audio / Haptic Feedback**
    * *File*: [`src/components/Navbar.tsx`](file:///e:/Projects/rs_consultancy/src/components/Navbar.tsx)
    * *Root Cause*: New interview invites update state silently without browser notification API triggers.

81. **LOW: Lack of WhatsApp Delivery & Read Receipts Tracking**
    * *File*: [`prisma/schema.prisma#L424-L437`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L424-L437)
    * *Root Cause*: `InAppNotification` model has no fields for `whatsappMessageId` or `deliveryStatus` (Sent/Delivered/Read).

82. **LOW: Missing Dynamic Email Subject Variable Interpolation**
    * *File*: [`src/lib/notifications.ts#L27`](file:///e:/Projects/rs_consultancy/src/lib/notifications.ts#L27)
    * *Root Cause*: Subject lines lack token placeholders (e.g. `[Mandate: Senior Fullstack Engineer]`).

---

## [Section G] Database Performance, Indexing & Query Bottlenecks

83. **CRITICAL: Full Table Scan on Sourcing Pool Candidate Queries (N+1 Query Explosion)**
    * *File*: [`src/app/api/employee/candidates/route.ts#L20-L40`](file:///e:/Projects/rs_consultancy/src/app/api/employee/candidates/route.ts#L20-L40)
    * *Root Cause*: `db.candidate.findMany` includes `skills`, `resumes`, `education`, `experiences`, and `applications.requirement.branch.company` on every page load with zero pagination limit.
    * *Impact*: When talent database reaches 5,000 candidates, this single request loads over 20MB of JSON, exhausting Node.js heap memory.

84. **HIGH: Missing Composite Index on `applications(assigned_user_id, status)`**
    * *File*: [`prisma/schema.prisma#L318-L338`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L318-L338)
    * *Root Cause*: Recruiter queue queries filter by `assignedUserId` and `status` without index coverage, resulting in sequential scans.

85. **HIGH: Missing Index on `job_requirements(company_branch_id, status)`**
    * *File*: [`prisma/schema.prisma#L276-L305`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L276-L305)
    * *Root Cause*: Slow mandate queries on company dashboard under enterprise multi-branch setups.

86. **MEDIUM: Unbounded `findMany` on Public Jobs Page**
    * *File*: [`src/app/(public)/jobs/page.tsx#L18-L25`](file:///e:/Projects/rs_consultancy/src/app/%28public%29/jobs/page.tsx#L18-L25)
    * *Root Cause*: Fetches all open job requirements in a single query without `take: 20` pagination.

87. **MEDIUM: Missing Index on `in_app_notifications(user_id, is_read)`**
    * *File*: [`prisma/schema.prisma#L424-L437`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L424-L437)
    * *Root Cause*: Unread badge counting runs sequential table scans on the notifications table.

88. **MEDIUM: Unindexed Skill Name Case-Insensitive Search**
    * *File*: [`prisma/schema.prisma#L110-L119`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L110-L119)
    * *Root Cause*: `Skill.name` lacks a `citext` column type or `LOWER(name)` functional index in PostgreSQL.

89. **LOW: Database Connection Pool Starvation on Serverless Cold Starts**
    * *File*: [`src/lib/db.ts`](file:///e:/Projects/rs_consultancy/src/lib/db.ts)
    * *Root Cause*: Lacks explicit `connection_limit=10` query parameter configuration for Neon / serverless PostgreSQL.

90. **LOW: Missing Index on `invoices(status, due_date)`**
    * *File*: [`prisma/schema.prisma#L376-L400`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma#L376-L400)
    * *Root Cause*: Overdue payment collection queries run full table scans.

91. **LOW: Redundant Column Joins on Candidate Resume Fetch**
    * *File*: [`src/app/api/candidates/resumes/route.ts#L52-L56`](file:///e:/Projects/rs_consultancy/src/app/api/candidates/resumes/route.ts#L52-L56)
    * *Root Cause*: Selects all columns rather than projecting only `{ id, label, fileUrl, isDefault }`.

92. **LOW: Missing Automated Database Vacuum & Analytics Maintenance**
    * *File*: [`prisma/schema.prisma`](file:///e:/Projects/rs_consultancy/prisma/schema.prisma)
    * *Root Cause*: High-churn tables (`verification_otps`, `in_app_notifications`) accumulate dead tuple bloat without auto-cleanup.

---

## [Section H] Frontend Architecture, Debounce & Accessibility (a11y)

93. **HIGH: Keystroke-by-Keystroke State Re-Render Lag in Sourcing Search**
    * *File*: [`src/app/employee/candidates/page.tsx#L550-L580`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L550-L580)
    * *Root Cause*: `onChange={(e) => setQueueSearch(e.target.value)}` updates React component state on every single keypress, filtering 500 candidate cards synchronously on the main UI thread.

94. **HIGH: Lack of Modal Focus Trap and ESC Key Handler**
    * *File*: [`src/app/company/requirements/[id]/page.tsx#L707-L830`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/%5Bid%5D/page.tsx#L707-L830)
    * *Root Cause*: Modal dialogs do not listen for `Escape` key events and allow keyboard Tab focus to escape into background DOM elements.

95. **MEDIUM: Missing Form Dirty State Confirmation (`beforeunload`)**
    * *File*: [`src/app/company/requirements/new/page.tsx#L125-L280`](file:///e:/Projects/rs_consultancy/src/app/company/requirements/new/page.tsx#L125-L280)
    * *Root Cause*: If an employer writes a comprehensive job specification and accidentally clicks a navigation link, all form input is permanently lost without warning.

96. **MEDIUM: Hardcoded Dark Slate / Hex Colors Violating Centralized Theme Tokens**
    * *File*: [`src/app/globals.css`](file:///e:/Projects/rs_consultancy/src/app/globals.css) & [`src/app/employee/candidates/page.tsx`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx)
    * *Root Cause*: Inline styles use raw hex strings (`#0F172A`, `#2563EB`, `#059669`) instead of CSS custom properties (`var(--primary)`, `var(--surface)`).

97. **MEDIUM: Unformatted Large Numbers in Public Job Cards**
    * *File*: [`src/components/JobList.tsx#L320-L360`](file:///e:/Projects/rs_consultancy/src/components/JobList.tsx#L320-L360)
    * *Root Cause*: Renders `maxSalaryLpa` as `18` instead of `₹18.0 Lakhs / Year`.

98. **LOW: Missing Screen Reader ARIA Attributes on Status Badges**
    * *File*: [`src/app/employee/candidates/page.tsx#L530-L550`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L530-L550)
    * *Root Cause*: Status badges use visual unicode bullets (`●`) without `aria-label="Application Status: Shortlisted"`.

99. **LOW: Mobile Viewport Layout Stacking Flaw in Sourcing Filter Bar**
    * *File*: [`src/app/employee/candidates/page.tsx#L500-L530`](file:///e:/Projects/rs_consultancy/src/app/employee/candidates/page.tsx#L500-L530)
    * *Root Cause*: Filter bar uses multi-column grid that overflows horizontally on 375px mobile screens.

100. **LOW: Missing Skeleton Loaders on Initial Page Load**
     * *File*: [`src/app/company/dashboard/page.tsx#L115-L125`](file:///e:/Projects/rs_consultancy/src/app/company/dashboard/page.tsx#L115-L125)
     * *Root Cause*: Displays generic "Loading requirements..." text causing layout shift (CLS) instead of animated skeleton cards.
