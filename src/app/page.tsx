import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  const dashboardUrl =
    userRole === "ADMIN"
      ? "/admin/dashboard"
      : userRole === "EMPLOYEE"
      ? "/employee/candidates"
      : userRole === "COMPANY_CONTACT"
      ? "/company/dashboard"
      : userRole === "CANDIDATE"
      ? "/candidate/dashboard"
      : "/login";

  // Fetch real database records
  const [openJobsCount, candidatesCount, companiesCount, placementsCount, featuredJobs] = await Promise.all([
    db.jobRequirement.count({ where: { status: "Open" } }),
    db.candidate.count(),
    db.company.count(),
    db.placement.count(),
    db.jobRequirement.findMany({
      where: { status: "Open" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { include: { company: true } },
        skills: { include: { skill: true } },
      },
    }),
  ]);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#0F172A", background: "#FFFFFF" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          padding: "80px 24px 100px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(37, 99, 235, 0.2)",
              color: "#60A5FA",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            ⚡ India&apos;s Leading Enterprise Staffing & Verified Commercial Fleet Partner
          </span>

          <h1
            style={{
              fontSize: "clamp(32px, 5.5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.15,
              margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}
          >
            Empowering Enterprises with Verified Tech Talent & Certified Fleet Drivers
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "#94A3B8",
              maxWidth: 760,
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            RS Bridge Consultancy connects corporate hiring teams and logistics enterprises with pre-screened talent across IT, Sales, Back-Office, and Commercial Drivers with 100% background checks.
          </p>

          {/* Interactive Live Search Bar */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 16,
              padding: 16,
              maxWidth: 820,
              margin: "0 auto 36px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <form
              action="/jobs"
              method="GET"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <input
                type="text"
                name="q"
                placeholder="Job title, skill, or role (e.g. Fullstack, Driver)..."
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 14,
                  color: "#0F172A",
                  background: "#FFFFFF",
                }}
              />

              <select
                name="category"
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 14,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  fontWeight: 500,
                }}
              >
                <option value="">All Categories</option>
                <option value="IT">🏢 IT & Technical</option>
                <option value="Driver">🚚 Commercial Fleet & Driver</option>
                <option value="Sales&Marketing">💼 Sales & Marketing</option>
                <option value="BPO">🎧 BPO & Customer Support</option>
                <option value="BackOffice">📊 Back Office & Admin</option>
              </select>

              <button
                type="submit"
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
                }}
              >
                Search Open Jobs →
              </button>
            </form>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/jobs"
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                padding: "14px 28px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
              }}
            >
              Browse All Open Jobs ({openJobsCount})
            </Link>
            <Link
              href={session?.user ? dashboardUrl : "/companies/inquire"}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "14px 28px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {session?.user ? "Go to My Dashboard →" : "Post Employer Mandate"}
            </Link>
          </div>
        </div>
      </section>

      {/* Real Live Database Performance Metrics Bar */}
      <section style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "32px 24px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 24,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#2563EB" }}>{openJobsCount}</div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700, marginTop: 2 }}>Active Job Mandates</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#0F172A" }}>{candidatesCount}</div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700, marginTop: 2 }}>Verified Candidates in Pool</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#16A34A" }}>{companiesCount}</div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700, marginTop: 2 }}>Corporate Partner Brands</div>
          </div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#D97706" }}>{placementsCount}</div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700, marginTop: 2 }}>Successful Placements</div>
          </div>
        </div>
      </section>

      {/* Live Featured Openings (Queried in Real-Time from Database) */}
      <section style={{ padding: "70px 24px 50px", maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 10px", borderRadius: 12 }}>
              Live Openings
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
              Latest Verified Job Mandates
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
              Updated real-time from active employer hiring mandates.
            </p>
          </div>
          <Link
            href="/jobs"
            style={{ color: "#2563EB", textDecoration: "none", fontWeight: 700, fontSize: 14 }}
          >
            View All Open Vacancies ({openJobsCount}) →
          </Link>
        </div>

        {featuredJobs.length === 0 ? (
          <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 40, textAlign: "center", color: "#64748B" }}>
            No active job openings at the moment.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 8 }}>
                      {job.hiringCategory}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>📍 {job.branch.city}</span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
                    {job.title}
                  </h3>

                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                    <span>👥 {job.noOfVacancies} Openings</span> • <span>💼 Min {Number(job.minExperienceYears)} Yrs Exp</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {job.skills.slice(0, 3).map((s) => (
                      <span key={s.skill.name} style={{ fontSize: 11, background: "#F1F5F9", color: "#334155", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
                        {s.skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: 6 }}>
                    {job.maxSalaryLpa ? `Up to ₹${job.maxSalaryLpa} LPA` : "Competitive"}
                  </span>
                  <Link
                    href={`/jobs?q=${encodeURIComponent(job.title)}`}
                    style={{ background: "#2563EB", color: "#FFF", padding: "6px 14px", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 12 }}
                  >
                    Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3 Core Staffing Verticals */}
      <section style={{ padding: "60px 24px 80px", maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
            Specialized Staffing Verticals
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>
            Dedicated recruitment channels customized for rigorous compliance and rapid fulfillment.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Vertical 1 */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🚚</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Commercial Fleet & Drivers
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
              Pre-screened commercial drivers with verified driving licenses (LMV/HMV) and mandatory police clearance certificates.
            </p>
            <Link href="/jobs?category=Driver" style={{ color: "#2563EB", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Explore Driver Jobs →
            </Link>
          </div>

          {/* Vertical 2 */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🏢</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Corporate & IT Engineering
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
              Technical screening and competency assessments for Full-Stack Developers, Cloud Architects, and DevOps specialists.
            </p>
            <Link href="/jobs?category=IT" style={{ color: "#2563EB", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Explore Tech Jobs →
            </Link>
          </div>

          {/* Vertical 3 */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>💼</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Sales, BPO & Back-Office
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
              High-volume bulk hiring solutions for customer support voice desks, business development, and accounting personnel.
            </p>
            <Link href="/jobs?category=Sales%26Marketing" style={{ color: "#2563EB", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Explore Sales & Operations →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section style={{ background: "#0F172A", color: "#FFFFFF", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 14px" }}>Ready to Accelerate Your Hiring?</h2>
          <p style={{ color: "#94A3B8", fontSize: 15, margin: "0 0 28px" }}>
            Join growing enterprises hiring verified corporate talent and commercial drivers through RS Bridge Consultancy.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/companies/inquire"
              style={{ background: "#2563EB", color: "#FFFFFF", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}
            >
              Post Employer Requirement
            </Link>
            <Link
              href={session?.user ? dashboardUrl : "/login"}
              style={{ background: "#334155", color: "#FFFFFF", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}
            >
              {session?.user ? "Go to My Dashboard →" : "Candidate / Employer Sign In"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
