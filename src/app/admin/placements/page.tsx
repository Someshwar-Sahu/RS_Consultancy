"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Placement {
  id: string;
  agreedCtc: string;
  commissionRateApplied: string;
  commissionAmount: string;
  isActive: boolean;
  replacementStatus: string;
  resignationProofUrl: string | null;
  joiningDate: string;
  application: {
    candidate: { fullName: string };
    requirement: { title: string; branch: { company: { name: string } } };
  };
  invoice?: {
    invoiceNumber: string;
    status: string;
    totalAmount: string;
  } | null;
}

export default function AdminPlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlacements();
  }, []);

  function fetchPlacements() {
    fetch("/api/admin/financials")
      .then((r) => r.json())
      .then((data) => {
        if (data.placements) setPlacements(data.placements);
      })
      .finally(() => setLoading(false));
  }

  async function handleVerifyResignation(placementId: string) {
    setVerifyingId(placementId);
    try {
      const res = await fetch(`/api/placements/${placementId}/resignation/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      if (res.ok) {
        fetchPlacements();
        alert("Resignation verified! Placement deactivated and job requirement reopened for free replacement.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/admin/dashboard" style={{ color: "#2563EB", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "8px 0 4px" }}>Placements & Invoicing Ledger</h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Full financial records of successful placements, calculated commissions, draft invoices, and exit replacement reviews.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading placement records...</div>
      ) : placements.length === 0 ? (
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10, padding: 36, textAlign: "center", color: "#64748B" }}>
          No placements recorded in the system yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {placements.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
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
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                    {p.application.candidate.fullName}
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    → {p.application.requirement.title} ({p.application.requirement.branch.company.name})
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: p.isActive ? "#DCFCE7" : "#FEE2E2",
                      color: p.isActive ? "#166534" : "#991B1B",
                    }}
                  >
                    {p.isActive ? "ACTIVE PLACEMENT" : "DEACTIVATED / EXITED"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#334155", marginTop: 8 }}>
                  <span>Agreed CTC: <strong>₹{Number(p.agreedCtc).toLocaleString("en-IN")}</strong></span>
                  <span>Commission: <strong>{p.commissionRateApplied}% (₹{Number(p.commissionAmount).toLocaleString("en-IN")})</strong></span>
                  <span>Joining Date: {new Date(p.joiningDate).toLocaleDateString()}</span>
                </div>

                {p.invoice && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                    Invoice: <strong>{p.invoice.invoiceNumber}</strong> | Status: <strong>{p.invoice.status}</strong> | Total: ₹{Number(p.invoice.totalAmount).toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              {/* Resignation Proof Verification Gate (Rule 6) */}
              {p.replacementStatus === "ResignationSubmitted" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>⚠️ Exit Proof Awaiting Review</span>
                  <button
                    onClick={() => handleVerifyResignation(p.id)}
                    disabled={verifyingId === p.id}
                    style={{
                      background: "#2563EB",
                      color: "#FFF",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {verifyingId === p.id ? "Verifying..." : "Verify & Reopen Vacancy"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
