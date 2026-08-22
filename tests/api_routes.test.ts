import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { POST as candidateRegisterPOST } from "../src/app/api/candidates/register/route";
import { POST as companyInquirePOST } from "../src/app/api/companies/inquire/route";
import { GET as employeeCandidatesGET, PATCH as employeeCandidatesPATCH } from "../src/app/api/employee/candidates/route";
import { GET as adminVerificationsGET, PATCH as adminVerificationsPATCH } from "../src/app/api/admin/verifications/route";
import * as authModule from "../src/lib/auth";
import { GET as publicJobsGET } from "../src/app/api/jobs/route";

import { db } from "../src/lib/db";

describe("API Route Integration Tests (Positive & Negative)", () => {

      // --- EMPLOYEE CANDIDATES API TESTS ---
  describe("GET & PATCH /api/employee/candidates", () => {
    let testCandidateId: string;
    let testCompanyId: string;
    let testBranchId: string;
    let testRequirementId: string;
    let testApplicationId: string;

    beforeAll(async () => {
      // Create candidate, requirement, and application
      const candidate = await db.candidate.create({
        data: {
          fullName: "Pipeline Candidate",
          mobile: "9001122334",
          email: "pipeline.cand@test.com",
          preferredCategory: "IT",
          experienceLevel: "Fresher",
        },
      });
      testCandidateId = candidate.id;

      const company = await db.company.create({
        data: { name: "Pipeline Tech Corp" },
      });
      testCompanyId = company.id;

      const branch = await db.companyBranch.create({
        data: { companyId: company.id, branchName: "Noida HQ", city: "Noida" },
      });
      testBranchId = branch.id;

      const req = await db.jobRequirement.create({
        data: {
          companyBranchId: branch.id,
          title: "Frontend Developer",
          hiringCategory: "IT",
          status: "Open",
        },
      });
      testRequirementId = req.id;

      const app = await db.application.create({
        data: {
          candidateId: candidate.id,
          jobRequirementId: req.id,
          status: "Applied",
        },
      });
      testApplicationId = app.id;
    });

    afterAll(async () => {
      // Clean up test data
      await db.applicationStatusHistory.deleteMany({ where: { applicationId: testApplicationId } });
      await db.application.deleteMany({ where: { id: testApplicationId } });
      await db.jobRequirement.deleteMany({ where: { id: testRequirementId } });
      await db.companyBranch.deleteMany({ where: { id: testBranchId } });
      await db.company.deleteMany({ where: { id: testCompanyId } });
      await db.candidate.deleteMany({ where: { id: testCandidateId } });
    });

    it("NEGATIVE: Rejects non-Employee/Admin roles with 403 Forbidden", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "CANDIDATE" },
      } as any);

      const req = new Request("http://localhost:3000/api/employee/candidates", { method: "GET" });
      const res = await employeeCandidatesGET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Unauthorized");
    });

    it("POSITIVE: Allows Employee to fetch candidate pipeline", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "EMPLOYEE", id: "emp-user-123" },
      } as any);

      const req = new Request("http://localhost:3000/api/employee/candidates", { method: "GET" });
      const res = await employeeCandidatesGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.applications)).toBe(true);

      const found = data.applications.find((a: any) => a.id === testApplicationId);
      expect(found).toBeDefined();
      expect(found.status).toBe("Applied");
    });

    it("POSITIVE: Allows Employee to transition candidate status and log audit history", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "EMPLOYEE", id: "emp-user-123" },
      } as any);

      const req = new Request("http://localhost:3000/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: testApplicationId,
          toStatus: "Shortlisted",
          notes: "Passed initial resume screening",
        }),
      });

      const res = await employeeCandidatesPATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("Shortlisted");

      // Verify DB application status updated to Shortlisted
      const updatedApp = await db.application.findUnique({
        where: { id: testApplicationId },
      });
      expect(updatedApp?.status).toBe("Shortlisted");

      // Verify status history audit trail entry was created
      const history = await db.applicationStatusHistory.findFirst({
        where: { applicationId: testApplicationId, toStatus: "Shortlisted" },
      });
      expect(history).toBeDefined();
      expect(history?.fromStatus).toBe("Applied");
    });
  });


      // --- ADMIN VERIFICATION API TESTS ---
  describe("GET & PATCH /api/admin/verifications", () => {
    let pendingUserId: string;
    let pendingContactId: string;
    let testCompanyId: string;
    let testBranchId: string;

    beforeAll(async () => {
      // Create pending unapproved CompanyContact for testing
      const company = await db.company.create({
        data: { name: "Pending Approval Corp" },
      });
      testCompanyId = company.id;

      const branch = await db.companyBranch.create({
        data: { companyId: company.id, branchName: "Delhi Branch", city: "Delhi" },
      });
      testBranchId = branch.id;

      const user = await db.user.create({
        data: { email: "unapproved.hr@pending.com", role: "COMPANY_CONTACT" },
      });
      pendingUserId = user.id;

      const contact = await db.companyContact.create({
        data: {
          userId: user.id,
          companyBranchId: branch.id,
          fullName: "Pending HR",
          email: "unapproved.hr@pending.com",
          mobile: "9112233445",
          isApproved: false, // Fraud prevention gate
        },
      });
      pendingContactId = contact.id;
    });

    afterAll(async () => {
      // Clean up test data
      await db.companyContact.deleteMany({ where: { id: pendingContactId } });
      await db.user.deleteMany({ where: { id: pendingUserId } });
      await db.companyBranch.deleteMany({ where: { id: testBranchId } });
      await db.company.deleteMany({ where: { id: testCompanyId } });
    });

    it("NEGATIVE: Rejects access with 403 Forbidden for non-Admin users", async () => {
      // Mock session as CANDIDATE
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "CANDIDATE" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/verifications", { method: "GET" });
      const res = await adminVerificationsGET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Unauthorized");
    });

    it("POSITIVE: Allows Admin to fetch pending unapproved contacts", async () => {
      // Mock session as ADMIN
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/verifications", { method: "GET" });
      const res = await adminVerificationsGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.contacts)).toBe(true);

      const found = data.contacts.find((c: any) => c.id === pendingContactId);
      expect(found).toBeDefined();
      expect(found.isApproved).toBe(false);
    });

    it("POSITIVE: Allows Admin to approve pending contact", async () => {
      // Mock session as ADMIN
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: pendingContactId, approve: true }),
      });

      const res = await adminVerificationsPATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("approved successfully");

      // Verify in DB that isApproved is now TRUE
      const updated = await db.companyContact.findUnique({
        where: { id: pendingContactId },
      });
      expect(updated?.isApproved).toBe(true);
    });
  });

  // --- CANDIDATE REGISTRATION API TESTS ---
  describe("POST /api/candidates/register", () => {
    it("POSITIVE: Creates/upserts a candidate record with valid inputs", async () => {
      const formData = new FormData();
      formData.append("fullName", "Test Candidate");
      formData.append("mobile", "9998887770");
      formData.append("email", "test.candidate@example.com");
      formData.append("currentLocation", "Noida");
      formData.append("preferredCategory", "IT");
      formData.append("experienceLevel", "Intermediate");

      const req = new Request("http://localhost:3000/api/candidates/register", {
        method: "POST",
        body: formData,
      });

      const res = await candidateRegisterPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("successful");
      expect(data.candidateId).toBeDefined();

      // Clean up test data
      await db.candidate.deleteMany({ where: { mobile: "9998887770" } });
    });

    it("NEGATIVE: Rejects registration if required fields (fullName, mobile, etc.) are missing", async () => {
      const formData = new FormData();
      formData.append("fullName", "Incomplete Candidate");
      // Intentionally omitting mobile, email, preferredCategory

      const req = new Request("http://localhost:3000/api/candidates/register", {
        method: "POST",
        body: formData,
      });

      const res = await candidateRegisterPOST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  // --- COMPANY INQUIRY API TESTS ---
  describe("POST /api/companies/inquire", () => {
    const testEmail = "test.hr@acmedemo.com";

    afterAll(async () => {
      // Cleanup created company & user
      const user = await db.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await db.companyContact.deleteMany({ where: { userId: user.id } });
        await db.user.delete({ where: { id: user.id } });
      }
    });

    it("POSITIVE: Submits company inquiry and enforces Rule 7 (isApproved = false)", async () => {
      const payload = {
        companyName: "Acme Test Corp",
        city: "Gurgaon",
        contactName: "Vikram Mehta",
        email: testEmail,
        mobile: "9876543299",
        password: "CompanyPassword123!",
        designation: "HR Lead",
      };

      const req = new Request("http://localhost:3000/api/companies/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await companyInquirePOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("pending Admin approval");

      // Verify in DB that isApproved is strictly FALSE (Fraud prevention gate)
      const contact = await db.companyContact.findFirst({
        where: { email: testEmail },
      });
      expect(contact?.isApproved).toBe(false);
    });

    it("NEGATIVE: Rejects submission when required field is missing", async () => {
      const payload = {
        companyName: "Incomplete Company",
        // Intentionally omitting email and password
      };

      const req = new Request("http://localhost:3000/api/companies/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await companyInquirePOST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("NEGATIVE: Rejects submission if email is already registered", async () => {
      // First submission was testEmail above
      const payload = {
        companyName: "Duplicate Acme",
        city: "Noida",
        contactName: "Vikram Duplicate",
        email: testEmail, // Duplicate!
        mobile: "9876543299",
        password: "CompanyPassword123!",
      };

      const req = new Request("http://localhost:3000/api/companies/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await companyInquirePOST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toContain("already exists");
    });
  });

// Inside describe("API Route Integration Tests (Positive & Negative)", () => { ...

  // --- PUBLIC JOBS API TESTS ---
  describe("GET /api/jobs", () => {
    let testCompanyId: string;
    let testBranchId: string;
    let testRequirementId: string;

    beforeAll(async () => {
      // Create test company, branch, and open job requirement
      const company = await db.company.create({
        data: { name: "Secret Hiring Corp", brandName: "Secret Corp" },
      });
      testCompanyId = company.id;

      const branch = await db.companyBranch.create({
        data: {
          companyId: company.id,
          branchName: "Noida Branch",
          city: "Noida",
        },
      });
      testBranchId = branch.id;

      const req = await db.jobRequirement.create({
        data: {
          companyBranchId: branch.id,
          title: "Senior Fullstack Developer",
          hiringCategory: "IT",
          noOfVacancies: 2,
          minExperienceYears: 3,
          maxSalaryLpa: 15.0,
          status: "Open",
        },
      });
      testRequirementId = req.id;
    });

    afterAll(async () => {
      // Clean up test data
      await db.jobRequirement.delete({ where: { id: testRequirementId } });
      await db.companyBranch.delete({ where: { id: testBranchId } });
      await db.company.delete({ where: { id: testCompanyId } });
    });

    it("POSITIVE: Returns open jobs and enforces Anti-Disintermediation company masking", async () => {
      const req = new Request("http://localhost:3000/api/jobs", { method: "GET" });
      const res = await publicJobsGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.jobs)).toBe(true);

      // Verify that company identity is masked as "[Confidential Client]" for candidate viewers
      const testJob = data.jobs.find((j: any) => j.id === testRequirementId);
      expect(testJob).toBeDefined();
      expect(testJob.companyName).toBe("[Confidential Client]");
      expect(testJob.title).toBe("Senior Fullstack Developer");
    });

    it("POSITIVE: Filters jobs correctly by category parameter", async () => {
      const req = new Request("http://localhost:3000/api/jobs?category=Driver", { method: "GET" });
      const res = await publicJobsGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // Ensures our IT job is excluded when filtering by Driver
      const testJob = data.jobs.find((j: any) => j.id === testRequirementId);
      expect(testJob).toBeUndefined();
    });
  });

});
