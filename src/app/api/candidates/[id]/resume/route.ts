import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateCandidateResumePdf } from "@/lib/pdf";
import { ViewerContext } from "@/lib/permissions";
import { getFile } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const { searchParams } = new URL(req.url);
    const requestedType = searchParams.get("type") || "branded"; // "branded" | "raw"

    const userRole = (session.user as any)?.role;
    const userId = session.user.id;

    // Fetch candidate with all related data
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: {
        skills: {
          include: { skill: true },
        },
        education: true,
        experiences: true,
        resumes: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const viewerContext: ViewerContext = {
      role: userRole,
    };

    let companyCanUnmask = false;

    // If viewer is COMPANY_CONTACT, verify branch permissions
    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
        include: { branch: true },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Forbidden: No company contact profile found." },
          { status: 403 }
        );
      }

      viewerContext.companyBranchId = contact.companyBranchId;
      viewerContext.termsSigned = contact.branch.termsAgreementSigned;

      const application = await db.application.findFirst({
        where: {
          candidateId: candidate.id,
          requirement: {
            companyBranchId: contact.companyBranchId,
          },
        },
      });

      if (!application) {
        return NextResponse.json(
          { error: "Forbidden: Candidate is not associated with any mandate at your company branch." },
          { status: 403 }
        );
      }

      viewerContext.applicationStatus = application.status;
      const isInterviewOrLater = ["InterviewScheduled", "Offered", "Joined"].includes(application.status);
      companyCanUnmask = isInterviewOrLater && Boolean(contact.branch.termsAgreementSigned);
    }

    // Check if user is the candidate themselves
    const isSelfCandidate =
      userRole === "CANDIDATE" &&
      (candidate.userId === userId ||
        candidate.email?.toLowerCase() === session.user.email?.toLowerCase());

    // -------------------------------------------------------------
    // OPTION 1: SERVE RAW UPLOADED RESUME FILE (DEFAULT IF AVAILABLE)
    // -------------------------------------------------------------
    const canAccessRaw =
      userRole === "ADMIN" ||
      userRole === "EMPLOYEE" ||
      isSelfCandidate ||
      companyCanUnmask;

    // Find uploaded file URL from candidate record or resumes relation
    const targetFileUrl =
      candidate.resumeUrl || (candidate as any).resumes?.[0]?.fileUrl;

    // If candidate has an uploaded resume, and raw access is allowed,
    // and viewer didn't explicitly ask for "?type=branded", serve the real uploaded PDF!
    if (targetFileUrl && canAccessRaw && requestedType !== "branded") {
      const rawBuffer = await getFile(targetFileUrl);
      if (rawBuffer) {
        return new Response(rawBuffer as any, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="resume_${candidate.fullName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_")}.pdf"`,
            "X-Resume-Type": "raw",
          },
        });
      }
    }

    // -------------------------------------------------------------
    // OPTION 2: ON-DEMAND BRANDED PDF GENERATION (MASKED OR UNMASKED)
    // -------------------------------------------------------------
    // Extract complete structured data from uploaded resume if available
    let parsedData: any = {
      education: [],
      projects: [],
      achievements: [],
      skills: {},
      experiences: [],
    };

    if (targetFileUrl) {
      const rawBuffer = await getFile(targetFileUrl);
      if (rawBuffer) {
        const { parseResumePdf } = await import("@/lib/resumeParser");
        parsedData = await parseResumePdf(rawBuffer);
      }
    }

    const educationList =
      candidate.education && candidate.education.length > 0
        ? candidate.education
        : parsedData.education || [];

    const experiencesList =
      candidate.experiences && candidate.experiences.length > 0
        ? candidate.experiences
        : parsedData.experiences || [];

    const skillsData =
      parsedData.skills &&
      (Array.isArray(parsedData.skills)
        ? parsedData.skills.length > 0
        : Object.keys(parsedData.skills).length > 0)
        ? parsedData.skills
        : candidate.skills.map((s) => s.skill.name);

    const resumeData = {
      id: candidate.id,
      fullName: candidate.fullName,
      mobile: candidate.mobile,
      email: candidate.email,
      currentLocation: candidate.currentLocation,
      preferredJobLocation: candidate.preferredJobLocation,
      experienceLevel: candidate.experienceLevel,
      totalExperienceYears: candidate.totalExperienceYears
        ? Number(candidate.totalExperienceYears)
        : null,
      preferredCategory: candidate.preferredCategory,
      expectedSalary: candidate.expectedSalary,
      noticePeriod: candidate.noticePeriod,
      skills: skillsData,
      education: educationList,
      projects: parsedData.projects || [],
      achievements: parsedData.achievements || [],
      experiences: experiencesList,
      licenseType:
        candidate.preferredCategory === "Driver"
          ? "Commercial LMV / Heavy Transport"
          : undefined,
      vehicleTypes:
        candidate.preferredCategory === "Driver"
          ? ["Heavy Commercial Truck", "Delivery Van"]
          : undefined,
      policeVerificationAvailable: true,
    };

    const { buffer, isMasked, filename } = generateCandidateResumePdf(
      resumeData,
      viewerContext
    );

    return new Response(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Resume-Masked": isMasked ? "true" : "false",
        "X-Resume-Type": "branded",
      },
    });
  } catch (error: any) {
    console.error("Resume PDF Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume PDF." },
      { status: 500 }
    );
  }
}
