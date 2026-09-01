"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COUNTRIES_DATA, getCountryByCode, CountryData, StateData } from "@/lib/geoData";

const INITIAL_CATEGORY_SKILLS: Record<string, string[]> = {
  IT: [
    "React.js",
    "Next.js",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "Python",
    "FastAPI",
    "Django",
    "Java",
    "C++",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "AWS Cloud",
    "Git & GitHub",
    "RESTful APIs",
    "Tailwind CSS",
  ],
  "Sales&Marketing": [
    "B2B Lead Generation",
    "Cold Calling",
    "Client Relationship Management",
    "Field Sales Operations",
    "Digital Marketing & SEO",
    "Salesforce / HubSpot CRM",
    "Contract Negotiations",
    "Key Account Management",
    "Market Research",
  ],
  BPO: [
    "Inbound Customer Support",
    "Outbound Telecalling",
    "Voice & Accent Support",
    "Escalation & Conflict Resolution",
    "CRM & Ticketing (Zendesk)",
    "Email & Live Chat Support",
    "Customer Satisfaction (CSAT)",
  ],
  BackOffice: [
    "Data Entry & Typing",
    "MS Excel (VLOOKUP/Pivot)",
    "MIS Reporting",
    "Tally Prime / ERP 9",
    "Invoicing & Billing",
    "Document Verification",
    "Office Administration",
  ],
  Permanent: [
    "Executive Search",
    "Leadership & Team Building",
    "Strategic Planning",
    "P&L Management",
    "Talent Acquisition",
    "Stakeholder Relations",
  ],
  Bulk: [
    "Warehouse Operations",
    "Assembly Line Assembly",
    "Packaging & Quality Inspection",
    "Inventory Dispatch",
    "Shift Operations",
    "Industrial Safety Protocols",
  ],
  Driver: [
    "Commercial Heavy Vehicle (HMV)",
    "Commercial Light Vehicle (LMV)",
    "Pan-India Route Navigation",
    "Container Truck Operations",
    "Night Route Long Haul",
    "Vehicle Inspection & Upkeep",
    "GPS Fleet Tracking",
    "Safe Goods Transport",
  ],
};

const VEHICLE_OPTIONS = [
  "Heavy Commercial Truck",
  "Container / 14-Wheeler",
  "Delivery Van / Chhota Hathi",
  "Commercial Sedan / SUV Chauffeur",
  "Electric Commercial Fleet",
];

