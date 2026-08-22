"use client";

import { useState, useEffect } from "react";

interface ApplicationItem {
  id: string;
  status: string;
  createdAt: string;
  candidate: {
    fullName: string;
    email: string;
    mobile: string;
    experienceLevel: string;
    resumeUrl: string | null;
    skills: Array<{ skill: { name: string } }>;
  };
  requirement: {
    title: string;
    branch: {
      company: {
        name: string;
      };
    };
  };
}

const STAGES = [
  "Applied",
  "Shortlisted",
  "InterviewScheduled",
  "Offered",
  "Joined",
  "Rejected",
  "Withdrawn",
];

export default function EmployeeCandidatesPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPipeline();
  }, [selectedStatus]);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const url = selectedStatus
        ? `/api/employee/candidates?status=${selectedStatus}`
        : "/api/employee/candidates";
      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to load pipeline", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, toStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const res = await fetch("/api/employee/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, toStatus }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: toStatus } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Candidate Pipeline</h1>
            <p className="text-sm text-slate-600 mt-1">
              Screen, shortlist, and manage candidate hiring stages.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-blue-500 text-slate-900 bg-white"
            >
              <option value="">All Pipeline Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading pipeline applications...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-600 font-medium">No candidate applications in this view.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{app.candidate.fullName}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700">
                      {app.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    🎯 Applied for: <span className="font-semibold">{app.requirement.title}</span> at{" "}
                    {app.requirement.branch.company.name}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>📧 {app.candidate.email}</span>
                    <span>📱 {app.candidate.mobile}</span>
                    <span>⭐ Exp: {app.candidate.experienceLevel}</span>
                    {app.candidate.resumeUrl && (
                      <a
                        href={app.candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        📄 View Resume
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Move Stage:</label>
                  <select
                    value={app.status}
                    disabled={updatingId === app.id}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-900 bg-white focus:ring-blue-500 disabled:opacity-50"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
