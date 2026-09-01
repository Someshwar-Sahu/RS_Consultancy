"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  assignedUserId: string | null;
  createdAt: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    mobile: string;
    experienceLevel: string;
    totalExperienceYears: number | null;
    currentLocation: string | null;
    preferredCategory: string;
    skills: { skill: { name: string } }[];
  };
  history?: Array<{ notes: string; changedAt: string; toStatus: string }>;
}

interface TermsStatus {
  branchId?: string;
  branchName?: string;
  companyName?: string;
  termsAgreementSigned: boolean;
  termsSignedAt?: string;
  termsSignedByName?: string;
  defaultCommissionRate?: number;
  paymentTermsDays?: number;
  defaultReplacementWindowDays?: number;
}

export default function RequirementApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: requirementId } = use(params);
  const [applications, setApplications] = useState<Application[]>([]);
  const [requirementTitle, setRequirementTitle] = useState("Applicant Pipeline");
  const [loading, setLoading] = useState(true);
  const [termsStatus, setTermsStatus] = useState<TermsStatus | null>(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);

  // Filters
  const [filterExp, setFilterExp] = useState<"ALL" | "Fresher" | "Intermediate" | "Expert">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSkill, setFilterSkill] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals for Actions
  const [interviewModalApp, setInterviewModalApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("11:00");
  const [interviewMode, setInterviewMode] = useState<"online" | "offline">("online");
  const [meetingLinkOrVenue, setMeetingLinkOrVenue] = useState("");
  const [roundName, setRoundName] = useState("Technical Round 1");
  const [interviewNotes, setInterviewNotes] = useState("");

  const [offerModalApp, setOfferModalApp] = useState<Application | null>(null);
  const [offeredCtc, setOfferedCtc] = useState("");
  const [offerJoiningDate, setOfferJoiningDate] = useState("");
  const [offerNotes, setOfferNotes] = useState("");

  const [joinedModalApp, setJoinedModalApp] = useState<Application | null>(null);
  const [agreedCtc, setAgreedCtc] = useState("");
  const [actualJoiningDate, setActualJoiningDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setInterviewModalApp(null);
        setOfferModalApp(null);
        setJoinedModalApp(null);
        setTermsModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requirementId]);

  async function loadData() {
    setLoading(true);
    try {
      const appRes = await fetch("/api/applications");
      const appData = await appRes.json();
      if (appData.applications) {
        const filtered = appData.applications.filter((a: any) => a.jobRequirementId === requirementId);
        setApplications(filtered);
        if (filtered.length > 0 && filtered[0].requirement?.title) {
          setRequirementTitle(filtered[0].requirement.title);
        }
      }

      const termsRes = await fetch("/api/companies/terms");
      const termsData = await termsRes.json();
      setTermsStatus(termsData);
    } catch (err) {
      console.error("Error loading pipeline data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Schedule Interview Submission
  async function handleConfirmScheduleInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!interviewModalApp) return;

    if (!termsStatus?.termsAgreementSigned) {
      alert("⚠️ Please accept the Terms of Business agreement before scheduling an interview.");
      setTermsModalOpen(true);
      return;
    }

    setActionLoadingId(interviewModalApp.id);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: interviewModalApp.id,
          status: "InterviewScheduled",
          interviewDate,
          interviewTime,
          interviewMode,
          meetingLinkOrVenue,
          roundName,
          notes: interviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule interview.");

      setApplications((prev) =>
        prev.map((app) => (app.id === interviewModalApp.id ? { ...app, status: "InterviewScheduled" } : app))
      );
      setInterviewModalApp(null);
      alert(`✅ Interview scheduled for ${interviewModalApp.candidate.fullName}! Notification delivered to candidate.`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Extend Offer Submission
  async function handleConfirmExtendOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerModalApp) return;

    setActionLoadingId(offerModalApp.id);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: offerModalApp.id,
          status: "Offered",
          offeredCtc: Number(offeredCtc),
          joiningDate: offerJoiningDate,
          notes: offerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extend offer.");

      setApplications((prev) =>
        prev.map((app) => (app.id === offerModalApp.id ? { ...app, status: "Offered" } : app))
      );
      setOfferModalApp(null);
      alert(`🎉 Job Offer extended to ${offerModalApp.candidate.fullName}!`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Confirm Placement / Joined Submission
  async function handleConfirmPlacementJoined(e: React.FormEvent) {
    e.preventDefault();
    if (!joinedModalApp) return;

    setActionLoadingId(joinedModalApp.id);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: joinedModalApp.id,
          status: "Joined",
          agreedCtc: Number(agreedCtc),
          joiningDate: actualJoiningDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm placement.");

      setApplications((prev) =>
        prev.map((app) => (app.id === joinedModalApp.id ? { ...app, status: "Joined" } : app))
      );
      setJoinedModalApp(null);
      alert(`🏆 Placement finalized! ${joinedModalApp.candidate.fullName} is placed. Invoice generated for Admin.`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStatusChange(applicationId: string, newStatus: string) {
    setActionLoadingId(applicationId);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update candidate status.");
        return;
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSignTerms(e: React.FormEvent) {
    e.preventDefault();
    if (!termsStatus?.branchId) return;
    setSigning(true);
    try {
      const res = await fetch("/api/companies/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: termsStatus.branchId,
          agreed: true,
          termsVersion: "2026-v1.0-standard",
        }),
      });
      if (res.ok) {
        setTermsModalOpen(false);
        setTermsStatus((prev) => (prev ? { ...prev, termsAgreementSigned: true, termsSignedByName: signerName } : null));
        alert("Terms of Business signed successfully! Candidate contacts unlock on interview scheduling.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  }

  const allSkills = Array.from(
    new Set(applications.flatMap((app) => app.candidate.skills?.map((s) => s.skill.name) || []))
  ).sort();

  const filtered = applications.filter((app) => {
    const candidateExp = app.candidate.experienceLevel;

    if (filterExp === "Intermediate" && candidateExp === "Fresher") return false;
    if (filterExp === "Expert" && candidateExp !== "Expert") return false;

    if (filterStatus !== "ALL" && app.status !== filterStatus) return false;

    if (filterSkill !== "ALL") {
      const hasSkill = app.candidate.skills?.some((s) => s.skill.name === filterSkill);
      if (!hasSkill) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = app.candidate.fullName?.toLowerCase() || "";
      const loc = app.candidate.currentLocation?.toLowerCase() || "";
      if (!name.includes(q) && !loc.includes(q)) return false;
    }

    return true;
  });

  const commissionRate = termsStatus?.defaultCommissionRate || 8.33;
  const paymentDays = termsStatus?.paymentTermsDays || 30;
  const replacementDays = termsStatus?.defaultReplacementWindowDays || 60;

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/company/dashboard" style={{ color: "#2563EB", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            ← Back to Employer Dashboard
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
            {requirementTitle}
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Candidate Pipeline & Screening Management • Total Candidates: <strong>{applications.length}</strong>
          </p>
        </div>

        {/* Terms Status Badge */}
        <div>
          {termsStatus?.termsAgreementSigned ? (
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                color: "#166534",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>✅</span> Terms of Business Signed ({commissionRate}% Cut)
            </div>
          ) : (
            <button
              onClick={() => setTermsModalOpen(true)}
              style={{
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                color: "#92400E",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📜</span> Sign Terms of Business ({commissionRate}% Cut)
            </button>
          )}
        </div>
      </div>

      {/* Commercial Terms Summary Banner */}
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          padding: "12px 18px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 13,
          color: "#334155",
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span>💼 <strong>Placement Fee:</strong> {commissionRate}% of Annual CTC</span>
          <span>📅 <strong>Payment Terms:</strong> {paymentDays} Days Net from Joining</span>
          <span>🛡️ <strong>Guarantee:</strong> {replacementDays}-Day Free Replacement Window</span>
        </div>
        <button
          onClick={() => setTermsModalOpen(true)}
          style={{ background: "transparent", border: "none", color: "#2563EB", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          View Full Legal Agreement ↗
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Search Candidate / City
          </label>
          <input
            type="text"
            placeholder="e.g. Ramesh, Noida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, color: "#0F172A" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Experience Filter
          </label>
          <select
            value={filterExp}
            onChange={(e) => setFilterExp(e.target.value as any)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, color: "#0F172A", background: "#FFF" }}
          >
            <option value="ALL">All Levels (Fresher + Exp)</option>
            <option value="Intermediate">Intermediate & Above (Min 1+ Yrs)</option>
            <option value="Expert">Expert Only (5+ Yrs)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Application Stage
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, color: "#0F172A", background: "#FFF" }}
          >
            <option value="ALL">All Stages ({applications.length})</option>
            <option value="Applied">Applied (Under Screening)</option>
            <option value="Shortlisted">Shortlisted (Curated)</option>
            <option value="InterviewScheduled">Interview Scheduled</option>
            <option value="Offered">Offered</option>
            <option value="Joined">Placed & Joined</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Required Skill
          </label>
          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, color: "#0F172A", background: "#FFF" }}
          >
            <option value="ALL">All Skills</option>
            {allSkills.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Pipeline Cards */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748B", fontSize: 15 }}>
          Loading candidate pipeline...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center", color: "#64748B" }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "#334155" }}>
            No applicants match the selected filters.
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>Try clearing search keywords or choosing "All Levels".</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((app) => {
            const isInterviewOrLater = ["InterviewScheduled", "Offered", "Joined"].includes(app.status);
            const canSeeContact = isInterviewOrLater && termsStatus?.termsAgreementSigned;
            const isCurated = app.status === "Shortlisted" || !!app.assignedUserId;

            return (
              <div
                key={app.id}
                style={{
                  background: "#FFFFFF",
                  border: isCurated ? "2px solid #BFDBFE" : "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 22,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                {/* Left: Candidate Bio & Badges */}
                <div style={{ flex: "1 1 340px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                      {app.candidate.fullName}
                    </h3>

                    {isCurated ? (
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: 6 }}>
                        ⭐ Pre-Screened & Curated by RS Bridge
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#64748B", padding: "2px 8px", borderRadius: 6 }}>
                        ⏳ Direct Applicant (Under Screening)
                      </span>
                    )}

                    <span style={{ fontSize: 12, fontWeight: 700, background: "#F1F5F9", color: "#334155", padding: "2px 8px", borderRadius: 6 }}>
                      {app.candidate.experienceLevel} ({app.candidate.totalExperienceYears || 0} Yrs)
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: 10,
                        background:
                          app.status === "Joined"
                            ? "#DCFCE7"
                            : app.status === "Offered"
                            ? "#F3E8FF"
                            : app.status === "InterviewScheduled"
                            ? "#DCFCE7"
                            : app.status === "Shortlisted"
                            ? "#FEF3C7"
                            : app.status === "Rejected"
                            ? "#FEE2E2"
                            : "#F1F5F9",
                        color:
                          app.status === "Joined"
                            ? "#15803D"
                            : app.status === "Offered"
                            ? "#6B21A8"
                            : app.status === "InterviewScheduled"
                            ? "#166534"
                            : app.status === "Shortlisted"
                            ? "#92400E"
                            : app.status === "Rejected"
                            ? "#991B1B"
                            : "#334155",
                      }}
                    >
                      ● {app.status === "Joined" ? "Placed & Joined" : app.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>📍 Location: <strong>{app.candidate.currentLocation || "Delhi NCR"}</strong></span>
                    <span>Applied/Pitched: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Recruiter / Interview Notes if any */}
                  {app.history && app.history[0]?.notes && (
                    <div style={{ background: "#F8FAFC", borderLeft: "3px solid #2563EB", padding: "8px 12px", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#334155", marginBottom: 10 }}>
                      <strong>Latest Update:</strong> {app.history[0].notes}
                    </div>
                  )}

                  {/* Contact unmasked or masked notice */}
                  {canSeeContact ? (
                    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "6px 10px", borderRadius: 6, fontSize: 12, color: "#166534", marginBottom: 10 }}>
                      🔓 Contact Unmasked: <strong>📧 {app.candidate.email}</strong> • <strong>📱 {app.candidate.mobile}</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>
                      🔒 Direct contact masked. Unlocked automatically once Interview is Scheduled and Terms of Business are accepted.
                    </div>
                  )}

                  {/* Skills badges */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {app.candidate.skills?.map((s, idx) => (
                      <span
                        key={typeof s === "string" ? s : s.skill?.name || idx}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          color: "#334155",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {typeof s === "string" ? s : s.skill?.name || "Skill"}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Stage Progression Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200, alignItems: "flex-end" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {/* Schedule Interview */}
                    {app.status !== "InterviewScheduled" && app.status !== "Offered" && app.status !== "Joined" && (
                      <button
                        onClick={() => {
                          setInterviewModalApp(app);
                          setInterviewDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
                          setMeetingLinkOrVenue("https://meet.google.com/rsb-interview");
                          setRoundName("Round 1 Technical Screening");
                        }}
                        disabled={actionLoadingId === app.id}
                        style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        📅 Schedule Interview
                      </button>
                    )}

                    {/* Extend Offer */}
                    {(app.status === "InterviewScheduled" || app.status === "Shortlisted") && (
                      <button
                        onClick={() => {
                          setOfferModalApp(app);
                          setOfferedCtc("600000");
                          setOfferJoiningDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
                        }}
                        disabled={actionLoadingId === app.id}
                        style={{ background: "#F3E8FF", color: "#6B21A8", border: "1px solid #D8B4FE", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        🎉 Extend Offer
                      </button>
                    )}

                    {/* Confirm Placement / Joined */}
                    {(app.status === "Offered" || app.status === "InterviewScheduled") && (
                      <button
                        onClick={() => {
                          setJoinedModalApp(app);
                          setAgreedCtc("600000");
                        }}
                        disabled={actionLoadingId === app.id}
                        style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(5,150,105,0.25)" }}
                      >
                        ✅ Confirm Joined (Place)
                      </button>
                    )}

                    {/* Reject */}
                    {app.status !== "Rejected" && app.status !== "Joined" && (
                      <button
                        onClick={() => handleStatusChange(app.id, "Rejected")}
                        disabled={actionLoadingId === app.id}
                        style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "7px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        ✕ Reject
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {termsStatus?.termsAgreementSigned ? (
                      <a
                        href={`/api/candidates/${app.candidate.id}/resume?type=raw`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "#059669",
                          color: "#FFF",
                          padding: "8px 14px",
                          borderRadius: 6,
                          textDecoration: "none",
                          fontWeight: 700,
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 4px rgba(5,150,105,0.2)",
                        }}
                      >
                        📄 View Candidate CV ↗
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTermsModalOpen(true);
                          alert("🔒 Digital Terms of Business agreement required before accessing candidate CVs and direct contact coordinates.");
                        }}
                        style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          border: "1px solid #CBD5E1",
                          padding: "8px 14px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        🔒 Unlock CV (Sign Terms)
                      </button>
                    )}
                    <a
                      href={`/api/candidates/${app.candidate.id}/resume?type=branded`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#2563EB",
                        color: "#FFF",
                        padding: "8px 14px",
                        borderRadius: 6,
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                      }}
                    >
                      🏢 RS Bridge Profile PDF ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {interviewModalApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 540, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 8 }}>
                Interview Coordination
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                Schedule Interview for {interviewModalApp.candidate.fullName}
              </h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                Set the exact date, time, and meeting link/venue. Details are instantly sent to the candidate&apos;s portal.
              </p>
            </div>

            <form onSubmit={handleConfirmScheduleInterview}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Interview Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Interview Mode
                </label>
                <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="mode"
                      checked={interviewMode === "online"}
                      onChange={() => {
                        setInterviewMode("online");
                        setMeetingLinkOrVenue("https://meet.google.com/rsb-interview");
                      }}
                    />
                    🎥 Online (Google Meet / Zoom)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="mode"
                      checked={interviewMode === "offline"}
                      onChange={() => {
                        setInterviewMode("offline");
                        setMeetingLinkOrVenue((termsStatus as any)?.address || `${(termsStatus as any)?.branchName || "Company Branch"}, ${(termsStatus as any)?.city || "Delhi NCR"}`);
                      }}
                    />
                    🏢 In-Person (Office Venue)
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  {interviewMode === "online" ? "Google Meet / Zoom URL *" : "Office Address / Venue *"}
                </label>
                <input
                  type="text"
                  required
                  value={meetingLinkOrVenue}
                  onChange={(e) => setMeetingLinkOrVenue(e.target.value)}
                  placeholder={interviewMode === "online" ? "https://meet.google.com/abc-def-ghi" : "e.g. Apex Tower, 4th Floor, Sector 62, Noida"}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
                {interviewMode === "offline" && meetingLinkOrVenue && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#2563EB" }}>
                    🗺️ Google Maps Navigation: <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLinkOrVenue)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline" }}>Open Location Map ↗</a>
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Round Name / Interviewer
                </label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="e.g. Technical Round 1 with Lead Architect"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Preparation Instructions for Candidate
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Please be ready with laptop for a live coding review / bring commercial DL."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setInterviewModalApp(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#2563EB", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Confirm & Send Interview Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND OFFER MODAL */}
      {offerModalApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 500, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#F3E8FF", color: "#6B21A8", padding: "2px 8px", borderRadius: 8 }}>
                Job Offer Extension
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                Extend Offer to {offerModalApp.candidate.fullName}
              </h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                Roll out an official job offer with offered compensation details.
              </p>
            </div>

            <form onSubmit={handleConfirmExtendOffer}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Offered Annual CTC (₹ in INR) *
                </label>
                <input
                  type="number"
                  required
                  value={offeredCtc}
                  onChange={(e) => setOfferedCtc(e.target.value)}
                  placeholder="e.g. 600000 (for 6 LPA)"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Expected Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={offerJoiningDate}
                  onChange={(e) => setOfferJoiningDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Offer Letter Notes / Role Designation
                </label>
                <textarea
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="e.g. Offer letter sent via email. Designation: Senior Next.js Developer."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOfferModalApp(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#6B21A8", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Extend Job Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PLACEMENT / JOINED MODAL */}
      {joinedModalApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 500, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 8 }}>
                🏆 Final Placement Confirmation
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                Confirm Placement: {joinedModalApp.candidate.fullName}
              </h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                Confirming candidate joining finalizes the placement and generates the billing invoice.
              </p>
            </div>

            <form onSubmit={handleConfirmPlacementJoined}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Final Agreed Annual CTC (₹ in INR) *
                </label>
                <input
                  type="number"
                  required
                  value={agreedCtc}
                  onChange={(e) => setAgreedCtc(e.target.value)}
                  placeholder="e.g. 650000 (for 6.5 LPA)"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Official Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={actualJoiningDate}
                  onChange={(e) => setActualJoiningDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setJoinedModalApp(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#059669", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Finalize Placement & Joining
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms of Business Legal & Commercial Schedule Modal */}
      {termsModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#FFF", borderRadius: 16, padding: 32, maxWidth: 640, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                RS Bridge Consultancy Terms of Business (TOB)
              </h2>
              <button
                onClick={() => setTermsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#F1F5F9", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", marginBottom: 6 }}>
                Commercial Schedule & Mandate Rates
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div><strong>Placement Commission:</strong> {commissionRate}% of Gross Annual CTC</div>
                <div><strong>Payment Cycle:</strong> {paymentDays} Days Net from Joining</div>
                <div><strong>Free Replacement:</strong> {replacementDays} Calendar Days</div>
                <div><strong>Service Jurisdiction:</strong> Delhi NCR & India</div>
              </div>
            </div>

            <div style={{ maxHeight: 220, overflowY: "auto", background: "#F8FAFC", padding: 16, borderRadius: 8, fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 20, border: "1px solid #E2E8F0" }}>
              <p><strong>1. Contingency Placement Fee:</strong> The Client agrees to pay RS Bridge Consultancy a placement fee equal to {commissionRate}% of the candidate&apos;s first-year Total Cost to Company (CTC). The fee becomes payable immediately upon the candidate&apos;s official joining date.</p>
              <p><strong>2. Anti-Disintermediation & 12-Month Non-Bypass:</strong> The Client agrees not to circumvent or bypass RS Bridge Consultancy to recruit, engage, or hire any introduced candidate directly or via a third party for a period of 12 months following the candidate&apos;s introduction. Any direct hire within this period incurs the full {commissionRate}% placement fee.</p>
              <p><strong>3. {replacementDays}-Day Free Replacement Warranty:</strong> If a placed candidate leaves or is dismissed for verified non-performance within {replacementDays} calendar days of joining, RS Bridge Consultancy will provide one free replacement candidate for the same role.</p>
              <p><strong>4. Interview Contact Reveal:</strong> Full unmasking of candidate phone and email is authorized upon interview scheduling following the acceptance of this agreement.</p>
            </div>

            {termsStatus?.termsAgreementSigned ? (
              <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534", padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                ✅ This agreement is already signed and active for this company branch.
              </div>
            ) : (
              <form onSubmit={handleSignTerms}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Authorized Signer Full Name (Digital Signature) *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma, Head of Human Resources"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 14 }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(false)}
                    style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={signing || !signerName.trim()}
                    style={{ background: "#2563EB", color: "#FFF", border: "none", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: signing ? "not-allowed" : "pointer" }}
                  >
                    {signing ? "Signing..." : "Accept & Sign Terms of Business"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
