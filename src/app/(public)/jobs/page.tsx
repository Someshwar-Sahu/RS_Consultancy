import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { maskCompanyForViewer } from "@/lib/permissions";
import { JobList, JobItem, ResumeItem } from "@/components/JobList";

export const dynamic = "force-dynamic";

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const { q = "", category = "", city = "" } = (await searchParams) || {};
  const session = await auth();
  const userId = session?.user?.id;

  const userRole = (session?.user as any)?.role;

  // Fetch jobs, candidate resumes, and applied history in parallel
  const [requirements, candidateResumes, existingApplications] = await Promise.all([
    db.jobRequirement.findMany({
      where: { status: "Open" },
      take: 50,
      include: {
        branch: { include: { company: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    userId
      ? db.candidateResume.findMany({
          where: { candidate: { userId } },
          orderBy: { uploadedAt: "desc" },
        })
      : Promise.resolve([]),
    userId
      ? db.application.findMany({
          where: { candidate: { userId } },
          select: { jobRequirementId: true },
        })
      : Promise.resolve([]),
  ]);

  const sanitizedJobs: JobItem[] = requirements.map((job) => {
    const maskedCompany = maskCompanyForViewer(
      {
        companyName: job.branch.company.name,
        brandName: job.branch.company.brandName || job.branch.company.name,
      },
      { role: userRole }
    );

    return {
      id: job.id,
      title: job.title,
      hiringCategory: job.hiringCategory,
      noOfVacancies: job.noOfVacancies,
      minExperienceYears: Number(job.minExperienceYears),
      maxSalaryLpa: job.maxSalaryLpa ? Number(job.maxSalaryLpa) : null,
      city: job.branch.city,
      companyName: maskedCompany.companyName,
      skills: job.skills.map((s) => s.skill.name),
      createdAt: job.createdAt.toISOString(),
    };
  });

  const formattedResumes: ResumeItem[] = candidateResumes.map((r) => ({
    id: r.id,
    label: r.label,
    fileUrl: r.fileUrl,
    isDefault: r.isDefault,
  }));

  const appliedJobIds = existingApplications.map((a) => a.jobRequirementId);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "40px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
            Active Client Job Openings
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Browse verified corporate and commercial fleet mandates managed by RS Bridge Consultancy.
          </p>
        </div>

        <JobList
          initialJobs={sanitizedJobs}
          initialResumes={formattedResumes}
          initialAppliedJobIds={appliedJobIds}
          initialQuery={q}
          initialCategory={category}
        />
      </div>
    </div>
  );
}
