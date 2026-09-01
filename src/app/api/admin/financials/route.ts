import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    // Fetch all placements with applications, candidates, requirements, and invoices
    const placements = await db.placement.findMany({
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
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

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

    let totalRevenue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;

    for (const p of placements) {
      const comm = Number(p.commissionAmount || 0);
      totalRevenue += comm;

      if (p.invoice) {
        const invTotal = Number(p.invoice.totalAmount || 0);
        if (p.invoice.status === "Paid") {
          paidAmount += invTotal;
        } else {
          pendingAmount += invTotal;
        }
      } else {
        pendingAmount += comm;
      }
    }

    const financials = {
      totalRevenue,
      paidAmount,
      pendingAmount,
      placementsCount: placements.filter((p) => p.isActive).length,
    };

    return NextResponse.json({
      financials,
      placements,
      invoices,
    });
  } catch (error: any) {
    console.error("Admin Financials GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch financial records." }, { status: 500 });
  }
}
