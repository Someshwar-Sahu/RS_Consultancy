import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { POST as placementPOST } from "../src/app/api/admin/placements/route";
import { POST as resignationPOST } from "../src/app/api/admin/placements/resignation/route";
import * as authModule from "../src/lib/auth";
import { db } from "../src/lib/db";

describe("Financials & Resignation Workflows (Rules 4 & 8)", () => {
  let candidateId: string;
  let companyId: string;
  let branchId: string;
  let requirementId: string;
  let normalAppId: string;
  let normalPlacementId: string;

  beforeAll(async () => {
    // 1. Create candidate, company, branch, requirement, and application
    const candidate = await db.candidate.create({
      data: {
        fullName: "Finance Candidate",
        mobile: "9119988770",
        email: "finance.cand@test.com",
        preferredCategory: "IT",
        experienceLevel: "Intermediate",
      },
    });
    candidateId = candidate.id;

    const company = await db.company.create({
      data: { name: "Finance Tech India" },
    });
    companyId = company.id;

    const branch = await db.companyBranch.create({
      data: { companyId: company.id, branchName: "Noida Sector 62", city: "Noida", paymentTermsDays: 30 },
    });
    branchId = branch.id;

    const req = await db.jobRequirement.create({
      data: {
        companyBranchId: branch.id,
        title: "Senior Backend Developer",
        hiringCategory: "IT",
        status: "Open",
      },
    });
    requirementId = req.id;

    const app = await db.application.create({
      data: { candidateId: candidate.id, jobRequirementId: req.id, status: "Offered" },
    });
    normalAppId = app.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.invoice.deleteMany({ where: { placement: { applicationId: normalAppId } } });
    await db.placement.deleteMany({ where: { applicationId: normalAppId } });
    await db.application.deleteMany({ where: { candidateId } });
    await db.jobRequirement.deleteMany({ where: { companyBranchId: branchId } });
    await db.companyBranch.deleteMany({ where: { id: branchId } });
    await db.company.deleteMany({ where: { id: companyId } });
    await db.candidate.deleteMany({ where: { id: candidateId } });
  });

  // --- PLACEMENT & INVOICE CREATION ---
  describe("POST /api/admin/placements", () => {
    it("POSITIVE: Creates Placement, calculates commission, and generates Draft Invoice", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const payload = {
        applicationId: normalAppId,
        joiningDate: "2026-09-01",
        agreedCtc: 1200000, // 12 LPA
        commissionRate: 10.0, // 10% rate => 1.2 Lakh commission
      };

      const req = new Request("http://localhost:3000/api/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await placementPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.placement).toBeDefined();
      normalPlacementId = data.placement.id;

      // Verify Placement commission calculations
      expect(Number(data.placement.commissionAmount)).toBe(120000);

      // Verify Draft Invoice was automatically created
      const invoice = await db.invoice.findUnique({
        where: { placementId: normalPlacementId },
      });
      expect(invoice).toBeDefined();
      expect(Number(invoice?.subtotalAmount)).toBe(120000);
      expect(Number(invoice?.taxAmount)).toBe(21600); // 18% GST on 1.2L = 21,600
      expect(Number(invoice?.totalAmount)).toBe(141600); // Total = 1,41,600
      expect(invoice?.status).toBe("Draft");
    });

    it("POSITIVE (Rule 4): Creates Free Replacement Placement WITHOUT generating an Invoice", async () => {
      // Create a distinct replacement candidate to satisfy @@unique([candidateId, jobRequirementId])
      const repCandidate = await db.candidate.create({
        data: {
          fullName: "Replacement Candidate",
          mobile: "9119988771",
          email: "rep.cand@test.com",
          preferredCategory: "IT",
          experienceLevel: "Intermediate",
        },
      });

      const repApp = await db.application.create({
        data: { candidateId: repCandidate.id, jobRequirementId: requirementId, status: "Offered" },
      });

      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const payload = {
        applicationId: repApp.id,
        joiningDate: "2026-10-01",
        agreedCtc: 1200000,
        commissionRate: 10.0,
        replacesPlacementId: normalPlacementId, // Marked as replacement!
      };

      const req = new Request("http://localhost:3000/api/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await placementPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.message).toContain("No invoice generated per Rule 4");

      // Verify Rule 4: NO Invoice generated for replacement placement
      const repInvoice = await db.invoice.findUnique({
        where: { placementId: data.placement.id },
      });
      expect(repInvoice).toBeNull(); // Strictly NULL!

      // Cleanup replacement test records
      await db.placement.delete({ where: { id: data.placement.id } });
      await db.application.delete({ where: { id: repApp.id } });
      await db.candidate.delete({ where: { id: repCandidate.id } });
    });
  });

  // --- RESIGNATION & REPLACEMENT VERIFICATION ---
  describe("POST /api/admin/placements/resignation", () => {
    it("POSITIVE: Admin verifies resignation, deactivates placement, and reopens job requirement", async () => {
      vi.spyOn(authModule, "auth").mockResolvedValueOnce({
        user: { role: "ADMIN" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/placements/resignation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId: normalPlacementId,
          resignationProofUrl: "/uploads/resumes/resignation-letter.pdf",
        }),
      });

      const res = await resignationPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain("Resignation verified");

      // Verify original placement deactivated & replacement status updated
      const updatedPlacement = await db.placement.findUnique({ where: { id: normalPlacementId } });
      expect(updatedPlacement?.isActive).toBe(false);
      expect(updatedPlacement?.replacementStatus).toBe("AdminVerified");

      // Verify replacement job requirement reopened
      expect(data.data.replacementJob).toBeDefined();
      expect(data.data.replacementJob.isReplacement).toBe(true);
      expect(data.data.replacementJob.replacesPlacementId).toBe(normalPlacementId);

      // Cleanup created replacement job
      await db.jobRequirement.delete({ where: { id: data.data.replacementJob.id } });
    });
  });
});
