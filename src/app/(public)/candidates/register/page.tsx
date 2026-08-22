"use client";

import { useState } from "react";

export default function CandidateRegisterPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/candidates/register", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit registration.");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                        ✓
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
                    <p className="text-slate-600 text-sm">
                        Thank you for registering with RS Bridge Consultancy. Our recruitment team will review your profile and contact you for matching job opportunities.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Candidate Registration</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Submit your resume and details to be considered for top vacancies in NCR.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="Rahul Sharma"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="9876543210"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="rahul@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                            <input
                                type="text"
                                name="currentLocation"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="Noida / Sector 62"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Hiring Category *</label>
                            <select
                                name="preferredCategory"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                            >
                                <option value="IT">IT & Technical</option>
                                <option value="Sales&Marketing">Sales & Marketing</option>
                                <option value="BPO">BPO & Customer Support</option>
                                <option value="BackOffice">Back Office & Administration</option>
                                <option value="Permanent">Permanent Recruitment</option>
                                <option value="Bulk">Bulk Hiring</option>
                                <option value="Driver">Driver / Fleet</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level *</label>
                            <select
                                name="experienceLevel"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                            >
                                <option value="Fresher">Fresher (0 Years)</option>
                                <option value="Intermediate">Intermediate (1–3 Years)</option>
                                <option value="Expert">Expert (3+ Years)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary (LPA)</label>
                            <input
                                type="text"
                                name="expectedSalary"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="e.g. 4.5 LPA"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                            <input
                                type="text"
                                name="noticePeriod"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm"
                                placeholder="e.g. Immediate / 15 Days"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload Resume (PDF / DOCX)</label>
                        <input
                            type="file"
                            name="resume"
                            accept=".pdf,.doc,.docx"
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? "Submitting Application..." : "Submit Candidate Application"}
                    </button>
                </form>
            </div>
        </div>
    );
}
