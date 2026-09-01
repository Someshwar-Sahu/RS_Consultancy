"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectCandidateRegister() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the modern 2-step onboarding flow
    router.replace("/login");
  }, [router]);

  return (
    <div style={{ padding: 60, textAlign: "center", color: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
      Redirecting to Candidate Portal...
    </div>
  );
}
