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

    const ctcNum = Number(agreedCtc);
    const rateNum = Number(commissionRate);

    // Enforce minimum placement fee floor (e.g. ₹25,000 minimum fee)
    const MIN_PLACEMENT_FLOOR = 25000;
    const computedCommission = (ctcNum * rateNum) / 100;
    const commissionAmount = Math.max(computedCommission, MIN_PLACEMENT_FLOOR);

    const { sourcingUserId, accountManagerUserId, signOnBonusIncluded, noticeBuyoutIncluded } = body;

    // Create Placement inside a transaction
    const placement = await db.$transaction(async (tx) => {
      // 1. Mark Application as Joined
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "Joined" },
      });

      // 2. Create Placement Record with split commission assignment
      const newPlacement = await tx.placement.create({
        data: {
          applicationId,
          joiningDate: new Date(joiningDate),
          agreedCtc: ctcNum,
          commissionRateApplied: rateNum,
          commissionAmount,
          isActive: true,
          replacesPlacementId: replacesPlacementId || null,
          sourcingUserId: sourcingUserId || null,
          accountManagerUserId: accountManagerUserId || null,
          signOnBonusIncluded: Boolean(signOnBonusIncluded),
          noticeBuyoutIncluded: Boolean(noticeBuyoutIncluded),
        },
      });

      // Enforce 15% gross margin floor check unless explicit fee floor of 25k is met
      if (Number(commissionRate) < 15.0 && Number(commissionAmount) < 25000) {
        return NextResponse.json(
          { error: "Commercial Margin Floor Violation: Minimum agency placement commission is 15% CTC or ₹25,000." },
          { status: 400 }
        );
      }

      // 3. Rule 4: ONLY create invoice if NOT a free replacement placement
      if (!replacesPlacementId) {
        const clientCity = (application.requirement.branch.city || "").toLowerCase();
        // Determine tax type: Delhi/NCR agency headquarters (Intra-state = CGST+SGST, Inter-state = IGST)
        const isIntraState = clientCity.includes("delhi") || clientCity.includes("ncr") || clientCity.includes("new delhi");
        const taxType = isIntraState ? "CGST_SGST" : "IGST";
        const cgstAmount = isIntraState ? (commissionAmount * 9) / 100 : null;
        const sgstAmount = isIntraState ? (commissionAmount * 9) / 100 : null;
        const igstAmount = !isIntraState ? (commissionAmount * 18) / 100 : null;
        const taxAmount = (commissionAmount * 18) / 100; // 18% GST standard
        const totalAmount = commissionAmount + taxAmount;
        const paymentDays = application.requirement.branch.paymentTermsDays || 30;

        const dueDate = new Date(joiningDate);
        dueDate.setDate(dueDate.getDate() + paymentDays);

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `INV-${Date.now()}-${randomSuffix}`;

        const crypto = await import("crypto");
        const irnRawStr = `${invoiceNumber}|07AAAAA0000A1Z5|${totalAmount.toFixed(2)}|${Date.now()}`;
        const irnReference = crypto.createHash("sha256").update(irnRawStr).digest("hex");

        await tx.invoice.create({
          data: {
            placementId: newPlacement.id,
            invoiceNumber,
            subtotalAmount: commissionAmount,
            taxType,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
            totalAmount,
            paymentTermsDaysApplied: paymentDays,
            dueDate,
            status: "Draft",
          },
        });
      }

      // 4. Atomically increment vacanciesFilled on parent JobRequirement
      await tx.jobRequirement.update({
        where: { id: application.jobRequirementId },
        data: {
          vacanciesFilled: { increment: 1 },
        },
      });

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
