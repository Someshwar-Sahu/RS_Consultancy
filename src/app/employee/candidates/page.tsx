"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  experienceLevel: string;
  totalExperienceYears: number | null;
  preferredCategory: string;
  currentLocation: string | null;
  preferredJobLocation: string | null;
  drivingLicenseNumber: string | null;
  dlCategory: string | null;
  policeVerificationStatus: string;
  resumeUrl: string | null;
  resumes: Array<{ id: string; label: string; fileUrl: string; isDefault: boolean }>;
  skills: Array<{ skill: { name: string } }>;
  applications: Array<{ id: string; status: string; requirement: { title: string; branch: { company: { name: string } } } }>;
}

interface ApplicationItem {
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
    totalExperienceYears?: number | null;
    currentLocation?: string | null;
    resumeUrl: string | null;
    skills: Array<{ skill: { name: string } }>;
    education?: Array<{ institution: string; degree: string; passingYear?: number | null }>;
  };
  requirement: {
    id: string;
    title: string;
    hiringCategory?: string;
    branch: {
      city: string;
      company: {
        name: string;
      };
    };
  };
  history?: Array<{ notes: string; changedAt: string; toStatus: string }>;
}

interface OpenMandate {
  id: string;
  title: string;
  hiringCategory: string;
  categoryType: string;
  branch: {
    city: string;
    company: {
      name: string;
    };
  };
}

const STAGES = [
  "Applied",
  "Shortlisted",
  "InterviewScheduled",
  "Offered",
  "Joined",
  "Rejected",
  "Withdrawn",
];

