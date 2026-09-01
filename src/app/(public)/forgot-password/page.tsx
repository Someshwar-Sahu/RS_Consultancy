"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset code.");

      if (data.devOtp) setDevOtp(data.devOtp);
      setInfoMsg(data.message || `A 6-digit reset code has been sent to ${email}`);
      setStep("OTP");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");

      alert("Password successfully reset! Please sign in with your new password.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: "32px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 440, width: "100%", background: "#FFFFFF", padding: 36, borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
              RS Bridge Consultancy
            </div>
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", margin: "6px 0 0" }}>
            {step === "EMAIL" ? "Forgot Password" : "Reset Your Password"}
          </h1>
          <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0" }}>
            {step === "EMAIL"
              ? "Enter your email to receive a 6-digit verification code."
              : `Enter the code sent to ${email} and your new password.`}
          </p>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {infoMsg && (
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF", padding: "10px 14px", borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
            {infoMsg}
            {devOtp && (
              <div style={{ marginTop: 6, fontWeight: 700, color: "#1D4ED8" }}>
                [Dev Code: {devOtp}]
              </div>
            )}
          </div>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                Registered Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
              }}
            >
              {loading ? "Sending Code..." : "Send Verification Code →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                6-Digit Verification OTP *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 16, letterSpacing: 4, textAlign: "center", color: "#0F172A", background: "#FFF", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
              }}
            >
              {loading ? "Resetting Password..." : "Update Password & Sign In →"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#64748B", borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
          Remember your password?{" "}
          <Link href="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
