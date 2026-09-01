import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("id");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (!["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const whereClause: any = {};
    if (candidateId) {
      whereClause.id = candidateId;
    }
    if (category && category !== "ALL") {
      whereClause.preferredCategory = category as any;
    }
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { currentLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    const candidates = await db.candidate.findMany({
      where: whereClause,
      include: {
        skills: { include: { skill: true } },
        resumes: { orderBy: { uploadedAt: "desc" } },
        education: true,
        experiences: true,
        applications: {
          include: {
            requirement: {
              include: { branch: { include: { company: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error("Candidates GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates." }, { status: 500 });
  }
}
