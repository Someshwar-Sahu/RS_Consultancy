"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface JobItem {
  id: string;
  title: string;
  hiringCategory: string;
  noOfVacancies: number;
  minExperienceYears: number;
  maxSalaryLpa: number | null;
  city: string;
  companyName: string;
  skills: string[];
  createdAt: string;
}

export interface ResumeItem {
  id: string;
  label: string;
  fileUrl: string;
  isDefault: boolean;
}

export function JobList({
  initialJobs,
  initialResumes = [],
  initialAppliedJobIds = [],
  initialQuery = "",
  initialCategory = "",
}: {
  initialJobs: JobItem[];
  initialResumes?: ResumeItem[];
  initialAppliedJobIds?: string[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [candidateResumes, setCandidateResumes] = useState<ResumeItem[]>(initialResumes);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(initialAppliedJobIds);

  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    initialResumes.find((r) => r.isDefault)?.id || initialResumes[0]?.id || ""
  );
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Resume Upload
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Full-Text & Category Filter Logic
  const filteredJobs = initialJobs.filter((job) => {
    // 1. Category Filter
    if (selectedCategory && selectedCategory !== "ALL") {
      if (job.hiringCategory.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    // 2. Keyword Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);

      const title = job.title.toLowerCase();
      const city = job.city.toLowerCase();
      const cat = job.hiringCategory.toLowerCase();
      const skills = (job.skills || []).map((s) => s.toLowerCase()).join(" ");

      // Match all search terms
      const matches = terms.every(
        (term) =>
          title.includes(term) ||
          skills.includes(term) ||
          city.includes(term) ||
          cat.includes(term)
      );

      if (!matches) return false;
    }

    return true;
  });

  function handleOpenApply(job: JobItem) {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }

    setSelectedJob(job);
    setApplySuccess(false);
    setApplyError("");
  }

  async function handleQuickUploadAndApply(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFileObj || !selectedJob) return;

    setUploadingResume(true);
    setApplyError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFileObj);
      formData.append("label", `${selectedJob.title} CV`);
      formData.append("isDefault", "true");

      const uploadRes = await fetch("/api/candidates/resumes", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload resume.");

      const newResumeId = uploadData.resume.id;
      setSelectedResumeId(newResumeId);
      setCandidateResumes((prev) => [uploadData.resume, ...prev]);

      await submitApplication(selectedJob.id, newResumeId);
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setUploadingResume(false);
    }
  }

  async function submitApplication(jobRequirementId: string, resumeId?: string) {
    setApplying(true);
    setApplyError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequirementId,
          resumeId: resumeId || selectedResumeId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application.");

      setApplySuccess(true);
      setAppliedJobIds((prev) => [...prev, jobRequirementId]);
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      {/* Live Search & Filter Bar */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        {/* Search Input */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Search Keywords (Role, Tech Stack, City)
          </label>
          <input
            type="text"
            placeholder="e.g. Fullstack, Driver, Next.js, Noida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 14,
              color: "#0F172A",
            }}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Filter by Hiring Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 14,
              color: "#0F172A",
              background: "#FFFFFF",
              fontWeight: 600,
            }}
          >
            <option value="">All Categories</option>
            <option value="IT">🏢 IT & Technical</option>
            <option value="Sales&Marketing">💼 Sales & Marketing</option>
            <option value="BPO">🎧 BPO & Customer Support</option>
            <option value="BackOffice">📊 Back Office</option>
            <option value="Driver">🚚 Commercial Driver / Fleet</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>
          Showing <strong>{filteredJobs.length}</strong> matching vacancies
          {searchQuery && (
            <span> for query &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>
          )}
        </div>
        {(searchQuery || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("");
            }}
            style={{
              background: "#F1F5F9",
              border: "none",
              color: "#2563EB",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear Filters ✕
          </button>
        )}
      </div>

      {filteredJobs.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <p style={{ color: "#475569", fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>
            No open positions found matching your search.
          </p>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 16px" }}>
            Try adjusting your search terms or clearing the category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("");
            }}
            style={{
              background: "#2563EB",
              color: "#FFF",
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Show All Jobs
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20 }}>
          {filteredJobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);

            return (
              <div
                key={job.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: "#EFF6FF", color: "#1D4ED8" }}>
                      {job.hiringCategory}
                    </span>
                    <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>📍 {job.city}</span>
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "12px 0 2px" }}>
                    {job.title}
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 14px" }}>
                    Client Partner: <strong>{job.companyName}</strong>
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#334155", background: "#F8FAFC", padding: "10px 14px", borderRadius: 8 }}>
                    <div>💼 Min. Experience: <strong>{job.minExperienceYears === 0 ? "Fresher (0 Yrs)" : `${job.minExperienceYears} Yrs`}</strong></div>
                    <div>💰 Salary: <strong>{job.maxSalaryLpa ? `Up to ₹${Number(job.maxSalaryLpa).toFixed(1)} Lakhs / Year` : "Best in Industry"}</strong></div>
                    <div>👥 Vacancies: <strong>{job.noOfVacancies} Openings</strong></div>
                    <div>📅 Posted: <strong>{new Date(job.createdAt).toLocaleDateString()}</strong></div>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                      {job.skills.map((skill) => (
                        <span key={skill} style={{ background: "#F1F5F9", color: "#475569", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
                  {isApplied ? (
                    <span style={{ background: "#DCFCE7", color: "#166534", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                      ✓ Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenApply(job)}
                      style={{
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px 22px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                      }}
                    >
                      Apply Now →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1-Click Application Modal */}
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "#F1F5F9",
                border: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                fontSize: 16,
                fontWeight: 700,
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {applySuccess ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <span style={{ background: "#DCFCE7", color: "#166534", width: 54, height: 54, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
                  ✓
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>
                  Application Submitted!
                </h3>
                <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 20px" }}>
                  Your application for <strong>{selectedJob.title}</strong> has been received by RS Bridge recruiters.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <Link
                    href="/candidate/applications"
                    style={{ background: "#2563EB", color: "#FFF", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                  >
                    View in Applications Dashboard →
                  </Link>
                  <button
                    onClick={() => setSelectedJob(null)}
                    style={{ background: "#F1F5F9", color: "#0F172A", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 8 }}>
                    1-Click Application
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                    {selectedJob.title}
                  </h3>
                  <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                    {selectedJob.companyName} • {selectedJob.city}
                  </p>
                </div>

                {applyError && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                    ⚠️ {applyError}
                  </div>
                )}

                {candidateResumes.length > 0 ? (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>
                      Select CV / Resume to attach:
                    </label>
                    <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
                      {candidateResumes.map((r) => (
                        <label
                          key={r.id}
                          onClick={() => setSelectedResumeId(r.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: selectedResumeId === r.id ? "2px solid #2563EB" : "1px solid #E2E8F0",
                            background: selectedResumeId === r.id ? "#EFF6FF" : "#FFFFFF",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="radio"
                              name="selectedResume"
                              checked={selectedResumeId === r.id}
                              onChange={() => setSelectedResumeId(r.id)}
                            />
                            <strong style={{ fontSize: 13, color: "#0F172A" }}>{r.label}</strong>
                          </div>
                          {r.isDefault && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>
                              DEFAULT
                            </span>
                          )}
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => submitApplication(selectedJob.id)}
                      disabled={applying}
                      style={{
                        width: "100%",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "13px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: applying ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                      }}
                    >
                      {applying ? "Submitting Application..." : "Confirm & Submit Application (1-Click)"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuickUploadAndApply}>
                    <div style={{ background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                      <p style={{ color: "#854D0E", fontSize: 13, margin: 0, fontWeight: 600 }}>
                        📄 You haven&apos;t uploaded a CV yet. Attach your PDF resume below to complete this application:
                      </p>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <input
                        type="file"
                        required
                        accept=".pdf"
                        onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                        style={{ width: "100%", padding: "8px 0", fontSize: 13, color: "#0F172A" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploadingResume || !uploadFileObj}
                      style={{
                        width: "100%",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "13px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: uploadingResume || !uploadFileObj ? "not-allowed" : "pointer",
                      }}
                    >
                      {uploadingResume ? "Uploading & Applying..." : "Upload Resume & Apply"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
