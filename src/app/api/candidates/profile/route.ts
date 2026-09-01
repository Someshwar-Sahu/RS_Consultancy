import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const userId = session.user.id;

    // 1. Try finding candidate linked directly to this user account
    let candidate = null;
    if (userId) {
      candidate = await db.candidate.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
          resumes: { orderBy: { uploadedAt: "desc" } },
          education: true,
          experiences: true,
        },
      });
    }

    // 2. If not found by userId, find by registered email
    if (!candidate) {
      candidate = await db.candidate.findFirst({
        where: { email },
        include: {
          skills: { include: { skill: true } },
          resumes: { orderBy: { uploadedAt: "desc" } },
          education: true,
          experiences: true,
        },
      });

      // Try linking userId safely if unlinked
      if (candidate && !candidate.userId && userId) {
        try {
          candidate = await db.candidate.update({
            where: { id: candidate.id },
            data: { userId },
            include: {
              skills: { include: { skill: true } },
              resumes: { orderBy: { uploadedAt: "desc" } },
              education: true,
              experiences: true,
            },
          });
        } catch (linkErr) {
          console.warn("Candidate userId link notice:", linkErr);
        }
      }
    }

    if (!candidate) {
      return NextResponse.json({
        candidate: {
          email,
          fullName: session.user.name || "",
        },
      });
    }

    return NextResponse.json({ candidate });
  } catch (error: any) {
    console.error("Get Candidate Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate profile." }, { status: 500 });
  }
}

// PUT / PATCH: Update candidate profile
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const {
      fullName,
      mobile,
      currentLocation,
      preferredJobLocation,
      preferredCategory,
      experienceLevel,
      expectedSalary,
      noticePeriod,
      drivingLicenseNumber,
      dlCategory,
      vehicleTypes,
      policeVerificationStatus,
      skills = [],
    } = body;

    let candidate = await db.candidate.findUnique({ where: { userId } });
    if (!candidate && session.user.email) {
      candidate = await db.candidate.findFirst({
        where: { email: session.user.email.toLowerCase().trim() },
      });
    }

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });
    }

    // Update candidate profile
    const updatedCandidate = await db.candidate.update({
      where: { id: candidate.id },
      data: {
        userId,
        ...(fullName ? { fullName } : {}),
        ...(mobile ? { mobile } : {}),
        currentLocation,
        preferredJobLocation,
        ...(preferredCategory ? { preferredCategory } : {}),
        ...(experienceLevel ? { experienceLevel } : {}),
        expectedSalary,
        noticePeriod,
        drivingLicenseNumber,
        dlCategory,
        vehicleTypes: Array.isArray(vehicleTypes) ? JSON.stringify(vehicleTypes) : vehicleTypes,
        policeVerificationStatus,
      },
    });

    // Update skills if provided
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills) {
        const trimmed = String(skillName).trim();
        if (!trimmed) continue;

        const skill = await db.skill.upsert({
          where: { name: trimmed },
          create: { name: trimmed, category: preferredCategory || candidate.preferredCategory },
          update: {},
        });

        await db.candidateSkill.upsert({
          where: {
            candidateId_skillId: {
              candidateId: candidate.id,
              skillId: skill.id,
            },
          },
          create: {
            candidateId: candidate.id,
            skillId: skill.id,
          },
          update: {},
        });
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully!",
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("Update Candidate Profile Error:", error);
    return NextResponse.json({ error: "Failed to update candidate profile." }, { status: 500 });
  }
}
