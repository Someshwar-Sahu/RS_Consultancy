"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateSetting(key: string, value: string) {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div style={{ maxWidth: 850, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/admin/dashboard" style={{ color: "#2563EB", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "8px 0 4px" }}>System Feature Flags & Settings</h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Control live platform behaviors, transparency stats visibility, and business configuration without redeploying code.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading system settings...</div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Setting 1: Stats Page as Home */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 15 }}>Transparency Stats on Homepage</div>
              <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>
                If enabled, redirects root landing page to aggregate verified placement statistics.
              </div>
            </div>
            <button
              onClick={() => updateSetting("stats_page_is_home", settings["stats_page_is_home"] === "true" ? "false" : "true")}
              disabled={savingKey === "stats_page_is_home"}
              style={{
                background: settings["stats_page_is_home"] === "true" ? "#16A34A" : "#E2E8F0",
                color: settings["stats_page_is_home"] === "true" ? "#FFF" : "#334155",
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {settings["stats_page_is_home"] === "true" ? "Active (Enabled)" : "Disabled (Standard Landing)"}
            </button>
          </div>

          {/* Setting 2: GST Registration Number */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 15, marginBottom: 4 }}>
              Firm GSTIN (Goods & Services Tax ID)
            </div>
            <div style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>
              Printed on official invoice drafts generated for client branches.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                defaultValue={settings["firm_gstin"] || "07AABCR1234F1Z5"}
                id="firm_gstin_input"
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 14 }}
              />
              <button
                onClick={() => {
                  const val = (document.getElementById("firm_gstin_input") as HTMLInputElement)?.value;
                  updateSetting("firm_gstin", val);
                }}
                disabled={savingKey === "firm_gstin"}
                style={{ background: "#2563EB", color: "#FFF", padding: "8px 16px", borderRadius: 6, border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                {savingKey === "firm_gstin" ? "Saving..." : "Save GSTIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
