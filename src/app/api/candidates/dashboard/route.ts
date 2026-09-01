import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email?.toLowerCase().trim();

    // Fetch candidate, skills, resumes, and applications in a SINGLE unified DB query
    let candidate = null;
    if (userId) {
      candidate = await db.candidate.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
          resumes: { orderBy: { uploadedAt: "desc" } },
          applications: {
            include: {
              requirement: {
                include: {
                  branch: { include: { company: true } },
                },
              },
              history: { orderBy: { changedAt: "desc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    if (!candidate && email) {
      candidate = await db.candidate.findFirst({
        where: { email },
        include: {
          skills: { include: { skill: true } },
          resumes: { orderBy: { uploadedAt: "desc" } },
          applications: {
            include: {
              requirement: {
                include: {
                  branch: { include: { company: true } },
                },
              },
              history: { orderBy: { changedAt: "desc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    if (!candidate) {
      return NextResponse.json({
        candidate: {
          email,
          fullName: session.user.name || "",
        },
        resumes: [],
        applications: [],
      });
    }

    return NextResponse.json({
      candidate,
      resumes: candidate.resumes || [],
      applications: candidate.applications || [],
    });
  } catch (error: any) {
    console.error("Unified Candidate Dashboard Error:", error);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
