import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import crypto from "crypto";

// GET: Query all invoices with placement & candidate info
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user || !["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const invoices = await db.invoice.findMany({
      include: {
        placement: {
          include: {
            application: {
              include: {
                candidate: true,
                requirement: {
                  include: {
                    branch: {
                      include: { company: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedInvoices = invoices.map((inv) => {
      const irnReference = crypto
        .createHash("sha256")
        .update(`${inv.id}|${inv.invoiceNumber}|${inv.totalAmount}|${inv.createdAt.toISOString()}`)
        .digest("hex");

      return {
        ...inv,
        irnReference,
        rcmDeclaration: "Tax is payable on Forward Charge basis. Reverse Charge (RCM) is NOT applicable.",
        legalDisclaimer: "Issued under Rule 46 of CGST Rules 2017 & E-Invoicing Notification No. 13/2020.",
      };
    });

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error: any) {
    console.error("Invoices GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices." }, { status: 500 });
  }
}

// PATCH: Update invoice status (e.g. mark as Sent, Paid, or Cancelled)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, status, paymentSource, paidDate, partialPaidAmount, tdsDeducted } = body;

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Invoice ID and status are required." }, { status: 400 });
    }

    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        ...(paidDate ? { paidDate: new Date(paidDate) } : status === "Paid" ? { paidDate: new Date() } : {}),
        ...(paymentSource ? { paymentSource } : {}),
        ...(partialPaidAmount !== undefined ? { partialPaidAmount: Number(partialPaidAmount) } : {}),
        ...(tdsDeducted !== undefined ? { tdsDeducted: Number(tdsDeducted) } : {}),
      },
    });

    return NextResponse.json({
      message: `Invoice marked as ${status} successfully!`,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Invoice PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update invoice status." }, { status: 500 });
  }
}
