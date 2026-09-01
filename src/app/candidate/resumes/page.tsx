"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Resume {
  id: string;
  label: string;
  fileUrl: string;
  isDefault: boolean;
  uploadedAt: string;
}

export default function CandidateResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/candidates/dashboard")
      .then((r) => r.json())
      .then((data) => {
        const c = data?.candidate;
        if (!c || !c.currentLocation || !c.skills || c.skills.length === 0) {
          router.replace("/candidate/profile");
          return;
        }

        if (data.resumes) setResumes(data.resumes);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [router]);

  function fetchResumes() {
    fetch("/api/candidates/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (data.resumes) setResumes(data.resumes);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("label", label || "General CV");
    formData.append("isDefault", isDefault ? "true" : "false");

    try {
      const res = await fetch("/api/candidates/resumes", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload resume.");

      setLabel("");
      setFile(null);
      setIsDefault(false);
      fetchResumes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSetDefault(resumeId: string) {
    try {
      const res = await fetch("/api/candidates/resumes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, isDefault: true }),
      });
      if (res.ok) fetchResumes();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
        Loading your resumes...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 850, margin: "40px auto", padding: "0 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/candidate/dashboard" style={{ color: "#2563EB", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "8px 0 4px" }}>Resume Version Manager</h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: 14 }}>
          Maintain multiple tailored CV versions (e.g. Fullstack, Backend, Sales) to attach selectively when applying to jobs.
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Upload New Resume Card */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>Upload New Resume Version</h2>
        <form onSubmit={handleUpload}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                Resume Label *
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Full-Stack / React CV"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FFF" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                PDF File *
              </label>
              <input
                type="file"
                required
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ width: "100%", padding: "8px 0", fontSize: 14, color: "#0F172A" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 500 }}>
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Set as primary default resume
            </label>

            <button
              type="submit"
              disabled={uploading || !file}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: uploading || !file ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
              }}
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Resumes List */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Your Stored Resumes</h2>
      {resumes.length === 0 ? (
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10, padding: 36, textAlign: "center", color: "#64748B" }}>
          No resumes uploaded yet. Upload your first resume above.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {resumes.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{r.label}</span>
                  {r.isDefault && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: 10 }}>
                      PRIMARY DEFAULT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  Uploaded on {new Date(r.uploadedAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {!r.isDefault && (
                  <button
                    onClick={() => handleSetDefault(r.id)}
                    style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#0F172A", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Make Default
                  </button>
                )}
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: "#2563EB", color: "#FFF", padding: "7px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}
                >
                  View PDF ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
