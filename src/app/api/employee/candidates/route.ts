import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Fetch candidate application pipeline or master candidate pool
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "pool" | "pipeline"
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const currentUserId = session?.user?.id;

    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const skip = (page - 1) * limit;

    // View 1: Master Candidate Pool (for proactive matchmaking and sourcing)
    if (view === "pool") {
      const candidates = await db.candidate.findMany({
        take: limit,
        skip: skip,
        include: {
          skills: { include: { skill: true } },
          resumes: { orderBy: { uploadedAt: "desc" }, take: 1 },
          education: true,
          experiences: true,
          applications: {
            take: 5,
            include: {
              requirement: {
                include: { branch: { include: { company: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ candidates, currentUserId, page, limit });
    }

    // View 2: Active Application Pipeline / Screening Queue
    const whereClause: any = {};
    if (status) {
      whereClause.status = status as any;
    }
    if (assignedToMe && currentUserId) {
      whereClause.assignedUserId = currentUserId;
    }

    const applications = await db.application.findMany({
      where: whereClause,
      include: {
        candidate: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            resumes: { where: { isDefault: true } },
            education: true,
            experiences: true,
          },
        },
        requirement: {
          include: {
            branch: {
              include: {
                company: true,
              },
            },
          },
        },
        history: {
          orderBy: { changedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications, currentUserId });
  } catch (error: any) {
    console.error("Employee Candidates GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate data." }, { status: 500 });
  }
}

// PATCH: Transition candidate application status (with automated Placement creation on "Joined")
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    if (!["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, toStatus, notes, agreedCtc, joiningDate } = body;

    if (!applicationId || !toStatus) {
      return NextResponse.json(
        { error: "Application ID and target status are required." },
        { status: 400 }
      );
    }

    // Fetch existing application with requirement and branch defaults
    const existingApp = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        requirement: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!existingApp) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Update status and append to audit history in a transaction
    const [updatedApp] = await db.$transaction([
      db.application.update({
        where: { id: applicationId },
        data: { status: toStatus },
      }),
      db.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: existingApp.status,
          toStatus,
          changedByUserId: userId || "SYSTEM",
          notes: notes || `Status transitioned to ${toStatus} by ${userRole}.`,
        },
      }),
    ]);

    // FLOW 3: If candidate reached "Joined", automatically generate Placement and Draft Invoice
    if (toStatus === "Joined") {
      const ctcValue = agreedCtc ? Number(agreedCtc) : (Number(existingApp.requirement.maxSalaryLpa || 5) * 100000);
      const commissionRate = Number(
        existingApp.requirement.commissionRateOverride ||
        existingApp.requirement.branch.defaultCommissionRate ||
        8.33
      );
      const commissionAmount = (ctcValue * commissionRate) / 100;
      const replacementWindowDays =
        existingApp.requirement.replacementWindowDaysOverride ||
        existingApp.requirement.branch.defaultReplacementWindowDays ||
        60;
      const paymentTermsDays =
        existingApp.requirement.paymentTermsDaysOverride ||
        existingApp.requirement.branch.paymentTermsDays ||
        30;

      const placementDate = joiningDate ? new Date(joiningDate) : new Date();

      // Check if placement already exists
      const existingPlacement = await db.placement.findUnique({
        where: { applicationId },
      });

      if (!existingPlacement) {
        const placement = await db.placement.create({
          data: {
            applicationId,
            joiningDate: placementDate,
            agreedCtc: ctcValue,
            commissionRateApplied: commissionRate,
            commissionAmount,
            replacementWindowDaysApplied: replacementWindowDays,
            isActive: true,
            replacementStatus: "None",
          },
        });

        // Auto-create Draft Invoice for Admin Review (unless free replacement)
        if (!existingApp.requirement.isReplacement) {
          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          const dueDate = new Date(placementDate);
          dueDate.setDate(dueDate.getDate() + paymentTermsDays);

          await db.invoice.create({
            data: {
              placementId: placement.id,
              invoiceNumber,
              subtotalAmount: commissionAmount,
              taxAmount: 0,
              totalAmount: commissionAmount,
              paymentTermsDaysApplied: paymentTermsDays,
              dueDate,
              status: "Draft",
            },
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({
      message: `Candidate status updated to ${toStatus} successfully!`,
      application: updatedApp,
    });
  } catch (error: any) {
    console.error("Employee Candidates PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update candidate status." }, { status: 500 });
  }
}
