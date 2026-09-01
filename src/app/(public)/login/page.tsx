"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any)?.role;
      if (role === "ADMIN") {
        router.replace("/admin");
      } else if (role === "EMPLOYEE") {
        router.replace("/employee");
      } else if (role === "COMPANY_CONTACT") {
        router.replace("/company");
      } else {
        router.replace("/candidate/dashboard");
      }
    }
  }, [session, status, router]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Candidate Signup Form State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+91");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // OTP Verification Step
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email/password or account pending Admin approval.");
      } else {
        // Fetch session to determine exact role for instant redirect
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;
        
        if (role === "ADMIN") {
          router.replace("/admin/dashboard");
        } else if (role === "EMPLOYEE") {
          router.replace("/employee/candidates");
        } else if (role === "COMPANY_CONTACT") {
          router.replace("/company/dashboard");
        } else {
          router.replace("/candidate/dashboard");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP for Candidate Registration
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanMobile = signupMobile.replace(/\D/g, "");
    if (signupCountryCode === "+91" && cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number for India (+91).");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail.toLowerCase().trim(),
          mobile: `${signupCountryCode} ${cleanMobile}`,
          type: "SIGNUP",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch verification code.");

      if (data.otpCode) setDevOtp(data.otpCode);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize Account Creation
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Verify OTP
      const otpRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail.toLowerCase().trim(),
          otpCode: enteredOtp.trim(),
          type: "SIGNUP",
        }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Invalid verification code.");

      // 2. Create Candidate Profile & Credentials
      const cleanMobile = signupMobile.replace(/\D/g, "");
      const formData = new FormData();
      formData.append("fullName", signupName);
      formData.append("countryCode", signupCountryCode);
      formData.append("mobile", cleanMobile);
      formData.append("email", signupEmail.toLowerCase().trim());
      formData.append("password", signupPassword);
      formData.append("preferredCategory", "IT");

      const regRes = await fetch("/api/candidates/register", {
        method: "POST",
        body: formData,
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Account creation failed.");

      // 3. Automatically Log In
      await signIn("credentials", {
        email: signupEmail.toLowerCase().trim(),
        password: signupPassword,
        redirect: false,
      });

      router.push("/candidate/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: "32px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 450, width: "100%", background: "#FFFFFF", padding: 36, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.06)" }}>
        
        {/* Logo & Platform Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
              RS Bridge Consultancy
            </div>
          </Link>
          <p style={{ color: "#64748B", fontSize: 13.5, margin: 0 }}>
            Executive Search & Strategic Staffing Division
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#F1F5F9", padding: 4, borderRadius: 10, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setError(""); setOtpSent(false); }}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              background: activeTab === "login" ? "#FFFFFF" : "transparent",
              color: activeTab === "login" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("signup"); setError(""); setOtpSent(false); }}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              background: activeTab === "signup" ? "#FFFFFF" : "transparent",
              color: activeTab === "signup" ? "#0F172A" : "#64748B",
              boxShadow: activeTab === "signup" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Candidate Sign Up
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === "login" ? (
          <div>
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  padding: "12px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                  marginTop: 4,
                }}
              >
                {loading ? "Signing in..." : "Sign In to Portal →"}
              </button>
            </form>

            {/* Dedicated Employer Box (Prevents Public Spam) */}
            <div style={{ marginTop: 28, padding: 16, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                🏢 Are you an Employer / Hiring Partner?
              </div>
              <p style={{ color: "#64748B", fontSize: 12, margin: "0 0 10px", lineHeight: 1.4 }}>
                Company accounts are provisioned via verified contracts. Submit a sourcing inquiry to onboard your branch.
              </p>
              <Link
                href="/companies/inquire"
                style={{
                  display: "inline-block",
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Submit Employer Inquiry →
              </Link>
            </div>
          </div>
        ) : (
          /* TAB 2: CANDIDATE SIGN UP WITH OTP */
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestSignupOtp} style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Someshwar Sahu"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="someshwar@example.com"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    Mobile Number (10 Digits) *
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      value={signupCountryCode}
                      onChange={(e) => setSignupCountryCode(e.target.value)}
                      style={{ width: 105, padding: "9px 6px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, color: "#0F172A", background: "#FFF" }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      style={{ flex: 1, padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                    marginTop: 6,
                  }}
                >
                  {loading ? "Sending Verification Code..." : "Verify Email & Continue →"}
                </button>
              </form>
            ) : (
              /* OTP VERIFICATION STEP */
              <form onSubmit={handleVerifyOtpAndCreateAccount} style={{ display: "grid", gap: 16 }}>
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", padding: 14, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#1E40AF", fontWeight: 600 }}>
                    Verification code sent to:
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {signupEmail}
                  </div>
                  {devOtp && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
                      [Dev Test Code: {devOtp}]
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 18, letterSpacing: 4, textAlign: "center", color: "#0F172A", background: "#FFF", fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{ flex: 1, background: "#F1F5F9", color: "#334155", padding: "10px", borderRadius: 8, border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                  >
                    ← Edit Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, background: "#2563EB", color: "#FFF", padding: "10px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                  >
                    {loading ? "Verifying..." : "Verify & Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
