"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Candidate {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  currentLocation: string | null;
  preferredJobLocation: string | null;
  experienceLevel: string;
  totalExperienceYears: number | null;
  preferredCategory: string;
  expectedSalary: string | null;
  noticePeriod: string | null;
  resumeUrl: string | null;
  drivingLicenseNumber: string | null;
  dlCategory: string | null;
  vehicleTypes: string | null;
  policeVerificationStatus: string;
  skills: { skill: { name: string } }[];
  education: { degree: string; institution: string; passingYear: number | null }[];
  experiences: { companyName: string; designation: string }[];
  resumes: { id: string; label: string; fileUrl: string; isDefault: boolean }[];
}

export default function EmployeeCandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: candidateId } = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/candidates`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.candidates?.find((c: any) => c.id === candidateId);
        if (found) setCandidate(found);
      })
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading candidate profile...</div>;
  if (!candidate) return <div style={{ padding: 40, textAlign: "center" }}>Candidate not found.</div>;

  return (
    <div style={{ maxWidth: 950, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/employee/candidates" style={{ color: "#2563EB", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          ← Back to Candidate Pipeline
        </Link>
      </div>

      {/* Header & Two Resume Action Buttons */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>{candidate.fullName}</h1>
            <div style={{ display: "flex", gap: 12, color: "#475569", fontSize: 14 }}>
              <span>📞 {candidate.mobile}</span>
              <span>✉️ {candidate.email}</span>
              <span>📍 {candidate.currentLocation || "Location Not Specified"}</span>
            </div>
          </div>

          {/* TWO RESUME ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={`/api/candidates/${candidate.id}/resume?type=branded`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#2563EB",
                color: "#FFF",
                padding: "10px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
              }}
            >
              📄 Download Branded PDF
            </a>

            {candidate.resumeUrl && (
              <a
                href={`/api/candidates/${candidate.id}/resume?type=raw`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                  padding: "10px 18px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                📎 View Original Uploaded Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left Column: Qualifications & Category */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 12px" }}>Overview & Attributes</h2>
          <div style={{ display: "grid", gap: 8, fontSize: 14, color: "#334155" }}>
            <div><strong>Category:</strong> {candidate.preferredCategory}</div>
            <div><strong>Experience Level:</strong> {candidate.experienceLevel} ({candidate.totalExperienceYears || 0} Years)</div>
            <div><strong>Expected Compensation:</strong> {candidate.expectedSalary || "Negotiable"}</div>
            <div><strong>Notice Period:</strong> {candidate.noticePeriod || "Immediate"}</div>

            {candidate.preferredCategory === "Driver" && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 600, color: "#2563EB", marginBottom: 6 }}>Driver Sourcing Badges:</div>
                <div><strong>License:</strong> {candidate.drivingLicenseNumber || "Verified Commercial"} ({candidate.dlCategory || "LMV/HMV"})</div>
                <div><strong>Vehicles:</strong> {candidate.vehicleTypes || "Commercial / Container"}</div>
                <div><strong>Police Verification:</strong> {candidate.policeVerificationStatus}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Skills & Education */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 12px" }}>Skills & Education</h2>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Tagged Skills:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {candidate.skills?.map((s) => (
                <span key={s.skill.name} style={{ fontSize: 12, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 8px", borderRadius: 6 }}>
                  {s.skill.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>Education:</div>
            {candidate.education?.map((e, idx) => (
              <div key={idx} style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>
                • <strong>{e.degree}</strong> — {e.institution} ({e.passingYear || "N/A"})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
