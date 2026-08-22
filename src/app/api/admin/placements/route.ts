import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, joiningDate, agreedCtc, commissionRate, replacesPlacementId } = body;

    if (!applicationId || !joiningDate || !agreedCtc || !commissionRate) {
      return NextResponse.json(
        { error: "Application ID, Joining Date, Agreed CTC, and Commission Rate are required." },
        { status: 400 }
      );
    }

    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        requirement: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Compute commission amount: CTC * rate / 100
    const ctcNum = Number(agreedCtc);
    const rateNum = Number(commissionRate);
    const commissionAmount = (ctcNum * rateNum) / 100;

    // Create Placement inside a transaction
    const placement = await db.$transaction(async (tx) => {
      // 1. Mark Application as Joined
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "Joined" },
      });

      // 2. Create Placement Record
      const newPlacement = await tx.placement.create({
        data: {
          applicationId,
          joiningDate: new Date(joiningDate),
          agreedCtc: ctcNum,
          commissionRateApplied: rateNum,
          commissionAmount,
          isActive: true,
          replacesPlacementId: replacesPlacementId || null,
        },
      });

      // 3. Rule 4: ONLY create invoice if NOT a free replacement placement
      if (!replacesPlacementId) {
        const taxAmount = (commissionAmount * 18) / 100; // 18% GST standard
        const totalAmount = commissionAmount + taxAmount;
        const paymentDays = application.requirement.branch.paymentTermsDays || 30;

        const dueDate = new Date(joiningDate);
        dueDate.setDate(dueDate.getDate() + paymentDays);

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

        await tx.invoice.create({
          data: {
            placementId: newPlacement.id,
            invoiceNumber,
            subtotalAmount: commissionAmount,
            taxAmount,
            totalAmount,
            paymentTermsDaysApplied: paymentDays,
            dueDate,
            status: "Draft",
          },
        });
      }

      return newPlacement;
    });

    return NextResponse.json(
      {
        message: replacesPlacementId
          ? "Free replacement placement created! (No invoice generated per Rule 4)."
          : "Placement created and draft invoice generated successfully!",
        placement,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Placement Creation Error:", error);
    return NextResponse.json({ error: "Failed to create placement." }, { status: 500 });
  }
}
