import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
      });
      if (!contact) {
        return NextResponse.json({ error: "Forbidden: No company contact profile found." }, { status: 403 });
      }
      whereClause.companyBranchId = contact.companyBranchId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status as any;
    }

    const requirements = await db.jobRequirement.findMany({
      where: whereClause,
      include: {
        branch: {
          include: { company: true },
        },
        skills: {
          include: { skill: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requirements });
  } catch (error: any) {
    console.error("Fetch Requirements Error:", error);
    return NextResponse.json({ error: "Failed to fetch requirements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;

    let companyBranchId: string;

    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
      });
      if (!contact) {
        return NextResponse.json({ error: "Forbidden: No company contact profile found." }, { status: 403 });
      }
      companyBranchId = contact.companyBranchId;

      // Check for overdue unpaid invoices
      const overdueCount = await db.invoice.count({
        where: {
          placement: {
            application: {
              requirement: {
                companyBranchId,
              },
            },
          },
          status: "Overdue",
        },
      });

      if (overdueCount > 0) {
        return NextResponse.json(
          { error: "Posting Hold: Your company branch has overdue unpaid invoices. Please clear outstanding balances before posting new mandates." },
          { status: 402 }
        );
      }

      // Check total unpaid invoice liability against clientCreditLimit
      const branch = await db.companyBranch.findUnique({
        where: { id: companyBranchId },
        select: { clientCreditLimit: true },
      });

      if (branch?.clientCreditLimit) {
        const unpaidInvoices = await db.invoice.findMany({
          where: {
            placement: { application: { requirement: { companyBranchId } } },
            status: { in: ["Draft", "Sent", "Overdue"] },
          },
          select: { totalAmount: true },
        });

        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        if (totalUnpaid >= Number(branch.clientCreditLimit)) {
          return NextResponse.json(
            { error: `Credit Threshold Reached: Total unpaid invoice liability (₹${totalUnpaid.toLocaleString()}) has reached or exceeded your branch credit limit of ₹${Number(branch.clientCreditLimit).toLocaleString()}.` },
            { status: 402 }
          );
        }
      }
    } else if (userRole === "ADMIN" || userRole === "EMPLOYEE") {
      const body = await req.clone().json();
      companyBranchId = body.companyBranchId;
      if (!companyBranchId) {
        return NextResponse.json({ error: "companyBranchId is required." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden: Invalid role for posting requirements." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      hiringCategory,
      categoryType = "Corporate", // "Corporate" | "Driver"
      noOfVacancies = 1,
      minExperienceYears = 0,
      maxSalaryLpa,
      jobDescription,
      skillIds = [],
      // Driver specific
      vehicleTypesRequired,
      dlCategoryRequired,
      dutyHours,
      joiningTimeline,
      // Admin / Branch overrides
      commissionRateOverride,
      paymentTermsDaysOverride,
      replacementWindowDaysOverride,
    } = body;

    if (!title || !hiringCategory) {
      return NextResponse.json({ error: "Title and hiring category are required." }, { status: 400 });
    }

    const requirement = await db.jobRequirement.create({
      data: {
        companyBranchId,
        title,
        hiringCategory,
        categoryType,
        noOfVacancies: Number(noOfVacancies),
        minExperienceYears: Number(minExperienceYears),
        maxSalaryLpa: maxSalaryLpa ? Number(maxSalaryLpa) : null,
        jobDescription,
        status: userRole === "ADMIN" || userRole === "EMPLOYEE" ? "Open" : "PendingApproval",
        vehicleTypesRequired: vehicleTypesRequired || null,
        dlCategoryRequired: dlCategoryRequired || null,
        dutyHours: dutyHours || null,
        joiningTimeline: joiningTimeline || null,
        commissionRateOverride: commissionRateOverride ? Number(commissionRateOverride) : null,
        paymentTermsDaysOverride: paymentTermsDaysOverride ? Number(paymentTermsDaysOverride) : null,
        replacementWindowDaysOverride: replacementWindowDaysOverride ? Number(replacementWindowDaysOverride) : null,
        skills: {
          create: skillIds.map((skillId: string) => ({
            skillId,
          })),
        },
      },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    return NextResponse.json({ success: true, requirement }, { status: 201 });
  } catch (error: any) {
    console.error("Create Requirement Error:", error);
    return NextResponse.json({ error: "Failed to create requirement." }, { status: 500 });
  }
}

// PATCH: Update requirement status (e.g. approve requirement, put on hold, or close)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const body = await req.json();
    const { requirementId, status, vacanciesFilled, noOfVacancies } = body;

    if (!requirementId) {
      return NextResponse.json({ error: "Requirement ID is required." }, { status: 400 });
    }

    const requirement = await db.jobRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      return NextResponse.json({ error: "Requirement not found." }, { status: 404 });
    }

    const updated = await db.jobRequirement.update({
      where: { id: requirementId },
      data: {
        ...(status ? { status } : {}),
        ...(vacanciesFilled !== undefined ? { vacanciesFilled: Number(vacanciesFilled) } : {}),
        ...(noOfVacancies !== undefined ? { noOfVacancies: Number(noOfVacancies) } : {}),
      },
    });

    return NextResponse.json({
      message: `Requirement status updated to ${updated.status}!`,
      requirement: updated,
    });
  } catch (error: any) {
    console.error("Update Requirement Error:", error);
    return NextResponse.json({ error: "Failed to update requirement." }, { status: 500 });
  }
}
