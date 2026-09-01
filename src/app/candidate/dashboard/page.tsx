import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CandidateDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any)?.role;
  if (userRole === "ADMIN") {
    redirect("/admin/dashboard");
  } else if (userRole === "EMPLOYEE") {
    redirect("/employee/candidates");
  } else if (userRole === "COMPANY_CONTACT") {
    redirect("/company/dashboard");
  }

  const userId = session.user.id;
  const candidate = await db.candidate.findUnique({
    where: { userId },
    include: {
      resumes: true,
      applications: {
        include: {
          requirement: {
            include: {
              branch: { include: { company: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!candidate) {
    redirect("/candidate/profile");
  }

  const applications = candidate.applications || [];
  const activeApps = applications.filter((a) => !["Rejected", "Withdrawn"].includes(a.status));
  const interviews = applications.filter((a) => a.status === "InterviewScheduled");

  return (
    <div style={{ maxWidth: 1080, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
            Candidate Career Hub
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Welcome back, {candidate.fullName}! Track your application progress and explore verified client openings.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/candidate/profile"
            style={{ background: "#F1F5F9", color: "#0F172A", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}
          >
            👤 Candidate Profile
          </Link>
          <Link
            href="/candidate/resumes"
            style={{ background: "#F1F5F9", color: "#0F172A", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}
          >
            📄 Manage CVs ({candidate.resumes.length})
          </Link>
          <Link
            href="/jobs"
            style={{ background: "#2563EB", color: "#FFF", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 6px rgba(37,99,235,0.2)" }}
          >
            Explore Jobs →
          </Link>
        </div>
      </div>

      {/* RS Bridge Consultancy Career Advantage Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "#FFFFFF",
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <span style={{ background: "rgba(37,99,235,0.3)", color: "#93C5FD", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "inline-block", marginBottom: 10 }}>
            RS Bridge Career Guarantee
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
            100% Direct Enterprise Interviews With Zero Candidate Placement Fees
          </h2>
          <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            All applications are directly reviewed by verified corporate hiring managers and fleet operations teams with guaranteed salary transparency.
          </p>
        </div>
        <div>
          <Link
            href="/jobs"
            style={{
              background: "#2563EB",
              color: "#FFF",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              display: "inline-block",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            }}
          >
            Browse Matching Jobs
          </Link>
        </div>
      </div>

      {/* Application Snapshot Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Active Applications</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>{activeApps.length}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>In Review & Shortlist</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Scheduled Interviews</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#16A34A", marginTop: 4 }}>{interviews.length}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Direct Client Rounds</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Attached CVs</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{candidate.resumes.length}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Stored Versions</div>
        </div>
      </div>

      {/* Upcoming Section Banner */}
      <div
        style={{
          background: "#F8FAFC",
          border: "1px dashed #CBD5E1",
          borderRadius: 14,
          padding: "36px 24px",
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: "0 0 6px" }}>
          AI Job Recommendations & Career Analytics Dashboard
        </h3>
        <p style={{ color: "#64748B", fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
          Personalized skill matching metrics, interview coaching guides, and salary benchmarks will appear here in future updates.
        </p>
      </div>

      {/* Recent Applications List */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>Recent Applications</h2>
          <Link href="/candidate/applications" style={{ fontSize: 13, color: "#2563EB", textDecoration: "none", fontWeight: 700 }}>
            View Full History →
          </Link>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 36, color: "#64748B", background: "#F8FAFC", borderRadius: 8, border: "1px dashed #CBD5E1", fontSize: 14 }}>
            You have not applied for any jobs yet. Browse open corporate and driver vacancies to apply with 1 click.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                style={{
                  padding: "14px 18px",
                  border: "1px solid #F1F5F9",
                  borderRadius: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#F8FAFC",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 15 }}>{app.requirement?.title || "Job Application"}</div>
                  <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 12,
                    background:
                      app.status === "InterviewScheduled"
                        ? "#DCFCE7"
                        : app.status === "Shortlisted"
                        ? "#FEF3C7"
                        : app.status === "Offered"
                        ? "#F3E8FF"
                        : "#EFF6FF",
                    color:
                      app.status === "InterviewScheduled"
                        ? "#166534"
                        : app.status === "Shortlisted"
                        ? "#92400E"
                        : app.status === "Offered"
                        ? "#6B21A8"
                        : "#1D4ED8",
                  }}
                >
                  ● {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
