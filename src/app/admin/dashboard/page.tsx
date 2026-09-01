"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/financials")
      .then((r) => r.json())
      .then((data) => {
        if (data.financials) setFinancials(data.financials);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
            Admin & Founder Portal
          </h1>
          <p style={{ color: "#64748B", margin: 0 }}>
            Executive oversight: Firm revenue, invoices, active placements, and site configurations.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/admin/verifications"
            style={{ background: "#F1F5F9", color: "#0F172A", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
          >
            🛡️ Contact Verifications
          </Link>
          <Link
            href="/admin/settings"
            style={{ background: "#2563EB", color: "#FFF", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
          >
            ⚙️ Site Settings
          </Link>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Total Billed Revenue</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
            ₹{financials ? Number(financials.totalRevenue || 0).toLocaleString("en-IN") : "0"}
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Paid Invoices</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#16A34A", marginTop: 4 }}>
            ₹{financials ? Number(financials.paidAmount || 0).toLocaleString("en-IN") : "0"}
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Pending & Overdue</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#DC2626", marginTop: 4 }}>
            ₹{financials ? Number(financials.pendingAmount || 0).toLocaleString("en-IN") : "0"}
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Active Placements</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#2563EB", marginTop: 4 }}>
            {financials?.placementsCount || 0}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Link
          href="/admin/placements"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 24,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
            📋 Placements & Resignation Review →
          </h2>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
            Manage successful candidate placements, calculate commissions, and verify exit proofs for free replacement triggers.
          </p>
        </Link>

        <Link
          href="/admin/settings"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: 24,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
            ⚙️ System Configuration & Feature Flags →
          </h2>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
            Toggle public stats pages, manage GST registration details, and configure WhatsApp/Email alerts.
          </p>
        </Link>
      </div>
    </div>
  );
}