export default function CandidateProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  // Country & Location Hierarchy
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(COUNTRIES_DATA[0]);
  const [selectedState, setSelectedState] = useState<StateData>(COUNTRIES_DATA[0].states[0]);
  const [selectedCity, setSelectedCity] = useState<string>(COUNTRIES_DATA[0].states[0].cities[0]);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");

  // Mobile
  const [mobileNumber, setMobileNumber] = useState("");

  // Category & Preferences
  const [preferredCategory, setPreferredCategory] = useState("IT");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("Immediate");
  const [preferredJobLocation, setPreferredJobLocation] = useState("Open to Relocate Pan-India");

  // Driver Specific Fields
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [dlCategory, setDlCategory] = useState("Commercial");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(["Heavy Commercial Truck"]);
  const [policeVerificationStatus, setPoliceVerificationStatus] = useState("Verified");

  // Dynamic Skills & Search Combobox State
  const [allCategorySkills, setAllCategorySkills] = useState<string[]>(INITIAL_CATEGORY_SKILLS["IT"]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Load candidate profile
  useEffect(() => {
    fetch("/api/candidates/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.candidate) {
          const c = data.candidate;
          if (c.fullName) setFullName(c.fullName);
          if (c.email) setEmail(c.email);

          // Mobile parsing
          if (c.mobile) {
            const raw = String(c.mobile).trim();
            let matchedCountry = COUNTRIES_DATA[0];
            for (const country of COUNTRIES_DATA) {
              if (raw.startsWith(country.dialCode)) {
                matchedCountry = country;
                break;
              }
            }
            setSelectedCountry(matchedCountry);
            const digits = raw.replace(matchedCountry.dialCode, "").replace(/\D/g, "");
            setMobileNumber(digits);
          }

          if (c.preferredCategory) {
            setPreferredCategory(c.preferredCategory);
            loadCategorySkills(c.preferredCategory);
          } else {
            loadCategorySkills("IT");
          }

          // Location parsing
          if (c.currentLocation) {
            const city = c.currentLocation.split(",")[0].trim();
            let isFound = false;
            for (const state of selectedCountry.states) {
              if (state.cities.includes(city)) {
                setSelectedState(state);
                setSelectedCity(city);
                setIsCustomCity(false);
                isFound = true;
                break;
              }
            }
            if (!isFound) {
              setIsCustomCity(true);
              setCustomCity(city);
            }
          }

          if (c.preferredJobLocation) setPreferredJobLocation(c.preferredJobLocation);
          if (c.experienceLevel) setExperienceLevel(c.experienceLevel);
          if (c.expectedSalary) setExpectedSalary(c.expectedSalary);
          if (c.noticePeriod) setNoticePeriod(c.noticePeriod);

          // Driver details
          if (c.drivingLicenseNumber) setDrivingLicenseNumber(c.drivingLicenseNumber);
          if (c.dlCategory) setDlCategory(c.dlCategory);
          if (c.vehicleTypes) {
            try {
              setSelectedVehicles(JSON.parse(c.vehicleTypes));
            } catch (e) {
              setSelectedVehicles(c.vehicleTypes.split(",").map((v: string) => v.trim()));
            }
          }
          if (c.policeVerificationStatus) setPoliceVerificationStatus(c.policeVerificationStatus);

          // Skills
          if (c.skills && c.skills.length > 0) {
            setSelectedSkills(c.skills.map((s: any) => s.skill?.name || s));
          } else {
            setSelectedSkills(INITIAL_CATEGORY_SKILLS[c.preferredCategory || "IT"]?.slice(0, 3) || []);
          }

          if (c.currentLocation && c.skills && c.skills.length > 0) {
            setIsProfileComplete(true);
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dynamic skills from DB for a category
  function loadCategorySkills(category: string) {
    const baseList = INITIAL_CATEGORY_SKILLS[category] || INITIAL_CATEGORY_SKILLS["IT"];
    fetch(`/api/skills?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.skills && Array.isArray(data.skills)) {
          const dbSkillNames = data.skills.map((s: any) => s.name);
          const combined = Array.from(new Set([...baseList, ...dbSkillNames]));
          setAllCategorySkills(combined);
        } else {
          setAllCategorySkills(baseList);
        }
      })
      .catch(() => setAllCategorySkills(baseList));
  }

  function handleCategoryChange(newCategory: string) {
    setPreferredCategory(newCategory);
    loadCategorySkills(newCategory);
    const categorySkills = INITIAL_CATEGORY_SKILLS[newCategory] || [];
    setSelectedSkills(categorySkills.slice(0, 3));
    setSkillSearchQuery("");
  }

  function handleCountryChange(countryCode: string) {
    const country = getCountryByCode(countryCode);
    setSelectedCountry(country);
    if (country.states.length > 0) {
      const firstState = country.states[0];
      setSelectedState(firstState);
      if (firstState.cities.length > 0) {
        setSelectedCity(firstState.cities[0]);
        setIsCustomCity(false);
      } else {
        setIsCustomCity(true);
        setCustomCity("");
      }
    } else {
      setIsCustomCity(true);
      setCustomCity("");
    }
  }

  function handleStateChange(stateName: string) {
    const state = selectedCountry.states.find((s) => s.name === stateName) || selectedCountry.states[0];
    setSelectedState(state);
    if (state.cities.length > 0) {
      setSelectedCity(state.cities[0]);
      setIsCustomCity(false);
    } else {
      setIsCustomCity(true);
      setCustomCity("");
    }
  }

  // Smart skill normalizer & deduplicator
  function normalizeAndMatchSkill(input: string): string {
    const raw = input.trim();
    if (!raw) return "";

    // 1. Check for case-insensitive match in current pool
    const matched = allCategorySkills.find(
      (s) => s.toLowerCase() === raw.toLowerCase() ||
             s.toLowerCase().replace(/[\s\.-]/g, "") === raw.toLowerCase().replace(/[\s\.-]/g, "")
    );
    if (matched) return matched;

    // 2. Acronym rules for tech & domain abbreviations
    const uppercaseAcronyms = ["SQL", "AWS", "GCP", "API", "APIs", "REST", "CRM", "SEO", "SEM", "MIS", "ERP", "HMV", "LMV", "BPO", "CSAT", "P&L", "HTML", "CSS", "UI", "UX", "C++", "C#", "PHP"];
    
    return raw
      .split(/\s+/)
      .map((word) => {
        const upperWord = word.toUpperCase();
        if (uppercaseAcronyms.includes(upperWord)) return upperWord;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  async function handleAddSkill(skillToAdd: string) {
    const normalized = normalizeAndMatchSkill(skillToAdd);
    if (!normalized) return;

    // Add to active badges if not already present
    if (!selectedSkills.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
      setSelectedSkills([...selectedSkills, normalized]);
    }

    // If it's a new skill not in allCategorySkills, persist to DB so future candidates can use it!
    if (!allCategorySkills.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
      setAllCategorySkills((prev) => [...prev, normalized]);
      try {
        await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: normalized, category: preferredCategory }),
        });
      } catch (e) {
        console.error("Failed to persist new skill to DB:", e);
      }
    }

    setSkillSearchQuery("");
    setIsComboboxOpen(false);
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSelectedSkills(selectedSkills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase()));
  }

  function toggleVehicle(vehicle: string) {
    if (selectedVehicles.includes(vehicle)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v !== vehicle));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    const cleanDigits = mobileNumber.replace(/\D/g, "");
    if (selectedCountry.dialCode === "+91" && cleanDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number for India (+91).");
      setSaving(false);
      return;
    }

    if (selectedSkills.length === 0) {
      setError("Please select or search at least one core skill.");
      setSaving(false);
      return;
    }

    const finalCity = isCustomCity ? customCity.trim() || "Other" : selectedCity;
    const locationString = `${finalCity}, ${selectedState.name}`;

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("countryCode", selectedCountry.dialCode);
    formData.append("mobile", cleanDigits);
    formData.append("email", email);
    formData.append("currentLocation", locationString);
    formData.append("preferredJobLocation", preferredJobLocation);
    formData.append("preferredCategory", preferredCategory);
    formData.append("experienceLevel", experienceLevel);
    formData.append("expectedSalary", expectedSalary);
    formData.append("noticePeriod", noticePeriod);
    formData.append("skills", JSON.stringify(selectedSkills));

    if (preferredCategory === "Driver") {
      formData.append("drivingLicenseNumber", drivingLicenseNumber);
      formData.append("dlCategory", dlCategory);
      formData.append("vehicleTypes", JSON.stringify(selectedVehicles));
      formData.append("policeVerificationStatus", policeVerificationStatus);
    }

    try {
      const res = await fetch("/api/candidates/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      setIsProfileComplete(true);
      setSuccessMsg("Profile saved successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.replace("/candidate/dashboard");
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
        Loading your candidate profile...
      </div>
    );
  }

  const isSetupMode = !isProfileComplete;
  const isDriver = preferredCategory === "Driver";

  // Filter skills based on search query
  const filteredSkills = allCategorySkills.filter((s) =>
    s.toLowerCase().includes(skillSearchQuery.toLowerCase().trim())
  );

  const exactMatchExists = allCategorySkills.some(
    (s) => s.toLowerCase() === skillSearchQuery.toLowerCase().trim()
  );

  return (
    <div style={{ maxWidth: 840, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Header & Step Indicator */}
      <div style={{ marginBottom: 24 }}>
        {!isSetupMode && (
          <Link href="/candidate/dashboard" style={{ color: "#2563EB", textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-block", marginBottom: 12 }}>
            ← Back to Dashboard
          </Link>
        )}
        
        {isSetupMode ? (
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "#2563EB", color: "#FFF", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                2
              </span>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1E40AF", margin: 0 }}>
                  Step 2 of 2: Complete Your Professional Profile
                </h1>
                <p style={{ color: "#3B82F6", margin: "2px 0 0", fontSize: 13 }}>
                  Search your skills and configure your base location to unlock the job board and resume manager.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
                Candidate Profile & Credentials
              </h1>
              <p style={{ color: "#475569", margin: 0, fontSize: 14 }}>
                Manage your credentials, location preferences, and category-specific skill tags.
              </p>
            </div>
            {!isDriver && (
              <Link
                href="/candidate/resumes"
                style={{ background: "#F1F5F9", color: "#0F172A", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}
              >
                Manage CVs ↗
              </Link>
            )}
          </div>
        )}
      </div>

      {successMsg && (
        <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 32, display: "grid", gap: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        
        {/* Section 1: Contact Details & Country */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 14px", textTransform: "uppercase" }}>
            1. Personal & Contact Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Someshwar Sahu"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="someshwar@example.com"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Country *</label>
              <select
                value={selectedCountry.code}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              >
                {COUNTRIES_DATA.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                Mobile Number (10 Digits) *
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    color: "#0F172A",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    minWidth: 64,
                    textAlign: "center",
                  }}
                >
                  {selectedCountry.dialCode}
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="8960244540"
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Hiring Category & Location */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 14px", textTransform: "uppercase" }}>
            2. Hiring Domain & Base Location
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            
            {/* Category Selector */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                Hiring Category *
              </label>
              <select
                value={preferredCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "2px solid #2563EB", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF", fontWeight: 600 }}
              >
                <option value="IT">🏢 IT & Software Engineering</option>
                <option value="Sales&Marketing">💼 Sales & Marketing</option>
                <option value="BPO">🎧 BPO & Customer Support</option>
                <option value="BackOffice">📊 Back Office & Operations</option>
                <option value="Permanent">👔 Permanent Executive Placement</option>
                <option value="Bulk">🏭 Bulk & Industrial Staffing</option>
                <option value="Driver">🚚 Driver & Commercial Fleet (Distinct Track)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Experience Level *</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              >
                <option value="Fresher">Fresher (0 Years)</option>
                <option value="Intermediate">Intermediate (1–3 Years)</option>
                <option value="Expert">Expert (3+ Years)</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                State / Region in {selectedCountry.name} *
              </label>
              <select
                value={selectedState.name}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              >
                {selectedCountry.states.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                City *
              </label>
              {!isCustomCity && selectedState.cities.length > 0 ? (
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    if (e.target.value === "OTHER") {
                      setIsCustomCity(true);
                    } else {
                      setSelectedCity(e.target.value);
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                >
                  {selectedState.cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                  <option value="OTHER">+ Other City (Type manually)</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder={`Enter city in ${selectedState.name}`}
                    style={{ flex: 1, padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                  {selectedState.cities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomCity(false)}
                      style={{ background: "#E2E8F0", border: "none", padding: "0 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#0F172A" }}
                    >
                      List
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                {isDriver ? "Expected Monthly Salary (₹)" : "Expected CTC (LPA)"}
              </label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder={isDriver ? "e.g. ₹35,000 / month" : "e.g. 18 LPA"}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Relocation & Route Preference</label>
              <select
                value={preferredJobLocation}
                onChange={(e) => setPreferredJobLocation(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              >
                <option value="Open to Relocate Pan-India">✅ Pan-India / Interstate Routes</option>
                <option value="Preferred Delhi NCR">🏢 Delhi / NCR Local Hubs</option>
                <option value="Home State Only">🏡 Home State / City Only</option>
                {!isDriver && <option value="Remote Work Only">💻 Remote Work Only</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Driver Qualifications (When Driver is chosen) */}
        {isDriver && (
          <div style={{ background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#854D0E", margin: "0 0 14px", textTransform: "uppercase" }}>
              🚚 Distinct Driver & Fleet Qualifications
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                  Driving License Category *
                </label>
                <select
                  value={dlCategory}
                  onChange={(e) => setDlCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #FDE047", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                >
                  <option value="Commercial">Commercial (HMV + LMV Badge)</option>
                  <option value="HMV">Heavy Motor Vehicle (HMV Heavy Transport)</option>
                  <option value="LMV">Light Motor Vehicle (LMV Chauffeur)</option>
                  <option value="TwoWheeler">Two-Wheeler Commercial Delivery</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 6 }}>
                  Driving License Number
                </label>
                <input
                  type="text"
                  value={drivingLicenseNumber}
                  onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                  placeholder="e.g. DL-1420260012345"
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
                  <option value="Verified">✅ Verified Certificate Available</option>
                  <option value="Pending">⏳ Pending / In Progress</option>
                  <option value="NotSubmitted">📄 Will Submit Post-Selection</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#713F12", marginBottom: 8 }}>
                Vehicle Types Operated (Select all that apply):
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {VEHICLE_OPTIONS.map((veh) => (
                  <button
                    type="button"
                    key={veh}
                    onClick={() => toggleVehicle(veh)}
                    style={{
                      background: selectedVehicles.includes(veh) ? "#EAB308" : "#FFFFFF",
                      color: selectedVehicles.includes(veh) ? "#000000" : "#713F12",
                      border: "1px solid #FDE047",
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {selectedVehicles.includes(veh) ? "✓ " : "+ "}
                    {veh}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Modern Searchable Skill Combobox */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, textTransform: "uppercase" }}>
              3. Skills & Competencies ({preferredCategory}) *
            </h2>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Type to search & add
            </span>
          </div>
          <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 12px" }}>
            Search skills or type a new skill to add it permanently to the {preferredCategory} database.
          </p>

          {/* Active Skill Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, minHeight: 36 }}>
            {selectedSkills.map((s) => (
              <span key={s} style={{ background: "#2563EB", color: "#FFF", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 16, display: "flex", alignItems: "center", gap: 6 }}>
                {s}
                <button type="button" onClick={() => handleRemoveSkill(s)} style={{ background: "none", border: "none", color: "#FFF", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
              </span>
            ))}
          </div>

          {/* Searchable Combobox */}
          <div ref={comboboxRef} style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={skillSearchQuery}
                onFocus={() => setIsComboboxOpen(true)}
                onChange={(e) => {
                  setSkillSearchQuery(e.target.value);
                  setIsComboboxOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skillSearchQuery.trim()) {
                      handleAddSkill(skillSearchQuery);
                    }
                  }
                }}
                placeholder={`🔍 Search ${preferredCategory} skills (e.g. Python, React, CRM, Tally...) or type new skill...`}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  fontWeight: 500,
                }}
              />
              {skillSearchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillSearchQuery)}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0 18px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              )}
            </div>

            {/* Dropdown Results Box */}
            {isComboboxOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  maxHeight: 240,
                  overflowY: "auto",
                  zIndex: 50,
                }}
              >
                {filteredSkills.filter((s) => !selectedSkills.includes(s)).length > 0 ? (
                  filteredSkills
                    .filter((s) => !selectedSkills.includes(s))
                    .map((skill) => (
                      <div
                        key={skill}
                        onClick={() => handleAddSkill(skill)}
                        style={{
                          padding: "10px 14px",
                          fontSize: 14,
                          color: "#0F172A",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        <span>{skill}</span>
                        <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 600 }}>+ Add</span>
                      </div>
                    ))
                ) : (
                  <div style={{ padding: "12px 14px", fontSize: 13, color: "#64748B" }}>
                    No matching existing skills found for &quot;{skillSearchQuery}&quot;
                  </div>
                )}

                {/* Add New Custom Skill Button */}
                {skillSearchQuery.trim() && !exactMatchExists && (
                  <div
                    onClick={() => handleAddSkill(skillSearchQuery)}
                    style={{
                      padding: "12px 14px",
                      background: "#F8FAFC",
                      borderTop: "2px solid #E2E8F0",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2563EB",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ✨ Add &quot;{skillSearchQuery.trim()}&quot; as new permanent skill for {preferredCategory}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            padding: "14px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
          }}
        >
          {saving ? "Saving Profile..." : "Save Profile & Continue to Dashboard →"}
        </button>
      </form>
    </div>
  );
}