export default function EmployeeCandidatesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const [activeTab, setActiveTab] = useState<"queue" | "pool" | "placements">("queue");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [openMandates, setOpenMandates] = useState<OpenMandate[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Queue Filters
  const [queueFilter, setQueueFilter] = useState<"me" | "all">("me");
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>("ALL");
  const [queueSearch, setQueueSearch] = useState<string>("");

  // Pool Filters
  const [poolSearch, setPoolSearch] = useState("");
  const [poolCategory, setPoolCategory] = useState("ALL");
  const [poolExp, setPoolExp] = useState("ALL");

  // Actions
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [matchModalCandidate, setMatchModalCandidate] = useState<Candidate | null>(null);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [recruiterNotes, setRecruiterNotes] = useState("");
  const [matching, setMatching] = useState(false);

  // Placement CTC Confirmation Modal
  const [placementApp, setPlacementApp] = useState<ApplicationItem | null>(null);
  const [agreedCtc, setAgreedCtc] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadData();
    loadMandates();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMatchModalCandidate(null);
        setPlacementApp(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load Applications for Queue & Placements
      const appRes = await fetch("/api/employee/candidates?view=pipeline");
      const appData = await appRes.json();
      if (appData.applications) {
        setApplications(appData.applications);
      }
      if (appData.currentUserId) {
        setCurrentUserId(appData.currentUserId);
      }

      // Load Master Candidate Pool
      const poolRes = await fetch("/api/employee/candidates?view=pool");
      const poolData = await poolRes.json();
      if (poolData.candidates) {
        setCandidates(poolData.candidates);
      }
    } catch (err) {
      console.error("Error loading candidate data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMandates() {
    try {
      const res = await fetch("/api/requirements");
      const data = await res.json();
      if (data.requirements) {
        const open = data.requirements.filter((r: any) => r.status === "Open");
        setOpenMandates(open);
        if (open.length > 0) {
          setSelectedMandateId(open[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading open mandates:", err);
    }
  }

  // 1-Click Verification & Shortlist
  async function handleVerifyAndShortlist(app: ApplicationItem) {
    setUpdatingId(app.id);
    try {
      const res = await fetch("/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          toStatus: "Shortlisted",
          notes: `Verified & shortlisted by RS Bridge recruiter for ${app.requirement.branch.company.name}.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify candidate.");

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "Shortlisted" } : a))
      );
      alert(`⭐ Verified! ${app.candidate.fullName} is now Shortlisted and visible in ${app.requirement.branch.company.name}'s client portal.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStatusChange(app: ApplicationItem, newStatus: string) {
    if (newStatus === "Joined") {
      setPlacementApp(app);
      setAgreedCtc("600000");
      return;
    }

    setUpdatingId(app.id);
    try {
      const res = await fetch("/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          toStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmPlacement(e: React.FormEvent) {
    e.preventDefault();
    if (!placementApp) return;

    setPlacing(true);
    try {
      const res = await fetch("/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: placementApp.id,
          toStatus: "Joined",
          agreedCtc: Number(agreedCtc),
          joiningDate,
          notes: `Placement finalized. Candidate joined on ${joiningDate} with agreed CTC of ₹${Number(agreedCtc).toLocaleString("en-IN")}.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finalize placement.");

      setApplications((prev) =>
        prev.map((a) => (a.id === placementApp.id ? { ...a, status: "Joined" } : a))
      );
      setPlacementApp(null);
      alert(`🎉 Placement confirmed for ${placementApp.candidate.fullName}! Draft Invoice generated for Admin.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPlacing(false);
    }
  }

  async function handleConfirmMatchmake(e: React.FormEvent) {
    e.preventDefault();
    if (!matchModalCandidate || !selectedMandateId) return;

    setMatching(true);
    try {
      const res = await fetch("/api/employee/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: matchModalCandidate.id,
          jobRequirementId: selectedMandateId,
          screeningNotes: recruiterNotes || "Pre-screened & matched by RS Bridge Recruiter.",
          initialStatus: "Shortlisted",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to match candidate.");

      alert(`🎯 Success! ${matchModalCandidate.fullName} has been pitched and added to the client pipeline as Shortlisted.`);
      setMatchModalCandidate(null);
      setRecruiterNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMatching(false);
    }
  }

  const [debouncedQueueSearch, setDebouncedQueueSearch] = useState("");
  const [debouncedPoolSearch, setDebouncedPoolSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQueueSearch(queueSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [queueSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPoolSearch(poolSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [poolSearch]);

  // Active unplaced candidate pool (filters out candidates already placed)
  const availableCandidates = candidates.filter((cand) => {
    const isAlreadyPlaced = cand.applications?.some((a) => a.status === "Joined");
    if (isAlreadyPlaced) return false;

    if (poolCategory !== "ALL" && cand.preferredCategory !== poolCategory) return false;

    if (debouncedPoolSearch.trim()) {
      const q = debouncedPoolSearch.toLowerCase().trim();
      const nameMatch = cand.fullName?.toLowerCase().includes(q);
      const emailMatch = cand.email?.toLowerCase().includes(q);
      const phoneMatch = cand.mobile?.includes(q);
      const cityMatch = cand.currentLocation?.toLowerCase().includes(q);
      const skillMatch = cand.skills?.some((s) => s.skill?.name?.toLowerCase().includes(q));
      if (!nameMatch && !emailMatch && !phoneMatch && !cityMatch && !skillMatch) return false;
    }

    return true;
  });

  // Placed alumni list
  const placedApplications = applications.filter((app) => app.status === "Joined");

  // Filter Queue Applications
  const queueApplications = applications.filter((app) => {
    // Hide Joined from active screening queue
    if (app.status === "Joined") return false;

    if (queueFilter === "me" && currentUserId) {
      if (app.assignedUserId !== currentUserId) return false;
    }

    if (queueStatusFilter === "Applied" && app.status !== "Applied") return false;
    if (queueStatusFilter === "Shortlisted" && app.status !== "Shortlisted") return false;
    if (queueStatusFilter === "InterviewScheduled" && app.status !== "InterviewScheduled") return false;
    if (queueStatusFilter === "Offered" && app.status !== "Offered") return false;

    if (debouncedQueueSearch.trim()) {
      const q = debouncedQueueSearch.toLowerCase().trim();
      const nameMatch = app.candidate.fullName?.toLowerCase().includes(q);
      const emailMatch = app.candidate.email?.toLowerCase().includes(q);
      const phoneMatch = app.candidate.mobile?.includes(q);
      const titleMatch = app.requirement.title?.toLowerCase().includes(q);
      const compMatch = app.requirement.branch.company.name?.toLowerCase().includes(q);
      const cityMatch = app.requirement.branch.city?.toLowerCase().includes(q);
      const skillMatch = app.candidate.skills?.some((s) => s.skill?.name?.toLowerCase().includes(q));
      if (!nameMatch && !emailMatch && !phoneMatch && !titleMatch && !compMatch && !cityMatch && !skillMatch) return false;
    }

    return true;
  });

  const myAssignedCount = applications.filter((a) => a.assignedUserId === currentUserId && a.status !== "Joined").length;
  const myPendingScreeningCount = applications.filter((a) => a.assignedUserId === currentUserId && a.status === "Applied").length;

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
            Recruiter Workspace & Candidate Sourcing
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Verify incoming applicants, proactively source from master candidate pool, and coordinate client placements.
          </p>
        </div>

        {/* Live Workload Counter */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 18px", textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>My Assigned Load (Round-Robin)</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
            {myPendingScreeningCount} Pending Screening <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>({myAssignedCount} active)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #E2E8F0", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("queue")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "none",
            fontSize: 14,
            fontWeight: 800,
            color: activeTab === "queue" ? "#2563EB" : "#64748B",
            borderBottom: activeTab === "queue" ? "3px solid #2563EB" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📋</span> Active Screening Queue
          {myPendingScreeningCount > 0 && (
            <span style={{ background: "#EF4444", color: "#FFF", fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>
              {myPendingScreeningCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("pool")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "none",
            fontSize: 14,
            fontWeight: 800,
            color: activeTab === "pool" ? "#2563EB" : "#64748B",
            borderBottom: activeTab === "pool" ? "3px solid #2563EB" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🎯</span> Available Talent Pool ({availableCandidates.length})
        </button>

        <button
          onClick={() => setActiveTab("placements")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "none",
            fontSize: 14,
            fontWeight: 800,
            color: activeTab === "placements" ? "#059669" : "#64748B",
            borderBottom: activeTab === "placements" ? "3px solid #059669" : "3px solid transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🏆</span> Placed & Hired Alumni ({placedApplications.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE APPLICATIONS & SCREENING QUEUE                              */}
      {/* ========================================================================= */}
      {activeTab === "queue" && (
        <div>
          {/* Queue Filter Bar */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "center" }}>
            {/* View Queue Toggle */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Workload Queue:</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setQueueFilter("me")}
                  style={{
                    flex: 1,
                    background: queueFilter === "me" ? "#2563EB" : "#F1F5F9",
                    color: queueFilter === "me" ? "#FFFFFF" : "#334155",
                    border: queueFilter === "me" ? "none" : "1px solid #CBD5E1",
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: queueFilter === "me" ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
                  }}
                >
                  🎯 My Queue ({myAssignedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQueueFilter("all")}
                  style={{
                    flex: 1,
                    background: queueFilter === "all" ? "#2563EB" : "#F1F5F9",
                    color: queueFilter === "all" ? "#FFFFFF" : "#334155",
                    border: queueFilter === "all" ? "none" : "1px solid #CBD5E1",
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: queueFilter === "all" ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
                  }}
                >
                  👥 Team ({applications.filter(a => a.status !== "Joined").length})
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Filter Status:</label>
              <select
                value={queueStatusFilter}
                onChange={(e) => setQueueStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, background: "#FFF", fontWeight: 600 }}
              >
                <option value="ALL">All Active Stages</option>
                <option value="Applied">⏳ Awaiting Screening (Applied)</option>
                <option value="Shortlisted">⭐ Shortlisted (Pushed to Client)</option>
                <option value="InterviewScheduled">📅 Interview Scheduled</option>
                <option value="Offered">🎉 Offer Extended</option>
              </select>
            </div>

            {/* Live Search */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Search Queue:</label>
              <input
                type="text"
                placeholder="Search candidate name, phone, email, job title, company, or skills..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#64748B" }}>Loading application queue...</div>
          ) : queueApplications.length === 0 ? (
            <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center", color: "#64748B" }}>
              <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "#334155" }}>
                No active applications match the selected filters.
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                {queueFilter === "me" ? "You have no pending assignments right now." : "Try clearing search keywords or selecting All Stages."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {queueApplications.map((app) => {
                const isAssignedToMe = app.assignedUserId === currentUserId;
                const isPendingScreening = app.status === "Applied";

                return (
                  <div
                    key={app.id}
                    style={{
                      background: "#FFFFFF",
                      border: isPendingScreening ? "2px solid #FCD34D" : "1px solid #E2E8F0",
                      borderRadius: 14,
                      padding: 22,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Left: Candidate Info & Applied Mandate */}
                    <div style={{ flex: "1 1 450px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                        <Link href={`/employee/candidates/${app.candidate.id}`} style={{ textDecoration: "none" }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                            {app.candidate.fullName} ↗
                          </h3>
                        </Link>

                        {isAssignedToMe ? (
                          <span style={{ fontSize: 11, fontWeight: 800, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: 6 }}>
                            🎯 Assigned to You
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, background: "#F1F5F9", color: "#64748B", padding: "2px 8px", borderRadius: 6 }}>
                            Team Assigned
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background:
                              app.status === "InterviewScheduled"
                                ? "#DCFCE7"
                                : app.status === "Offered"
                                ? "#F3E8FF"
                                : isPendingScreening
                                ? "#FEF3C7"
                                : "#EFF6FF",
                            color:
                              app.status === "InterviewScheduled"
                                ? "#166534"
                                : app.status === "Offered"
                                ? "#6B21A8"
                                : isPendingScreening
                                ? "#92400E"
                                : "#1D4ED8",
                          }}
                        >
                          ● {isPendingScreening ? "⏳ Awaiting Screening" : app.status}
                        </span>
                      </div>

                      {/* Applied Mandate Highlight Box */}
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 2 }}>
                          Applied Position & Employer:
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                          🏢 {app.requirement.title} — <span style={{ color: "#2563EB" }}>{app.requirement.branch.company.name}</span> ({app.requirement.branch.city})
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          Applied on: {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Candidate Meta Info */}
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#475569", flexWrap: "wrap", marginBottom: 8 }}>
                        <span>📧 {app.candidate.email}</span>
                        <span>📱 {app.candidate.mobile}</span>
                        <span>💼 {app.candidate.experienceLevel} ({app.candidate.totalExperienceYears || 0} Yrs)</span>
                        <span>📍 {app.candidate.currentLocation || "Delhi NCR"}</span>
                      </div>

                      {/* Skills Matrix */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {app.candidate.skills?.map((s, idx) => (
                          <span key={typeof s === "string" ? s : s.skill?.name || idx} style={{ fontSize: 11, background: "#F1F5F9", color: "#334155", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {typeof s === "string" ? s : s.skill?.name || "Skill"}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Locked Action Panel */}
                    <div style={{ flexShrink: 0, minWidth: 230, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {isPendingScreening && (
                          <button
                            onClick={() => handleVerifyAndShortlist(app)}
                            disabled={updatingId === app.id}
                            style={{
                              background: "#2563EB",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "9px 18px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>⭐</span> Verify & Approve for {app.requirement.branch.company.name}
                          </button>
                        )}

                        {app.status === "Offered" && (
                          <button
                            onClick={() => handleStatusChange(app, "Joined")}
                            disabled={updatingId === app.id}
                            style={{
                              background: "#059669",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "9px 16px",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✅ Confirm Joined (Place)
                          </button>
                        )}

                        {app.status !== "Rejected" && (
                          <button
                            onClick={() => handleStatusChange(app, "Rejected")}
                            disabled={updatingId === app.id}
                            style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <a
                          href={`/api/candidates/${app.candidate.id}/resume?type=raw`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: "#059669",
                            color: "#FFF",
                            padding: "7px 12px",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          📄 View CV ↗
                        </a>
                        <a
                          href={`/api/candidates/${app.candidate.id}/resume?type=branded`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: "#F1F5F9",
                            color: "#1E293B",
                            border: "1px solid #CBD5E1",
                            padding: "7px 12px",
                            borderRadius: 6,
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          🏢 RS Bridge PDF ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AVAILABLE TALENT BANK (PROACTIVE SOURCING)                          */}
      {/* ========================================================================= */}
      {activeTab === "pool" && (
        <div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Search Available Talent:</label>
              <input
                type="text"
                placeholder="Search candidate name, skills (e.g. React, HMV), phone, city..."
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Category:</label>
              <select
                value={poolCategory}
                onChange={(e) => setPoolCategory(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, background: "#FFF", fontWeight: 600 }}
              >
                <option value="ALL">All Categories</option>
                <option value="IT">🏢 IT & Technical</option>
                <option value="Driver">🚚 Commercial Driver</option>
                <option value="SalesMarketing">💼 Sales & Marketing</option>
                <option value="BPO">🎧 BPO Support</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {availableCandidates.map((cand) => (
              <div
                key={cand.id}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}
              >
                <div style={{ flex: "1 1 450px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Link href={`/employee/candidates/${cand.id}`} style={{ textDecoration: "none" }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>{cand.fullName} ↗</h3>
                    </Link>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 6 }}>
                      {cand.preferredCategory}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>{cand.experienceLevel} ({cand.totalExperienceYears || 0} Yrs)</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
                    <span>📧 {cand.email}</span>
                    <span>📱 {cand.mobile}</span>
                    <span>📍 {cand.currentLocation || "Delhi NCR"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {cand.skills?.map((s, idx) => (
                      <span key={typeof s === "string" ? s : s.skill?.name || idx} style={{ fontSize: 10, background: "#F1F5F9", color: "#334155", padding: "2px 6px", borderRadius: 4 }}>
                        {typeof s === "string" ? s : s.skill?.name || "Skill"}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ flexShrink: 0, minWidth: 230, alignSelf: "flex-start", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setMatchModalCandidate(cand);
                      setRecruiterNotes(`Pre-screened & verified ${cand.fullName} for this opening.`);
                    }}
                    style={{ background: "#2563EB", color: "#FFF", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span>🎯</span> Pitch to Mandate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLACED & HIRED ALUMNI (WITH 60-DAY GUARANTEE TRACKER)             */}
      {/* ========================================================================= */}
      {activeTab === "placements" && (
        <div>
          {placedApplications.length === 0 ? (
            <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center", color: "#64748B" }}>
              No placements confirmed yet. When candidates join employers, their records and billing invoices will appear here.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {placedApplications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #DCFCE7",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>{app.candidate.fullName}</h3>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 6 }}>
                        ✅ PLACED & JOINED
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", fontWeight: 700 }}>
                      🏢 {app.requirement.title} — <span style={{ color: "#2563EB" }}>{app.requirement.branch.company.name}</span> ({app.requirement.branch.city})
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                      Joined on: {new Date(app.createdAt).toLocaleDateString()} • 🛡️ 60-Day Replacement Guarantee Active
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={`/api/candidates/${app.candidate.id}/resume?type=raw`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                    >
                      📄 View Placed CV
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MATCHMAKING MODAL: PROACTIVE SOURCING TO CLIENT MANDATE */}
      {matchModalCandidate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 540, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 8 }}>
                RS Bridge Matchmaking & Sourcing
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                Pitch {matchModalCandidate.fullName} to Client Mandate
              </h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                Proactively submit this candidate to the hiring partner. The candidate will enter the client pipeline as <strong>Shortlisted</strong>.
              </p>
            </div>

            <form onSubmit={handleConfirmMatchmake}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Select Open Client Mandate *
                </label>
                <select
                  required
                  value={selectedMandateId}
                  onChange={(e) => setSelectedMandateId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13, background: "#FFF", fontWeight: 600 }}
                >
                  {openMandates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {m.branch.company.name} ({m.branch.city})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Recruiter Screening Notes (Visible to Client HR)
                </label>
                <textarea
                  rows={3}
                  value={recruiterNotes}
                  onChange={(e) => setRecruiterNotes(e.target.value)}
                  placeholder="e.g. Pre-screened by recruiter. Verified 4 yrs experience, immediate joining capability, strong technical communication."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMatchModalCandidate(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={matching || !selectedMandateId}
                  style={{ background: "#2563EB", color: "#FFF", border: "none", padding: "10px 22px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: matching ? "not-allowed" : "pointer" }}
                >
                  {matching ? "Pitching Candidate..." : "Confirm & Pitch Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLACEMENT JOINED CONFIRMATION MODAL */}
      {placementApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 500, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 8 }}>
                🏆 Final Placement Confirmation
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                Confirm Placement: {placementApp.candidate.fullName}
              </h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                For position: <strong>{placementApp.requirement.title}</strong> at {placementApp.requirement.branch.company.name}.
              </p>
            </div>

            <form onSubmit={handleConfirmPlacement}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Final Agreed Annual CTC (₹ in INR) *
                </label>
                <input
                  type="number"
                  required
                  value={agreedCtc}
                  onChange={(e) => setAgreedCtc(e.target.value)}
                  placeholder="e.g. 600000 (for 6 LPA)"
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
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPlacementApp(null)}
                  style={{ background: "#F1F5F9", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placing}
                  style={{ background: "#059669", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: placing ? "not-allowed" : "pointer" }}
                >
                  {placing ? "Finalizing Placement..." : "Finalize Placement & Joining"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
