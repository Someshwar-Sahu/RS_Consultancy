import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Fetch candidate application pipeline for Employees/Admins
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const applications = await db.application.findMany({
      where: status ? { status: status as any } : {},
      include: {
        candidate: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
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
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error("Employee Candidates GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate pipeline." }, { status: 500 });
  }
}

// PATCH: Transition candidate application status
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    if (!["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, toStatus, notes } = body;

    if (!applicationId || !toStatus) {
      return NextResponse.json(
        { error: "Application ID and target status are required." },
        { status: 400 }
      );
    }

    // Fetch existing application
    const existingApp = await db.application.findUnique({
      where: { id: applicationId },
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
          notes: notes || `Status updated to ${toStatus}`,
        },
      }),
    ]);

    return NextResponse.json({
      message: `Candidate status updated to ${toStatus} successfully!`,
      application: updatedApp,
    });
  } catch (error: any) {
    console.error("Employee Candidates PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update candidate status." }, { status: 500 });
  }
}
