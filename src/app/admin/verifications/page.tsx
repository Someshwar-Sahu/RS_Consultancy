"use client";

import { useState, useEffect } from "react";

interface PendingContact {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  designation: string | null;
  createdAt: string;
  branch: {
    branchName: string;
    city: string;
    company: {
      name: string;
    };
  };
}

export default function AdminVerificationsPage() {
  const [contacts, setContacts] = useState<PendingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verifications");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error("Failed to load pending verifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (contactId: string, approve: boolean) => {
    setProcessingId(contactId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, approve }),
      });

      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Approval Gate</h1>
          <p className="text-sm text-slate-600 mt-1">
            Verify self-registered Company Contacts before granting platform access.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading pending requests...</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-600 font-medium">🎉 No pending HR verifications right now!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{contact.fullName}</h3>
                    {contact.designation && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {contact.designation}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    🏢 {contact.branch.company.name} ({contact.branch.branchName}, {contact.branch.city})
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>📧 {contact.email}</span>
                    <span>📱 {contact.mobile}</span>
                    <span>🕒 Registered: {new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAction(contact.id, true)}
                    disabled={processingId === contact.id}
                    className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    Approve Access
                  </button>

                  <button
                    onClick={() => handleAction(contact.id, false)}
                    disabled={processingId === contact.id}
                    className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
