"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Requirement {
  id: string;
  title: string;
  hiringCategory: string;
  categoryType: string;
  noOfVacancies: number;
  status: string;
  minExperienceYears: number;
  maxSalaryLpa: number | null;
  createdAt: string;
  _count?: { applications: number };
}

export default function CompanyDashboard() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [reqRes, appRes] = await Promise.all([
          fetch("/api/requirements"),
          fetch("/api/applications"),
        ]);
        const reqData = await reqRes.json();
        const appData = await appRes.json();

        if (reqData.requirements) setRequirements(reqData.requirements);
        if (appData.applications) setApplications(appData.applications);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const totalVacancies = requirements.reduce((acc, r) => acc + (r.noOfVacancies || 1), 0);
  const totalApplicants = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === "Shortlisted").length;
  const interviewsCount = applications.filter((a) => a.status === "InterviewScheduled").length;
  const offeredCount = applications.filter((a) => a.status === "Offered" || a.status === "Joined").length;

  return (
    <div style={{ maxWidth: 1120, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
            Employer Hiring Console
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Monitor active hiring mandates, track candidate screening pipelines, and manage interviews.
          </p>
        </div>
        <Link
          href="/company/requirements/new"
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            padding: "12px 22px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>+</span> Post New Mandate
        </Link>
      </div>

      {/* High-Level Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Open Mandates</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{requirements.length}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{totalVacancies} Total Vacancies</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Applicants</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>{totalApplicants}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Curated by RS Bridge</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Shortlisted</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{shortlistedCount}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Under Review</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Interviews Active</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#16A34A", marginTop: 4 }}>{interviewsCount}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{offeredCount} Offers Released</div>
        </div>
      </div>

      {/* Mandates List */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>Active Branch Mandates</h2>
          <span style={{ fontSize: 13, color: "#64748B" }}>Showing all active corporate & driver requirements</span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748B" }}>Loading your requirements...</div>
        ) : requirements.length === 0 ? (
          <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center" }}>
            <h3 style={{ color: "#334155", margin: "0 0 8px" }}>No Job Requirements Posted Yet</h3>
            <p style={{ color: "#64748B", margin: "0 0 20px", fontSize: 14 }}>
              Post your first corporate or driver requirement to start receiving curated candidates.
            </p>
            <Link
              href="/company/requirements/new"
              style={{ background: "#2563EB", color: "#FFF", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}
            >
              Post Requirement →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {requirements.map((req) => {
              const reqApps = applications.filter((a) => a.jobRequirementId === req.id);
              const reqShortlisted = reqApps.filter((a) => a.status === "Shortlisted").length;
              const reqInterviews = reqApps.filter((a) => a.status === "InterviewScheduled").length;

              return (
                <div
                  key={req.id}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>{req.title}</h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: req.status === "Open" ? "#DCFCE7" : "#FEF3C7",
                          color: req.status === "Open" ? "#166534" : "#92400E",
                        }}
                      >
                        {req.status}
                      </span>
                      <span style={{ fontSize: 12, color: "#475569", background: "#E2E8F0", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {req.categoryType} ({req.hiringCategory})
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: "#64748B", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>👥 Vacancies: <strong>{req.noOfVacancies}</strong></span>
                      <span>📥 Total Applicants: <strong>{reqApps.length}</strong></span>
                      <span>⭐ Shortlisted: <strong>{reqShortlisted}</strong></span>
                      <span>📅 Interviews: <strong>{reqInterviews}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/company/requirements/${req.id}`}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#2563EB",
                      padding: "10px 18px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    Manage Pipeline ({reqApps.length}) →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
