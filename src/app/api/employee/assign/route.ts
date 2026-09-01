import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST: Recruiter Matchmaking - Assign candidate to client mandate
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = session?.user?.id;

    if (!session?.user || !["EMPLOYEE", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { candidateId, jobRequirementId, screeningNotes } = await req.json();

    if (!candidateId || !jobRequirementId) {
      return NextResponse.json(
        { error: "Candidate ID and Job Requirement ID are required." },
        { status: 400 }
      );
    }

    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { resumes: { where: { isDefault: true } } },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const requirement = await db.jobRequirement.findUnique({
      where: { id: jobRequirementId },
      include: { branch: { include: { company: true } } },
    });

    if (!requirement || requirement.status !== "Open") {
      return NextResponse.json(
        { error: "Job requirement is not active or open." },
        { status: 400 }
      );
    }

    // Check if application already exists
    const existing = await db.application.findUnique({
      where: {
        candidateId_jobRequirementId: {
          candidateId,
          jobRequirementId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Candidate is already in the pipeline for this position (Current status: ${existing.status}).`,
          applicationId: existing.id,
        },
        { status: 409 }
      );
    }

    const defaultResume = candidate.resumes[0];

    // Create Application directly as Shortlisted (Sourced & Curated by Recruiter)
    const application = await db.application.create({
      data: {
        candidateId,
        jobRequirementId,
        resumeId: defaultResume?.id || null,
        assignedUserId: userId,
        status: "Shortlisted",
        history: {
          create: {
            fromStatus: "Applied",
            toStatus: "Shortlisted",
            changedByUserId: userId || "SYSTEM",
            notes:
              screeningNotes ||
              `Candidate pre-screened, curated, and matched to mandate by RS Bridge Recruiter.`,
          },
        },
      },
      include: {
        candidate: true,
        requirement: {
          include: { branch: { include: { company: true } } },
        },
      },
    });

    // Notify Candidate
    if (candidate.userId) {
      await db.inAppNotification.create({
        data: {
          userId: candidate.userId,
          type: "CANDIDATE_MATCHED",
          title: "New Job Match: Shortlisted!",
          message: `RS Bridge recruiters have curated and matched your profile for ${requirement.title} at ${requirement.branch.company.brandName || "a client partner"}.`,
          linkUrl: "/candidate/applications",
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Successfully matched ${candidate.fullName} to ${requirement.title}!`,
      application,
    });
  } catch (error: any) {
    console.error("Recruiter Matchmaking Error:", error);
    return NextResponse.json(
      { error: "Failed to assign candidate to requirement." },
      { status: 500 }
    );
  }
}
