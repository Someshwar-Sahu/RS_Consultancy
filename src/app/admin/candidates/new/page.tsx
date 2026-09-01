"use client";

import { useState } from "react";
import Link from "next/link";
import { COUNTRIES_DATA, CountryData, StateData } from "@/lib/geoData";

const VEHICLE_OPTIONS = [
  "Heavy Commercial Truck",
  "Container / 14-Wheeler",
  "Delivery Van / Chhota Hathi",
  "Commercial Sedan / SUV Chauffeur",
  "Electric Commercial Fleet",
];

export default function StaffCandidateProvisionPage() {
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [preferredCategory, setPreferredCategory] = useState("Driver");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [customPassword, setCustomPassword] = useState("");

  // Location
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(COUNTRIES_DATA[0]);
  const [selectedState, setSelectedState] = useState<StateData>(COUNTRIES_DATA[0].states[0]);
  const [selectedCity, setSelectedCity] = useState<string>(COUNTRIES_DATA[0].states[0].cities[0]);

  // Driver Qualifications
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [dlCategory, setDlCategory] = useState("Commercial");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(["Heavy Commercial Truck"]);
  const [policeVerificationStatus, setPoliceVerificationStatus] = useState("Verified");

  // Skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["Commercial Heavy Vehicle (HMV)", "Pan-India Route Navigation"]);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  function handleCategoryChange(cat: string) {
    setPreferredCategory(cat);
    if (cat === "Driver") {
      setSkills(["Commercial Heavy Vehicle (HMV)", "Pan-India Route Navigation"]);
    } else if (cat === "IT") {
      setSkills(["React.js", "Node.js", "Python"]);
    } else if (cat === "Sales&Marketing") {
      setSkills(["B2B Lead Generation", "Cold Calling"]);
    } else {
      setSkills(["MS Excel", "Operations"]);
    }
  }

  function handleAddSkill() {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  }

  function handleRemoveSkill(sToRemove: string) {
    setSkills(skills.filter((s) => s !== sToRemove));
  }

  function toggleVehicle(veh: string) {
    if (selectedVehicles.includes(veh)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v !== veh));
    } else {
      setSelectedVehicles([...selectedVehicles, veh]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const locationString = `${selectedCity}, ${selectedState.name}`;

    try {
      const res = await fetch("/api/admin/candidates/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          countryCode,
          mobile,
          email: email || null,
          currentLocation: locationString,
          preferredCategory,
          experienceLevel,
          expectedSalary,
          skills,
          drivingLicenseNumber: preferredCategory === "Driver" ? drivingLicenseNumber : null,
          dlCategory: preferredCategory === "Driver" ? dlCategory : null,
          vehicleTypes: preferredCategory === "Driver" ? selectedVehicles : null,
          policeVerificationStatus: preferredCategory === "Driver" ? policeVerificationStatus : null,
          customPassword: customPassword || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision candidate.");

      setCreatedResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCredentials() {
    if (!createdResult) return;
    const text = `RS Bridge Consultancy - Login Credentials\nName: ${createdResult.candidate.fullName}\nRole: ${createdResult.candidate.category}\nMobile: ${createdResult.credentials.loginIdentifier}\nLogin URL: http://localhost:3000/login\nPassword: ${createdResult.credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setCreatedResult(null);
    setFullName("");
    setMobile("");
    setEmail("");
    setDrivingLicenseNumber("");
    setCustomPassword("");
  }

  const isDriver = preferredCategory === "Driver";

  return (
    <div style={{ maxWidth: 880, margin: "36px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Top Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link href="/admin" style={{ color: "#2563EB", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            ← Back to Admin Console
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
            Provision Candidate & Verified Driver
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
            Staff onboarding tool with automated credential generation, duplicate checks, and recruiter attribution.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "14px 18px", borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success Modal / Card */}
      {createdResult ? (
        <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 16, padding: 32, boxShadow: "0 4px 16px rgba(22,101,52,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ background: "#16A34A", color: "#FFF", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
              ✓
            </span>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#166534", margin: 0 }}>
                {createdResult.candidate.category === "Driver" ? "Verified Driver Provisioned!" : "Candidate Account Created!"}
              </h2>
              <p style={{ color: "#15803D", margin: 0, fontSize: 13 }}>
                Account is live and ready. Share the login credentials below with the candidate.
              </p>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #BBF7D0", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: "#64748B", fontSize: 12, display: "block" }}>Candidate Name</span>
                <strong style={{ color: "#0F172A" }}>{createdResult.candidate.fullName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontSize: 12, display: "block" }}>Hiring Domain</span>
                <strong style={{ color: "#2563EB" }}>{createdResult.candidate.category}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontSize: 12, display: "block" }}>Login Mobile (ID)</span>
                <strong style={{ color: "#0F172A" }}>{createdResult.credentials.loginIdentifier}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontSize: 12, display: "block" }}>Temporary Password</span>
                <strong style={{ color: "#16A34A", fontSize: 16, fontFamily: "monospace" }}>{createdResult.credentials.temporaryPassword}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCopyCredentials}
              style={{
                background: "#16A34A",
                color: "#FFF",
                border: "none",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Credentials for WhatsApp / SMS"}
            </button>
            <button
              onClick={handleReset}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#0F172A",
                padding: "12px 20px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              + Add Another Candidate / Driver
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 32, display: "grid", gap: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          
          {/* Track Switcher */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8, textTransform: "uppercase" }}>
              1. Select Onboarding Track *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleCategoryChange("Driver")}
                style={{
                  padding: "14px 18px",
                  borderRadius: 10,
                  border: isDriver ? "2px solid #CA8A04" : "1px solid #CBD5E1",
                  background: isDriver ? "#FEFCE8" : "#F8FAFC",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15, color: isDriver ? "#854D0E" : "#334155" }}>
                  🚚 Verified Commercial Driver Track
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  For fleet, container, chauffeur, and logistics candidates (Captures DL & Police status).
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange("IT")}
                style={{
                  padding: "14px 18px",
                  borderRadius: 10,
                  border: !isDriver ? "2px solid #2563EB" : "1px solid #CBD5E1",
                  background: !isDriver ? "#EFF6FF" : "#F8FAFC",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15, color: !isDriver ? "#1E40AF" : "#334155" }}>
                  🏢 Corporate Candidate Track
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  For IT, Sales, BPO, Operations, and Executive walk-ins.
                </div>
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px", textTransform: "uppercase" }}>
              2. Candidate Identity & Contact
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                  Mobile Number (10 Digits) *
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{ width: 90, padding: "10px 8px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, color: "#0F172A" }}
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+971">+971 (AE)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    style={{ flex: 1, padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                  Email Address {isDriver ? "(Optional for Drivers)" : "*"}
                </label>
                <input
                  type="email"
                  required={!isDriver}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isDriver ? "Optional (Leave blank if none)" : "rajesh@example.com"}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={preferredCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                >
                  <option value="Driver">🚚 Driver & Commercial Fleet</option>
                  <option value="IT">🏢 IT & Software</option>
                  <option value="Sales&Marketing">💼 Sales & Marketing</option>
                  <option value="BPO">🎧 BPO & Customer Support</option>
                  <option value="BackOffice">📊 Back Office & Operations</option>
                  <option value="Permanent">👔 Executive Placement</option>
                  <option value="Bulk">🏭 Bulk Staffing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 12px", textTransform: "uppercase" }}>
              3. Base Location
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>State</label>
                <select
                  value={selectedState.name}
                  onChange={(e) => {
                    const s = selectedCountry.states.find((st) => st.name === e.target.value) || selectedCountry.states[0];
                    setSelectedState(s);
                    setSelectedCity(s.cities[0] || "Noida");
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                >
                  {selectedCountry.states.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
                >
                  {selectedState.cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Driver Credentials Card (When Driver selected) */}
          {isDriver && (
            <div style={{ background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#854D0E", margin: "0 0 12px" }}>
                🚚 Verified Driver Credentials
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                    DL Category *
                  </label>
                  <select
                    value={dlCategory}
                    onChange={(e) => setDlCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #FDE047", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  >
                    <option value="Commercial">Commercial (HMV + LMV Badge)</option>
                    <option value="HMV">Heavy Motor Vehicle (HMV)</option>
                    <option value="LMV">Light Motor Vehicle (LMV Chauffeur)</option>
                    <option value="TwoWheeler">Two-Wheeler Delivery</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                    Driving License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={drivingLicenseNumber}
                    onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                    placeholder="e.g. UP1420260012345"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #FDE047", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                    Police Verification Status
                  </label>
                  <select
                    value={policeVerificationStatus}
                    onChange={(e) => setPoliceVerificationStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #FDE047", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  >
                    <option value="Verified">✅ Verified Certificate on File</option>
                    <option value="Pending">⏳ Pending / In Progress</option>
                    <option value="NotSubmitted">📄 Will Submit Later</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                    Expected Monthly Salary (₹)
                  </label>
                  <input
                    type="text"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="e.g. ₹32,000"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #FDE047", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                  Vehicle Types Qualified to Operate:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {VEHICLE_OPTIONS.map((veh) => (
                    <button
                      key={veh}
                      type="button"
                      onClick={() => toggleVehicle(veh)}
                      style={{
                        background: selectedVehicles.includes(veh) ? "#EAB308" : "#FFFFFF",
                        color: selectedVehicles.includes(veh) ? "#000000" : "#713F12",
                        border: "1px solid #FDE047",
                        padding: "5px 12px",
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {selectedVehicles.includes(veh) ? "✓ " : "+ "} {veh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Custom Password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
              Custom Initial Password (Optional)
            </label>
            <input
              type="text"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Leave blank to auto-generate (e.g. RS@3210!)"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              padding: "14px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            }}
          >
            {loading ? "Provisioning..." : `✓ Provision ${isDriver ? "Driver" : "Candidate"} & Generate Credentials`}
          </button>
        </form>
      )}
    </div>
  );
}
