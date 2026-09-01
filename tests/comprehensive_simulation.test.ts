import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "../src/lib/db";
import * as authModule from "../src/lib/auth";
import {
  maskCandidateForViewer,
  maskCompanyForViewer,
  sanitizeFinancials,
  ViewerContext,
} from "../src/lib/permissions";
import { generateCandidateResumePdf } from "../src/lib/pdf";
import { POST as companyInquirePOST } from "../src/app/api/companies/inquire/route";
import { POST as termsPOST } from "../src/app/api/companies/terms/route";
import { PATCH as employeeCandidatesPATCH } from "../src/app/api/employee/candidates/route";
import { POST as placementPOST } from "../src/app/api/admin/placements/route";
import { POST as resignationPOST } from "../src/app/api/admin/placements/resignation/route";
import { GET as resumePDFGET } from "../src/app/api/candidates/[id]/resume/route";

describe("Comprehensive Multi-Role & Multi-Branch Simulation Test Suite", () => {
  // Test entities IDs
  let adminUserId: string;
  let employeeUserId: string;

  let companyId: string;
  let branch1Id: string; // Branch 1: Signed Terms
  let branch2Id: string; // Branch 2: Unsigned Terms
  let branch1ContactUserId: string;
  let branch1ContactId: string;
  let branch2ContactUserId: string;
  let branch2ContactId: string;

  let driverCandidateId: string;
  let driverReqId: string;
  let driverAppId: string;

  let employeeCandidateId: string;
  let employeeReqId: string;
  let employeeAppId: string;

  let placement1Id: string;

  const runSuffix = Date.now().toString().slice(-6);
  const adminEmail = `admin.super.${runSuffix}@rsbridge.com`;
  const empEmail = `recruiter.staff.${runSuffix}@rsbridge.com`;
  const noidaHrEmail = `noida.hr.${runSuffix}@apexglobal.com`;
  const blrHrEmail = `blr.hr.${runSuffix}@apexglobal.com`;
  const driverEmail = `ramesh.driver.${runSuffix}@test.com`;
  const driverMobile = `9811${runSuffix}`;
  const corpEmail = `ananya.eng.${runSuffix}@test.com`;
  const corpMobile = `9899${runSuffix}`;

  beforeAll(async () => {
    // 1. Setup Admin & Employee Users
    const adminUser = await db.user.create({
      data: { email: adminEmail, role: "ADMIN" },
    });
    adminUserId = adminUser.id;

    const empUser = await db.user.create({
      data: { email: empEmail, role: "EMPLOYEE" },
    });
    employeeUserId = empUser.id;

    // 2. Setup Multi-Branch Company ("Apex Global Logistics & Tech")
    const company = await db.company.create({
      data: {
        name: `Apex Global Conglomerate ${runSuffix}`,
        brandName: "Apex Global",
      },
    });
    companyId = company.id;

    // Branch 1: Noida Logistics Hub (Will have Signed Terms)
    const branch1 = await db.companyBranch.create({
      data: {
        companyId: company.id,
        branchName: "Noida Logistics Hub",
        city: "Noida",
        status: "Active",
        termsAgreementSigned: true,
        termsSignedAt: new Date(),
        termsSignedByIp: "192.168.1.100",
        defaultCommissionRate: 8.33,
        paymentTermsDays: 30,
      },
    });
    branch1Id = branch1.id;

    // Branch 2: Bengaluru Tech Hub (Terms Unsigned)
    const branch2 = await db.companyBranch.create({
      data: {
        companyId: company.id,
        branchName: "Bengaluru Tech Hub",
        city: "Bengaluru",
        status: "Lead",
        termsAgreementSigned: false, // Explicitly false!
        defaultCommissionRate: 15.0,
        paymentTermsDays: 45,
      },
    });
    branch2Id = branch2.id;

    // 3. Setup Contacts for both branches
    const userContact1 = await db.user.create({
      data: { email: noidaHrEmail, role: "COMPANY_CONTACT" },
    });
    branch1ContactUserId = userContact1.id;

    const contact1 = await db.companyContact.create({
      data: {
        userId: userContact1.id,
        companyBranchId: branch1.id,
        fullName: "Noida HR Manager",
        email: noidaHrEmail,
        mobile: "9876500001",
        isApproved: true,
      },
    });
    branch1ContactId = contact1.id;

    const userContact2 = await db.user.create({
      data: { email: blrHrEmail, role: "COMPANY_CONTACT" },
    });
    branch2ContactUserId = userContact2.id;

    const contact2 = await db.companyContact.create({
      data: {
        userId: userContact2.id,
        companyBranchId: branch2.id,
        fullName: "Bengaluru HR Lead",
        email: blrHrEmail,
        mobile: "9876500002",
        isApproved: true,
      },
    });
    branch2ContactId = contact2.id;

    // 4. Setup Driver Candidate Profile (Blue Collar)
    const driverCandidate = await db.candidate.create({
      data: {
        fullName: "Ramesh Singh (Driver)",
        mobile: driverMobile,
        email: driverEmail,
        currentLocation: "Delhi NCR",
        preferredJobLocation: "Noida / Greater Noida",
        experienceLevel: "Expert",
        totalExperienceYears: 8.5,
        preferredCategory: "Driver",
        expectedSalary: "35000 per month",
        noticePeriod: "Immediate",
      },
    });
    driverCandidateId = driverCandidate.id;

    // Driver Job Requirement at Branch 1 (Noida Logistics)
    const driverReq = await db.jobRequirement.create({
      data: {
        companyBranchId: branch1.id,
        title: "Heavy Commercial Vehicle (HCV) Driver",
        hiringCategory: "Driver",
        noOfVacancies: 3,
        minExperienceYears: 5,
        status: "Open",
      },
    });
    driverReqId = driverReq.id;

    // Driver Application (Starts at "Applied")
    const driverApp = await db.application.create({
      data: {
        candidateId: driverCandidate.id,
        jobRequirementId: driverReq.id,
        status: "Applied",
      },
    });
    driverAppId = driverApp.id;

    // 5. Setup Corporate Employee Candidate Profile (White Collar)
    const empCandidate = await db.candidate.create({
      data: {
        fullName: "Ananya Verma (Fullstack Eng)",
        mobile: corpMobile,
        email: corpEmail,
        currentLocation: "Bengaluru",
        preferredJobLocation: "Bengaluru",
        experienceLevel: "Intermediate",
        totalExperienceYears: 4.0,
        preferredCategory: "IT",
        expectedSalary: "18 LPA",
        noticePeriod: "30 Days",
      },
    });
    employeeCandidateId = empCandidate.id;

    // Add skills & education for Corporate Candidate
    const skillJs = await db.skill.upsert({
      where: { name: "TypeScript" },
      update: {},
      create: { name: "TypeScript", category: "IT" },
    });
    const skillReact = await db.skill.upsert({
      where: { name: "Next.js" },
      update: {},
      create: { name: "Next.js", category: "IT" },
    });

    await db.candidateSkill.createMany({
      data: [
        { candidateId: empCandidate.id, skillId: skillJs.id },
        { candidateId: empCandidate.id, skillId: skillReact.id },
      ],
      skipDuplicates: true,
    });

    await db.education.create({
      data: {
        candidateId: empCandidate.id,
        degree: "B.Tech",
        specialization: "Computer Science",
        institution: "Delhi Technological University",
        passingYear: 2022,
      },
    });

    await db.workExperience.create({
      data: {
        candidateId: empCandidate.id,
        companyName: "Innovatech Solutions",
        designation: "Software Engineer",
      },
    });

    // Tech Job Requirement at Branch 2 (Bengaluru Tech Hub - Unsigned Terms)
    const empReq = await db.jobRequirement.create({
      data: {
        companyBranchId: branch2.id,
        title: "Senior Fullstack Next.js Engineer",
        hiringCategory: "IT",
        noOfVacancies: 2,
        minExperienceYears: 3,
        status: "Open",
      },
    });
    employeeReqId = empReq.id;

    // Corporate Application (Starts at "Applied")
    const empApp = await db.application.create({
      data: {
        candidateId: empCandidate.id,
        jobRequirementId: empReq.id,
        status: "Applied",
      },
    });
    employeeAppId = empApp.id;
  }, 60000);

  afterAll(async () => {
    // Teardown test data cleanly
    const candidateIds = [driverCandidateId, employeeCandidateId].filter(Boolean);
    const appIds = [driverAppId, employeeAppId].filter(Boolean);
    const reqIds = [driverReqId, employeeReqId].filter(Boolean);
    const branchIds = [branch1Id, branch2Id].filter(Boolean);
    const contactIds = [branch1ContactId, branch2ContactId].filter(Boolean);
    const userIds = [adminUserId, employeeUserId, branch1ContactUserId, branch2ContactUserId].filter(Boolean);

    if (candidateIds.length > 0) {
      await db.invoice.deleteMany({ where: { placement: { application: { candidateId: { in: candidateIds } } } } });
      await db.placement.deleteMany({ where: { application: { candidateId: { in: candidateIds } } } });
    }
    if (appIds.length > 0) {
      await db.applicationStatusHistory.deleteMany({ where: { applicationId: { in: appIds } } });
      await db.application.deleteMany({ where: { id: { in: appIds } } });
    }
    if (reqIds.length > 0) {
      await db.jobRequirement.deleteMany({ where: { id: { in: reqIds } } });
    }
    if (branchIds.length > 0) {
      await db.termsSnapshot.deleteMany({ where: { companyBranchId: { in: branchIds } } });
    }
    if (contactIds.length > 0) {
      await db.companyContact.deleteMany({ where: { id: { in: contactIds } } });
    }
    if (userIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (branchIds.length > 0) {
      await db.companyBranch.deleteMany({ where: { id: { in: branchIds } } });
    }
    if (companyId) {
      await db.company.deleteMany({ where: { id: companyId } });
    }
    if (employeeCandidateId) {
      await db.candidateSkill.deleteMany({ where: { candidateId: employeeCandidateId } });
      await db.education.deleteMany({ where: { candidateId: employeeCandidateId } });
      await db.workExperience.deleteMany({ where: { candidateId: employeeCandidateId } });
    }
    if (candidateIds.length > 0) {
      await db.candidate.deleteMany({ where: { id: { in: candidateIds } } });
    }
  }, 60000);

  // ============================================================================
  // 1. ALL USER ROLES PERMISSION MATRIX (POSITIVE & NEGATIVE)
  // ============================================================================
  describe("1. User Roles & Permission Matrix", () => {
    it("ADMIN Role: Positive -> Has full unmasked candidate access and complete financial visibility", () => {
      const rawCandidate = { fullName: "Ramesh Singh", mobile: "9811223344", email: "ramesh.driver@test.com" };
      const unmasked = maskCandidateForViewer(rawCandidate, { role: "ADMIN" });
      expect(unmasked.mobile).toBe("9811223344");
      expect(unmasked.email).toBe("ramesh.driver@test.com");

      const financials = { commissionRate: 8.33, commissionAmount: 50000, totalAmount: 59000 };
      const sanitized = sanitizeFinancials(financials, "ADMIN");
      expect(sanitized.commissionRate).toBe(8.33);
      expect(sanitized.commissionAmount).toBe(50000);
      expect(sanitized.totalAmount).toBe(59000);
    });

    it("EMPLOYEE Role: Positive -> Has candidate access, Negative -> Financial fields are strictly sanitized", () => {
      const rawCandidate = { fullName: "Ananya Verma", mobile: "9899887766", email: "ananya.eng@test.com" };
      const unmasked = maskCandidateForViewer(rawCandidate, { role: "EMPLOYEE" });
      expect(unmasked.mobile).toBe("9899887766");

      const financials = { commissionRate: 15.0, commissionAmount: 180000, totalAmount: 212400 };
      const sanitized = sanitizeFinancials(financials, "EMPLOYEE");
      expect(sanitized.commissionRate).toBeUndefined();
      expect(sanitized.commissionAmount).toBeUndefined();
      expect(sanitized.totalAmount).toBeUndefined();
    });

    it("CANDIDATE Role: Negative -> Company identity is unconditionally masked as [Confidential Client]", () => {
      const rawCompany = { companyName: "Apex Global Conglomerate", brandName: "Apex Global" };
      const masked = maskCompanyForViewer(rawCompany, { role: "CANDIDATE" });
      expect(masked.companyName).toBe("[Confidential Client]");
    });
  });

  // ============================================================================
  // 2. MULTI-BRANCH COMPANY ISOLATION & TERMS CONSENT GATES
  // ============================================================================
  describe("2. Multi-Branch Company Isolation & Terms Consent Gates", () => {
    it("NEGATIVE: Branch 2 Contact attempting to sign terms for Branch 1 is rejected (403 Forbidden)", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch2ContactUserId },
      } as any);

      const req = new Request("http://localhost:3000/api/companies/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch1Id, agreed: true }), // Branch 2 user trying to sign Branch 1!
      });

      const res = await termsPOST(req);
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toContain("Forbidden");
    });

    it("NEGATIVE: Terms acceptance without explicit 'agreed' flag is rejected (400 Bad Request)", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch2ContactUserId },
      } as any);

      const req = new Request("http://localhost:3000/api/companies/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch2Id, agreed: false }), // Not agreed!
      });

      const res = await termsPOST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("POSITIVE: Branch 2 Contact successfully signs terms, records IP & creates TermsSnapshot", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch2ContactUserId },
      } as any);

      const req = new Request("http://localhost:3000/api/companies/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.45" },
        body: JSON.stringify({ branchId: branch2Id, agreed: true, termsVersion: "v1.0-standard" }),
      });

      const res = await termsPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("accepted successfully");

      // Verify in DB that Branch 2 now has termsAgreementSigned = true and snapshot created
      const updatedBranch2 = await db.companyBranch.findUnique({ where: { id: branch2Id } });
      expect(updatedBranch2?.termsAgreementSigned).toBe(true);
      expect(updatedBranch2?.termsSignedByIp).toBe("203.0.113.45");

      const snapshot = await db.termsSnapshot.findFirst({ where: { companyBranchId: branch2Id } });
      expect(snapshot).toBeDefined();
      expect(snapshot?.termsVersion).toBe("v1.0-standard");
    });
  });

  // ============================================================================
  // 3. DRIVER CANDIDATE (BLUE-COLLAR) HIRING LIFECYCLE & RESUME MASKING
  // ============================================================================
  describe("3. Driver Candidate (Blue Collar) Hiring Flow & Resume PDF", () => {
    it("STAGE 1 (Applied): Company Contact receives MASKED data and MASKED Driver Resume PDF", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch1ContactUserId },
      } as any);

      const req = new Request(`http://localhost:3000/api/candidates/${driverCandidateId}/resume`, {
        method: "GET",
      });

      const res = await resumePDFGET(req, { params: Promise.resolve({ id: driverCandidateId }) });
      expect(res.status).toBe(200);
      expect(res.headers.get("X-Resume-Masked")).toBe("true");

      const pdfArrayBuffer = await res.arrayBuffer();
      const pdfText = Buffer.from(pdfArrayBuffer).toString("utf-8");

      // Verify contact details are masked in the PDF stream
      expect(pdfText).toContain("Contact via RS Bridge");
      expect(pdfText).not.toContain(driverMobile);
      expect(pdfText).not.toContain(driverEmail);

      // Verify Driver-specific zero liability disclaimer is included
      expect(pdfText).toContain("ZERO-LIABILITY RECRUITMENT DISCLAIMER");
      expect(pdfText).toContain("DRIVER / COMMERCIAL STAFF");
    });

    it("STAGE 2 (Shortlisted): Transition to Shortlisted -> Candidate data and PDF remain strictly MASKED", async () => {
      // Recruiter shortlists driver
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "EMPLOYEE", id: employeeUserId },
      } as any);

      const patchReq = new Request("http://localhost:3000/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: driverAppId,
          toStatus: "Shortlisted",
          notes: "Driver license verified: Heavy Transport",
        }),
      });

      const patchRes = await employeeCandidatesPATCH(patchReq);
      expect(patchRes.status).toBe(200);

      // Verify Company still receives masked PDF at Shortlisted stage
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch1ContactUserId },
      } as any);

      const pdfReq = new Request(`http://localhost:3000/api/candidates/${driverCandidateId}/resume`, { method: "GET" });
      const pdfRes = await resumePDFGET(pdfReq, { params: Promise.resolve({ id: driverCandidateId }) });
      expect(pdfRes.headers.get("X-Resume-Masked")).toBe("true");
    });

    it("STAGE 3 (InterviewScheduled + Terms Signed): UNMASKS contact details and generates Full Driver PDF", async () => {
      // Recruiter schedules interview (Branch 1 has termsAgreementSigned = true)
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "EMPLOYEE", id: employeeUserId },
      } as any);

      const patchReq = new Request("http://localhost:3000/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: driverAppId,
          toStatus: "InterviewScheduled",
          notes: "Scheduled in-person driving test at Noida Yard",
        }),
      });

      const patchRes = await employeeCandidatesPATCH(patchReq);
      expect(patchRes.status).toBe(200);

      // Verify Company Contact now receives UNMASKED Driver PDF
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch1ContactUserId },
      } as any);

      const pdfReq = new Request(`http://localhost:3000/api/candidates/${driverCandidateId}/resume`, { method: "GET" });
      const pdfRes = await resumePDFGET(pdfReq, { params: Promise.resolve({ id: driverCandidateId }) });

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers.get("X-Resume-Masked")).toBe("false");

      const pdfText = Buffer.from(await pdfRes.arrayBuffer()).toString("utf-8");
      expect(pdfText).toContain(driverMobile);
      expect(pdfText).toContain(driverEmail);
      expect(pdfText).toContain("[VERIFIED UNMASKED ACCESS - TERMS ACCEPTED]");
    });

    it("STAGE 4 (Joined -> Placement & Invoice): Admin creates placement and generates Draft Invoice", async () => {
      // Advance driver to Joined
      await db.application.update({
        where: { id: driverAppId },
        data: { status: "Joined" },
      });

      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: driverAppId,
          joiningDate: "2026-09-10",
          agreedCtc: 420000, // 4.2 LPA for HCV Driver
          commissionRate: 8.33,
        }),
      });

      const res = await placementPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.placement).toBeDefined();
      placement1Id = data.placement.id;

      // Verify placement commission
      expect(Number(data.placement.commissionAmount)).toBe(34986); // 420000 * 8.33% = 34,986

      // Verify invoice generated with GST
      const invoice = await db.invoice.findUnique({ where: { placementId: placement1Id } });
      expect(invoice).toBeDefined();
      expect(Number(invoice?.subtotalAmount)).toBe(34986);
      expect(invoice?.status).toBe("Draft");
    });
  });

  // ============================================================================
  // 4. CORPORATE EMPLOYEE (WHITE-COLLAR) HIRING LIFECYCLE & RESUME MASKING
  // ============================================================================
  describe("4. Corporate Employee (White Collar) Hiring Flow & Resume PDF", () => {
    it("STAGE 1 (Applied): Company Contact receives MASKED Corporate PDF (Technical skills visible, PII hidden)", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch2ContactUserId },
      } as any);

      const req = new Request(`http://localhost:3000/api/candidates/${employeeCandidateId}/resume`, { method: "GET" });
      const res = await resumePDFGET(req, { params: Promise.resolve({ id: employeeCandidateId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Resume-Masked")).toBe("true");

      const pdfText = Buffer.from(await res.arrayBuffer()).toString("utf-8");
      // PII masked
      expect(pdfText).toContain("Masked until Interview Scheduled");
      expect(pdfText).not.toContain(corpMobile);
      expect(pdfText).not.toContain(corpEmail);

      // Professional content visible
      expect(pdfText).toContain("TypeScript, Next.js");
      expect(pdfText).toContain("B.Tech");
      expect(pdfText).toContain("Delhi Technological University");
      expect(pdfText).toContain("Innovatech Solutions");
    });

    it("STAGE 2 (InterviewScheduled + Terms Signed): Unmasks Corporate Candidate contact information", async () => {
      // Recruiter advances application to InterviewScheduled
      await db.application.update({
        where: { id: employeeAppId },
        data: { status: "InterviewScheduled" },
      });

      // Branch 2 already signed terms in test section 2
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "COMPANY_CONTACT", id: branch2ContactUserId },
      } as any);

      const req = new Request(`http://localhost:3000/api/candidates/${employeeCandidateId}/resume`, { method: "GET" });
      const res = await resumePDFGET(req, { params: Promise.resolve({ id: employeeCandidateId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Resume-Masked")).toBe("false");

      const pdfText = Buffer.from(await res.arrayBuffer()).toString("utf-8");
      expect(pdfText).toContain(corpMobile);
      expect(pdfText).toContain(corpEmail);
      expect(pdfText).toContain("[VERIFIED UNMASKED ACCESS - TERMS ACCEPTED]");
    });
  });

  // ============================================================================
  // 5. FRAUD GATES & BUSINESS RULES (RULES 4, 6, 7 & 8)
  // ============================================================================
  describe("5. Fraud Prevention Gates & Replacement Business Rules", () => {
    it("Rule 7 Gate: New self-registered company contact starts with isApproved = false", async () => {
      const payload = {
        companyName: "Zenith Retail Corp",
        city: "Gurgaon",
        contactName: "Sunil Kapoor",
        email: "sunil.kapoor@zenithretail.com",
        mobile: "9871100223",
        password: "SecurePassword123!",
        designation: "Talent Acquisition Lead",
      };

      const req = new Request("http://localhost:3000/api/companies/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await companyInquirePOST(req);
      const data = await res.json();
      expect(res.status).toBe(201);

      const contact = await db.companyContact.findUnique({ where: { id: data.contactId } });
      expect(contact?.isApproved).toBe(false); // Strictly unapproved until admin verification

      // Cleanup
      await db.companyContact.delete({ where: { id: data.contactId } });
      if (contact?.userId) await db.user.delete({ where: { id: contact.userId } });
      const branch = await db.companyBranch.findFirst({ where: { company: { name: "Zenith Retail Corp" } } });
      if (branch) await db.companyBranch.delete({ where: { id: branch.id } });
      await db.company.deleteMany({ where: { name: "Zenith Retail Corp" } });
    });

    it("Rule 6 Gate: Admin verifies driver resignation proof -> Reopens job requirement", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/placements/resignation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId: placement1Id,
          resignationProofUrl: "/uploads/resumes/driver_resignation.pdf",
        }),
      });

      const res = await resignationPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("Resignation verified");

      // Verify placement is marked inactive
      const updatedPlacement = await db.placement.findUnique({ where: { id: placement1Id } });
      expect(updatedPlacement?.isActive).toBe(false);
      expect(updatedPlacement?.replacementStatus).toBe("AdminVerified");

      // Verify replacement job was reopened
      expect(data.data.replacementJob.isReplacement).toBe(true);
      expect(data.data.replacementJob.replacesPlacementId).toBe(placement1Id);

      // Cleanup reopened job
      await db.jobRequirement.delete({ where: { id: data.data.replacementJob.id } });
    });

    it("Rule 4: Free replacement placement NEVER generates an invoice", async () => {
      // Create new replacement driver
      const repDriver = await db.candidate.create({
        data: {
          fullName: "Suresh Kumar (Replacement Driver)",
          mobile: "9811223399",
          email: "suresh.rep@test.com",
          preferredCategory: "Driver",
        },
      });

      const repApp = await db.application.create({
        data: {
          candidateId: repDriver.id,
          jobRequirementId: driverReqId,
          status: "Joined",
        },
      });

      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: repApp.id,
          joiningDate: "2026-10-01",
          agreedCtc: 420000,
          commissionRate: 8.33,
          replacesPlacementId: placement1Id, // Marked as replacement!
        }),
      });

      const res = await placementPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("No invoice generated per Rule 4");

      // Verify NO invoice was created
      const invoice = await db.invoice.findUnique({ where: { placementId: data.placement.id } });
      expect(invoice).toBeNull(); // Strictly NULL!

      // Cleanup replacement records
      await db.placement.delete({ where: { id: data.placement.id } });
      await db.application.delete({ where: { id: repApp.id } });
      await db.candidate.delete({ where: { id: repDriver.id } });
    });
  });
});
