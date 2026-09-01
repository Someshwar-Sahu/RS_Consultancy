"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRequirementPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"Corporate" | "Driver" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [hiringCategory, setHiringCategory] = useState("IT");
  const [noOfVacancies, setNoOfVacancies] = useState(1);
  const [minExperienceYears, setMinExperienceYears] = useState(0);
  const [maxSalaryLpa, setMaxSalaryLpa] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Driver Specific
  const [vehicleTypesRequired, setVehicleTypesRequired] = useState("");
  const [dlCategoryRequired, setDlCategoryRequired] = useState("LMV");
  const [dutyHours, setDutyHours] = useState("8-10 Hours / Day");
  const [joiningTimeline, setJoiningTimeline] = useState("Immediate");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          hiringCategory: selectedType === "Driver" ? "Driver" : hiringCategory,
          categoryType: selectedType,
          noOfVacancies,
          minExperienceYears,
          maxSalaryLpa: maxSalaryLpa ? parseFloat(maxSalaryLpa) : null,
          jobDescription,
          vehicleTypesRequired: selectedType === "Driver" ? vehicleTypesRequired : null,
          dlCategoryRequired: selectedType === "Driver" ? dlCategoryRequired : null,
          dutyHours: selectedType === "Driver" ? dutyHours : null,
          joiningTimeline: selectedType === "Driver" ? joiningTimeline : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit requirement.");

      router.push("/company/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>Post a Job Requirement</h1>
      <p style={{ color: "#64748B", margin: "0 0 32px" }}>Select the vacancy type to configure the appropriate sourcing pipeline.</p>

      {/* 2-Card Vacancy Selector */}
      {!selectedType ? (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E293B", marginBottom: 16 }}>Choose Requirement Type</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Card 1: Corporate */}
            <div
              onClick={() => {
                setSelectedType("Corporate");
                setHiringCategory("IT");
              }}
              style={{
                border: "2px solid #E2E8F0",
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                transition: "all 0.2s",
                background: "#FFFFFF",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
                Corporate & Executive Roles
              </h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Software Developers, Sales & Marketing, Back Office, Finance, and Management personnel. Requires degrees and technical competencies.
              </p>
            </div>

            {/* Card 2: Driver */}
            <div
              onClick={() => {
                setSelectedType("Driver");
                setHiringCategory("Driver");
              }}
              style={{
                border: "2px solid #E2E8F0",
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                transition: "all 0.2s",
                background: "#FFFFFF",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚚</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
                Drivers & Commercial Fleet Staff
              </h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Personal drivers, commercial truck operators, delivery fleet staff. Sourced with DL badges, vehicle experience, and zero-liability disclaimers.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "4px 12px", borderRadius: 16 }}>
              {selectedType === "Corporate" ? "🏢 Corporate Vacancy" : "🚚 Driver Vacancy"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
            >
              Change Type
            </button>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: 12, borderRadius: 6, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Job Title / Designation *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedType === "Corporate" ? "e.g. Senior Full-Stack Engineer" : "e.g. Heavy Commercial Truck Driver"}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
            />
          </div>

          {selectedType === "Corporate" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Hiring Category *
                </label>
                <select
                  value={hiringCategory}
                  onChange={(e) => setHiringCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
                >
                  <option value="IT">Information Technology (IT)</option>
                  <option value="Sales&Marketing">Sales & Marketing</option>
                  <option value="BackOffice">Back Office / Operations</option>
                  <option value="BPO">BPO / Customer Support</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Max Budget (CTC in LPA)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={maxSalaryLpa}
                  onChange={(e) => setMaxSalaryLpa(e.target.value)}
                  placeholder="e.g. 18.0"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Required License Category *
                </label>
                <select
                  value={dlCategoryRequired}
                  onChange={(e) => setDlCategoryRequired(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
                >
                  <option value="LMV">LMV (Light Motor Vehicle - Car/Van)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle - Truck/Bus)</option>
                  <option value="Commercial">Commercial Badge (Pan-India)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Vehicle Types to Operate
                </label>
                <input
                  type="text"
                  value={vehicleTypesRequired}
                  onChange={(e) => setVehicleTypesRequired(e.target.value)}
                  placeholder="e.g. Container Truck, Delivery Van, SUV"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Number of Vacancies
              </label>
              <input
                type="number"
                min="1"
                value={noOfVacancies}
                onChange={(e) => setNoOfVacancies(parseInt(e.target.value) || 1)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(parseFloat(e.target.value) || 0)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Job Description / Key Requirements
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe the responsibilities, schedule, and preferred background..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#2563EB",
              color: "#FFF",
              padding: "14px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting for Review..." : "Submit Job Requirement"}
          </button>
        </form>
      )}
    </div>
  );
}
