"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  hiringCategory: string;
  noOfVacancies: number;
  minExperienceYears: number;
  maxSalaryLpa: number | null;
  city: string;
  companyName: string;
  skills: string[];
  createdAt: string;
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/jobs?category=${encodeURIComponent(selectedCategory)}`
        : "/api/jobs";
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Current Job Openings</h1>
            <p className="text-sm text-slate-600 mt-1">
              Explore open positions across NCR hiring lines.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
            >
              <option value="">All Categories</option>
              <option value="IT">IT & Technical</option>
              <option value="Sales&Marketing">Sales & Marketing</option>
              <option value="BPO">BPO & Customer Support</option>
              <option value="BackOffice">Back Office</option>
              <option value="Driver">Driver / Fleet</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading open vacancies...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-600 font-medium">No open positions found in this category right now.</p>
            <Link
              href="/candidates/register"
              className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline"
            >
              Register your resume to get notified for future openings →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700">
                      {job.hiringCategory}
                    </span>
                    <span className="text-xs text-slate-400">📍 {job.city}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3">{job.title}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Client: <span className="italic">{job.companyName}</span>
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <p>💼 Min. Experience: {job.minExperienceYears} Year(s)</p>
                    {job.maxSalaryLpa && <p>💰 Salary: Up to {job.maxSalaryLpa} LPA</p>}
                    <p>👥 Vacancies: {job.noOfVacancies}</p>
                  </div>

                  {job.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href="/candidates/register"
                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
