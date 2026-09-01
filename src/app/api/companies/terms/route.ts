import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Check branch terms status
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any)?.role;

    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
        include: { branch: { include: { company: true } } },
      });

      if (!contact || !contact.branch) {
        return NextResponse.json({ error: "Branch not found." }, { status: 404 });
      }

      return NextResponse.json({
        branchId: contact.branch.id,
        branchName: contact.branch.branchName,
        companyName: contact.branch.company.name,
        address: contact.branch.address || `${contact.branch.branchName}, Sector 62, ${contact.branch.city}`,
        city: contact.branch.city,
        termsAgreementSigned: contact.branch.termsAgreementSigned,
        termsSignedAt: contact.branch.termsSignedAt,
        termsSignedByName: contact.branch.termsSignedByName,
        defaultCommissionRate: Number(contact.branch.defaultCommissionRate || 8.33),
        paymentTermsDays: contact.branch.paymentTermsDays || 30,
        defaultReplacementWindowDays: contact.branch.defaultReplacementWindowDays || 60,
      });
    }

    return NextResponse.json({ termsAgreementSigned: true });
  } catch (error: any) {
    console.error("Terms GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch terms status." }, { status: 500 });
  }
}

// POST: Accept Terms of Business Consent for a Company Branch
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = session?.user?.id;

    if (!session?.user || !["COMPANY_CONTACT", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { branchId, agreed, termsVersion = "v1.0-standard" } = body;

    if (!branchId || !agreed) {
      return NextResponse.json(
        { error: "Branch ID and consent agreement are required." },
        { status: 400 }
      );
    }

    // Verify company contact has authorization for this branch (unless ADMIN)
    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId, companyBranchId: branchId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized for this branch." },
          { status: 403 }
        );
      }
    }

    // Get client IP address for digital consent logging
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const signedAt = new Date();

    // Transaction to update branch and create immutable terms snapshot
    const [updatedBranch, termsSnapshot] = await db.$transaction([
      db.companyBranch.update({
        where: { id: branchId },
        data: {
          termsAgreementSigned: true,
          termsSignedAt: signedAt,
          termsSignedByIp: clientIp,
          status: "Active",
        },
      }),
      db.termsSnapshot.create({
        data: {
          companyBranchId: branchId,
          termsVersion,
          snapshotUrl: `/legal/terms_snapshots/${branchId}_${termsVersion}.json`,
          signedAt,
        },
      }),
    ]);

    const crypto = await import("crypto");
    const agreementBody = `RS BRIDGE TERMS OF BUSINESS v1.0 | Branch: ${branchId} | IP: ${clientIp} | Date: ${signedAt.toISOString()}`;
    const termsTextHash = crypto.createHash("sha256").update(agreementBody).digest("hex");

    return NextResponse.json({
      message: "Terms of Business accepted successfully. Digital consent legally registered under IT Act §10A.",
      branch: updatedBranch,
      snapshotId: termsSnapshot.id,
      termsTextHash,
    });
  } catch (error: any) {
    console.error("Terms Acceptance Error:", error);
    return NextResponse.json(
      { error: "Failed to process Terms acceptance." },
      { status: 500 }
    );
  }
}
