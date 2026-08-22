"use client";

import { useState } from "react";
import Link from "next/link";

export default function CompanyInquirePage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/companies/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Submission failed.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Inquiry Received</h2>
          <p className="text-slate-600 text-sm">
            Thank you for registering your hiring requirement with RS Bridge Consultancy.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-xs text-left">
            <strong>Fraud Prevention Gate:</strong> Your account is currently pending Admin verification. An RS Bridge Account Manager will verify your company details and activate your login access shortly.
          </div>
          <Link
            href="/login"
            className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Go to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Hire Top Talent in NCR</h1>
          <p className="mt-2 text-sm text-slate-600">
            Partner with RS Bridge Consultancy for Permanent, Bulk, IT, BPO & Executive Recruitment.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="companyName"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
              placeholder="e.g. Acme Tech Private Limited"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City / Branch Location *</label>
              <input
                type="text"
                name="city"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
                placeholder="e.g. Noida / Gurgaon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Designation</label>
              <input
                type="text"
                name="designation"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
                placeholder="HR Manager / Talent Lead"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HR Contact Person Name *</label>
            <input
              type="text"
              name="contactName"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
              placeholder="Priya Verma"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Email *</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
                placeholder="priya@acme.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Portal Password *</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 text-slate-900 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mt-4"
          >
            {loading ? "Submitting Inquiry..." : "Submit Company Inquiry & Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
