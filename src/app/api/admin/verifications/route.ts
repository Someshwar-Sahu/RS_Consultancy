import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Fetch all pending CompanyContacts needing Admin approval
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const pendingContacts = await db.companyContact.findMany({
      where: { isApproved: false },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts: pendingContacts });
  } catch (error: any) {
    console.error("Admin Verification GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch pending contacts." }, { status: 500 });
  }
}

// PATCH: Approve a pending CompanyContact
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { contactId, approve } = body;

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required." }, { status: 400 });
    }

    // Update approval status
    const updatedContact = await db.companyContact.update({
      where: { id: contactId },
      data: { isApproved: Boolean(approve) },
    });

    return NextResponse.json({
      message: approve ? "Company Contact approved successfully!" : "Contact rejected.",
      contact: updatedContact,
    });
  } catch (error: any) {
    console.error("Admin Verification PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update verification status." }, { status: 500 });
  }
}
