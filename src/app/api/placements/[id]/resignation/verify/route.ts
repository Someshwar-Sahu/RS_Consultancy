import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { id: placementId } = await params;
    const body = await req.json().catch(() => ({}));
    const { resignationProofUrl } = body;

    const originalPlacement = await db.placement.findUnique({
      where: { id: placementId },
      include: {
        application: {
          include: {
            requirement: true,
          },
        },
      },
    });

    if (!originalPlacement) {
      return NextResponse.json({ error: "Placement not found." }, { status: 404 });
    }

    // Process resignation & reopen requirement for free replacement inside transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Mark original Placement as inactive and replacement verified
      const updatedPlacement = await tx.placement.update({
        where: { id: placementId },
        data: {
          isActive: false,
          replacementStatus: "AdminVerified",
          resignationProofUrl: resignationProofUrl || null,
          resignationSubmittedAt: new Date(),
        },
      });

      // 2. Reopen job requirement for free replacement hire
      const replacementJob = await tx.jobRequirement.create({
        data: {
          companyBranchId: originalPlacement.application.requirement.companyBranchId,
          title: `[Replacement] ${originalPlacement.application.requirement.title}`,
          hiringCategory: originalPlacement.application.requirement.hiringCategory,
          noOfVacancies: 1,
          status: "Open",
          isReplacement: true,
          replacesPlacementId: placementId,
        },
      });

      return { updatedPlacement, replacementJob };
    });

    return NextResponse.json({
      message: "Resignation verified! Original placement deactivated and replacement requirement reopened.",
      data: result,
    });
  } catch (error: any) {
    console.error("Resignation Verification Error:", error);
    return NextResponse.json({ error: "Failed to process resignation." }, { status: 500 });
  }
}
