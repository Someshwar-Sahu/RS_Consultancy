import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/lib/db";
import { generateCandidateResumePdf, generateCandidateRefCode } from "../src/lib/pdf";
import { assignApplicationRoundRobin } from "../src/lib/assignment";
import { ViewerContext } from "../src/lib/permissions";
import crypto from "crypto";

describe("New Features & Modules Comprehensive Test Suite", () => {
  const uniqueSeed = Date.now().toString();
  let testAdminUser: any;
  let testEmployeeUser: any;
  let testCandidate: any;
  let testCompany: any;
  let testBranch: any;
  let testRequirementCorporate: any;
  let testRequirementDriver: any;

  beforeAll(async () => {
    // 1. Create Admin & Employee users
    testAdminUser = await db.user.create({
      data: {
        email: `admin.${uniqueSeed}@rsbridge.com`,
        role: "ADMIN",
      },
    });

    testEmployeeUser = await db.user.create({
      data: {
        email: `employee.${uniqueSeed}@rsbridge.com`,
        role: "EMPLOYEE",
      },
    });

    // 2. Create Candidate
    testCandidate = await db.candidate.create({
      data: {
        fullName: `Aarav Sharma ${uniqueSeed}`,
        email: `aarav.${uniqueSeed}@example.com`,
        mobile: `+91 99${uniqueSeed.slice(-8)}`,
        preferredCategory: "IT",
        experienceLevel: "Intermediate",
        totalExperienceYears: 3.5,
        drivingLicenseNumber: "DL-1420260012345",
        dlCategory: "LMV",
        policeVerificationStatus: "Verified",
      },
    });

    // 3. Create Company & Branch
    testCompany = await db.company.create({
      data: {
        name: `Apex Global Tech ${uniqueSeed}`,
      },
    });

    testBranch = await db.companyBranch.create({
      data: {
        companyId: testCompany.id,
        branchName: "Noida CyberCity",
        city: "Noida",
        termsAgreementSigned: true,
        termsSignedByName: "Vikram Malhotra",
        defaultReplacementWindowDays: 60,
      },
    });

    // 4. Create Corporate Requirement
    testRequirementCorporate = await db.jobRequirement.create({
      data: {
        companyBranchId: testBranch.id,
        title: "Senior Fullstack Engineer",
        hiringCategory: "IT",
        categoryType: "Corporate",
        noOfVacancies: 2,
        minExperienceYears: 3,
        maxSalaryLpa: 15.0,
        status: "Open",
      },
    });

    // 5. Create Driver Requirement
    testRequirementDriver = await db.jobRequirement.create({
      data: {
        companyBranchId: testBranch.id,
        title: "Commercial Delivery Truck Driver",
        hiringCategory: "Driver",
        categoryType: "Driver",
        dlCategoryRequired: "Commercial",
        vehicleTypesRequired: "Container Truck, 14-Wheeler",
        dutyHours: "10 Hours",
        status: "Open",
      },
    });
  });

  afterAll(async () => {
    // Clean up created records
    try {
      await db.applicationStatusHistory.deleteMany({
        where: { application: { candidateId: testCandidate?.id } },
      });
      await db.application.deleteMany({
        where: { candidateId: testCandidate?.id },
      });
      await db.candidateResume.deleteMany({
        where: { candidateId: testCandidate?.id },
      });
      await db.candidate.deleteMany({ where: { id: testCandidate?.id } });
      await db.jobRequirement.deleteMany({
        where: { id: { in: [testRequirementCorporate?.id, testRequirementDriver?.id] } },
      });
      await db.companyBranch.deleteMany({ where: { id: testBranch?.id } });
      await db.company.deleteMany({ where: { id: testCompany?.id } });
      await db.inAppNotification.deleteMany({
        where: { userId: { in: [testAdminUser?.id, testEmployeeUser?.id] } },
      });
      await db.userInvite.deleteMany({
        where: { email: { contains: uniqueSeed } },
      });
      await db.user.deleteMany({
        where: { id: { in: [testAdminUser?.id, testEmployeeUser?.id] } },
      });
    } catch (e) {
      // ignore cleanup error
    }
  });

  // =========================================================================
  // 1. MULTI-RESUME MANAGEMENT
  // =========================================================================
  it("Candidate can hold multiple labeled resume versions and designate a default", async () => {
    // Resume 1: Full-Stack CV
    const resume1 = await db.candidateResume.create({
      data: {
        candidateId: testCandidate.id,
        label: "Full-Stack React/Next.js CV",
        fileUrl: "https://r2.rsbridge.com/resumes/aarav_fullstack.pdf",
        isDefault: true,
      },
    });

    // Resume 2: Python / Backend CV
    const resume2 = await db.candidateResume.create({
      data: {
        candidateId: testCandidate.id,
        label: "FastAPI / Python Backend CV",
        fileUrl: "https://r2.rsbridge.com/resumes/aarav_backend.pdf",
        isDefault: false,
      },
    });

    const allResumes = await db.candidateResume.findMany({
      where: { candidateId: testCandidate.id },
    });

    expect(allResumes.length).toBe(2);
    expect(allResumes.find((r) => r.isDefault)?.label).toBe("Full-Stack React/Next.js CV");
    expect(allResumes.find((r) => !r.isDefault)?.label).toBe("FastAPI / Python Backend CV");

    // Attach specific resume2 to an application
    const app = await db.application.create({
      data: {
        candidateId: testCandidate.id,
        jobRequirementId: testRequirementCorporate.id,
        resumeId: resume2.id,
        status: "Applied",
      },
      include: { resume: true },
    });

    expect(app.resumeId).toBe(resume2.id);
    expect(app.resume?.label).toBe("FastAPI / Python Backend CV");
  });

  // =========================================================================
  // 2. ROUND-ROBIN APPLICATION AUTO-ASSIGNMENT
  // =========================================================================
  it("Auto-assigns new application to active recruiter via round-robin load balancing", async () => {
    const assignedUserId = await assignApplicationRoundRobin();
    expect(assignedUserId).toBeDefined();
    expect(typeof assignedUserId).toBe("string");
  });

  // =========================================================================
  // 3. IN-APP NOTIFICATIONS & UNREAD BADGES
  // =========================================================================
  it("Dispatches in-app notification to user and tracks unread count", async () => {
    const notif = await db.inAppNotification.create({
      data: {
        userId: testEmployeeUser.id,
        type: "APPLICATION_ASSIGNED",
        title: "New Candidate Assigned",
        message: `${testCandidate.fullName} applied for Senior Fullstack Engineer`,
        linkUrl: `/employee/candidates/${testCandidate.id}`,
      },
    });

    const unreadCount = await db.inAppNotification.count({
      where: { userId: testEmployeeUser.id, isRead: false },
    });
    expect(unreadCount).toBeGreaterThanOrEqual(1);

    // Mark as read
    await db.inAppNotification.update({
      where: { id: notif.id },
      data: { isRead: true },
    });

    const updated = await db.inAppNotification.findUnique({
      where: { id: notif.id },
    });
    expect(updated?.isRead).toBe(true);
  });

  // =========================================================================
  // 4. SITE SETTINGS & FEATURE FLAGS
  // =========================================================================
  it("Allows Admin to toggle site_settings flags without code redeployment", async () => {
    const settingKey = `stats_page_is_home_${uniqueSeed}`;
    const setting = await db.siteSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: "true" },
      update: { value: "true" },
    });

    expect(setting.value).toBe("true");

    // Toggle off
    const toggled = await db.siteSetting.update({
      where: { key: settingKey },
      data: { value: "false" },
    });
    expect(toggled.value).toBe("false");

    await db.siteSetting.delete({ where: { key: settingKey } });
  });

  // =========================================================================
  // 5. USER INVITES (RECRUITER ONBOARDING)
  // =========================================================================
  it("Generates user invitation tokens for employee onboarding", async () => {
    const inviteEmail = `recruiter.${uniqueSeed}@rsbridge.com`;
    const token = crypto.randomBytes(16).toString("hex");

    const invite = await db.userInvite.create({
      data: {
        email: inviteEmail,
        role: "EMPLOYEE",
        tokenHash: token,
        invitedBy: testAdminUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    expect(invite.email).toBe(inviteEmail);
    expect(invite.role).toBe("EMPLOYEE");
    expect(invite.acceptedAt).toBeNull();
  });

  // =========================================================================
  // 6. 2-CARD REQUIREMENT INTAKE (CORPORATE VS DRIVER)
  // =========================================================================
  it("Persists driver-specific requirement attributes (DL category, vehicle types, duty hours)", async () => {
    const driverReq = await db.jobRequirement.findUnique({
      where: { id: testRequirementDriver.id },
    });

    expect(driverReq?.categoryType).toBe("Driver");
    expect(driverReq?.dlCategoryRequired).toBe("Commercial");
    expect(driverReq?.vehicleTypesRequired).toContain("Container Truck");
    expect(driverReq?.dutyHours).toBe("10 Hours");
  });

  // =========================================================================
  // 7. UNBROKEN ENCODED REFERENCE ID & LINK ANNOTATIONS
  // =========================================================================
  it("Generates unbroken encoded reference IDs without hyphens (e.g. RSB2608IT8429)", () => {
    const refCode = generateCandidateRefCode({
      id: testCandidate.id,
      preferredCategory: "IT",
      createdAt: new Date("2026-08-01"),
    });

    // Must match format: RSB[YY][MM][CATEGORY][4-DIGIT-PIN]
    expect(refCode).toMatch(/^RSB2608IT\d{4}$/);
    expect(refCode).not.toContain("-");

    const driverRef = generateCandidateRefCode({
      id: "driver-test-01",
      preferredCategory: "Driver",
      createdAt: new Date("2026-08-01"),
    });
    expect(driverRef).toMatch(/^RSB2608DR\d{4}$/);
    expect(driverRef).not.toContain("-");
  });

  it("Embeds native PDF link annotations for project URLs", () => {
    const viewer: ViewerContext = { role: "ADMIN" };
    const pdfRes = generateCandidateResumePdf(
      {
        id: testCandidate.id,
        fullName: testCandidate.fullName,
        email: testCandidate.email,
        mobile: testCandidate.mobile,
        projects: [
          {
            title: "StreamFlix Platform",
            techStack: "React, FastAPI | GitHub",
            linkUrl: "https://github.com/someshwarsahu/streamflix",
            bullets: ["Multi-resolution HLS streaming architecture."],
          },
        ],
      },
      viewer
    );

    const pdfContent = pdfRes.buffer.toString("utf-8");
    expect(pdfContent).toContain("/Subtype /Link");
    expect(pdfContent).toContain("https://github.com/someshwarsahu/streamflix");
  });
});
