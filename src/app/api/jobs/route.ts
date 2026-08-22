import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maskCompanyForViewer } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Fetch open job requirements
    const requirements = await db.jobRequirement.findMany({
      where: {
        status: "Open",
        ...(category ? { hiringCategory: category as any } : {}),
      },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply Anti-Disintermediation Masking: Mask company identity from candidates
    const sanitizedJobs = requirements.map((job) => {
      const maskedCompany = maskCompanyForViewer(
        {
          companyName: job.branch.company.name,
          brandName: job.branch.company.brandName || job.branch.company.name,
        },
        { role: "CANDIDATE" }
      );

      return {
        id: job.id,
        title: job.title,
        hiringCategory: job.hiringCategory,
        noOfVacancies: job.noOfVacancies,
        minExperienceYears: Number(job.minExperienceYears),
        maxSalaryLpa: job.maxSalaryLpa ? Number(job.maxSalaryLpa) : null,
        city: job.branch.city,
        companyName: maskedCompany.companyName, // Renders as "[Confidential Client]"
        skills: job.skills.map((s) => s.skill.name),
        createdAt: job.createdAt,
      };
    });

    return NextResponse.json({ jobs: sanitizedJobs });
  } catch (error: any) {
    console.error("Public Jobs API Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}
