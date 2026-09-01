"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  requirement: {
    title: string;
    hiringCategory: string;
    branch: {
      city: string;
      company: {
        name: string;
      };
    };
  };
  history?: Array<{ notes: string; changedAt: string; toStatus: string }>;
}

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Decline Modal
  const [declineApp, setDeclineApp] = useState<{ id: string; type: "interview" | "offer"; title: string } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmInterview(appId: string) {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          status: "InterviewScheduled",
          notes: "Candidate confirmed attendance for the scheduled interview.",
        }),
      });
      if (res.ok) {
        alert("✅ Thank you! Your interview attendance has been confirmed to the employer.");
        loadApplications();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAcceptOffer(appId: string) {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          status: "Offered",
          notes: "Candidate accepted the job offer and confirmed readiness for onboarding.",
        }),
      });
      if (res.ok) {
        alert("🎉 Congratulations! You have accepted the job offer. Your recruiter will contact you for joining paperwork.");
        loadApplications();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeclineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!declineApp || !declineReason.trim()) return;

    setDeclining(true);
    try {
      const noteText =
        declineApp.type === "interview"
          ? `Candidate declined interview / requested reschedule: ${declineReason}`
          : `Candidate declined job offer: ${declineReason}`;

      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: declineApp.id,
          status: "Withdrawn",
          notes: noteText,
        }),
      });

      if (res.ok) {
        alert(`Application status updated to Withdrawn. Recruiter and hiring team notified.`);
        setDeclineApp(null);
        setDeclineReason("");
        loadApplications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeclining(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
              My Applications & Interviews
            </h1>
            <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
              Track interview invitations, job offers, and application status in real-time.
            </p>
          </div>
          <Link
            href="/jobs"
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              padding: "10px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            + Browse More Jobs
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748B" }}>Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <p style={{ color: "#475569", fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>
            No Active Applications Yet
          </p>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 16px" }}>
            You haven&apos;t applied for any positions yet.
          </p>
          <Link
            href="/jobs"
            style={{ display: "inline-block", background: "#2563EB", color: "#FFFFFF", padding: "9px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}
          >
            Explore Job Openings →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {applications.map((app) => {
            const isInterview = app.status === "InterviewScheduled";
            const isOffered = app.status === "Offered";
            const isJoined = app.status === "Joined";
            const isWithdrawn = app.status === "Withdrawn";
            const latestNote = app.history && app.history[0]?.notes;

            return (
              <div
                key={app.id}
                style={{
                  background: "#FFFFFF",
                  border: isJoined
                    ? "2px solid #86EFAC"
                    : isOffered
                    ? "2px solid #D8B4FE"
                    : isInterview
                    ? "2px solid #93C5FD"
                    : isWithdrawn
                    ? "1px solid #E2E8F0"
                    : "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  opacity: isWithdrawn ? 0.75 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#EFF6FF", color: "#1D4ED8" }}>
                      {app.requirement.hiringCategory}
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                      {app.requirement.title}
                    </h2>
                    <div style={{ fontSize: 13, color: "#64748B" }}>
                      🏢 Employer: <strong>{app.requirement.branch.company.name}</strong> ({app.requirement.branch.city}) • Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 13,
                        fontWeight: 800,
                        padding: "6px 16px",
                        borderRadius: 20,
                        background: isJoined
                          ? "#DCFCE7"
                          : isOffered
                          ? "#F3E8FF"
                          : isInterview
                          ? "#DCFCE7"
                          : app.status === "Shortlisted"
                          ? "#FEF3C7"
                          : app.status === "Withdrawn"
                          ? "#F1F5F9"
                          : app.status === "Rejected"
                          ? "#FEE2E2"
                          : "#EFF6FF",
                        color: isJoined
                          ? "#15803D"
                          : isOffered
                          ? "#6B21A8"
                          : isInterview
                          ? "#166534"
                          : app.status === "Shortlisted"
                          ? "#92400E"
                          : app.status === "Withdrawn"
                          ? "#64748B"
                          : app.status === "Rejected"
                          ? "#B91C1C"
                          : "#1D4ED8",
                      }}
                    >
                      {isJoined
                        ? "🏆 Placed & Joined!"
                        : isOffered
                        ? "🎉 Job Offer Extended"
                        : isInterview
                        ? "🗓️ Interview Scheduled"
                        : app.status === "Shortlisted"
                        ? "⭐ Recruiter Shortlisted"
                        : app.status === "Withdrawn"
                        ? "Withdrawn"
                        : app.status}
                    </span>
                  </div>
                </div>

                {/* 1. INTERVIEW SCHEDULED PROMINENT CARD & CANDIDATE ACTIONS */}
                {isInterview && (
                  <div style={{ marginTop: 18, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>📅</span>
                      <strong style={{ color: "#166534", fontSize: 15 }}>
                        Interview Invitation Details:
                      </strong>
                    </div>

                    <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.6, marginBottom: 14 }}>
                      {latestNote || "Interview has been scheduled with the employer team."}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      {latestNote && latestNote.includes("http") && (
                        <a
                          href={latestNote.match(/https?:\/\/[^\s\)]+/)?.[0] || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: "#16A34A",
                            color: "#FFF",
                            padding: "8px 16px",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          Join Video Interview ↗
                        </a>
                      )}

                      <button
                        onClick={() => handleConfirmInterview(app.id)}
                        style={{
                          background: "#059669",
                          color: "#FFF",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Confirm Attendance
                      </button>

                      <button
                        onClick={() =>
                          setDeclineApp({
                            id: app.id,
                            type: "interview",
                            title: app.requirement.title,
                          })
                        }
                        style={{
                          background: "#FFFFFF",
                          color: "#B91C1C",
                          border: "1px solid #FCA5A5",
                          padding: "8px 14px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✕ Decline / Request Reschedule
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. OFFER EXTENDED CARD & CANDIDATE ACTIONS */}
                {isOffered && (
                  <div style={{ marginTop: 18, background: "#FAF5FF", border: "1px solid #D8B4FE", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>🎉</span>
                      <strong style={{ color: "#6B21A8", fontSize: 15 }}>
                        Official Job Offer Extended!
                      </strong>
                    </div>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#4A044E", lineHeight: 1.5 }}>
                      {latestNote || "The employer has extended a formal job offer. Please accept or decline below:"}
                    </p>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleAcceptOffer(app.id)}
                        style={{
                          background: "#6B21A8",
                          color: "#FFF",
                          border: "none",
                          padding: "9px 18px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(107,33,168,0.25)",
                        }}
                      >
                        🎉 Accept Job Offer
                      </button>

                      <button
                        onClick={() =>
                          setDeclineApp({
                            id: app.id,
                            type: "offer",
                            title: app.requirement.title,
                          })
                        }
                        style={{
                          background: "#FFFFFF",
                          color: "#991B1B",
                          border: "1px solid #FCA5A5",
                          padding: "9px 16px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✕ Decline Offer
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. JOINED / PLACED CARD */}
                {isJoined && (
                  <div style={{ marginTop: 18, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🏆</span>
                      <div>
                        <strong style={{ color: "#15803D", fontSize: 15, display: "block" }}>
                          Placement Confirmed — Welcome to {app.requirement.branch.company.name}!
                        </strong>
                        <span style={{ fontSize: 13, color: "#166534" }}>
                          {latestNote || "Placement finalized with RS Bridge Consultancy."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AUDIT TIMELINE */}
                {app.history && app.history.length > 0 && (
                  <div style={{ marginTop: 18, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                      Application Timeline & Updates:
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {app.history.map((h, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: "#64748B", display: "flex", gap: 8 }}>
                          <span>•</span>
                          <span>
                            <strong style={{ color: "#334155" }}>{h.toStatus}</strong>
                            {h.notes ? ` — ${h.notes}` : ""}
                            <span style={{ color: "#94A3B8", marginLeft: 6 }}>
                              ({new Date(h.changedAt).toLocaleDateString()})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DECLINE MODAL */}
      {declineApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
              {declineApp.type === "interview" ? "Decline Interview / Request Reschedule" : "Decline Job Offer"}
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 16px" }}>
              For position: <strong>{declineApp.title}</strong>. Please provide a reason to inform your recruiter and the employer:
            </p>

            <form onSubmit={handleDeclineSubmit}>
              <textarea
                required
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={
                  declineApp.type === "interview"
                    ? "e.g. Unavailable at this time slot, requesting reschedule to Friday 3 PM / Accepted another position."
                    : "e.g. Offered CTC is below current expectation / Location constraints / Accepted competing offer."
                }
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13, marginBottom: 16 }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeclineApp(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={declining || !declineReason.trim()}
                  style={{ background: "#B91C1C", color: "#FFF", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: declining ? "not-allowed" : "pointer" }}
                >
                  {declining ? "Submitting..." : "Submit & Withdraw"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
