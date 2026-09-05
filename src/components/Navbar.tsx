"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const user = session?.user as any;
  const role = user?.role;
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/candidates/register";

  return (
    <header
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <img
              src="/logo.png"
              alt="RS Bridge Consultancy Logo"
              style={{
                height: 38,
                width: 38,
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "#0F172A",
                letterSpacing: -0.3,
              }}
            >
              RS Bridge <span style={{ color: "#2563EB" }}>Consultancy</span>
            </span>
          </Link>

          {/* Role-Specific Navigation Links */}
          {!isAuthPage && (
            <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* CANDIDATE NAVIGATION */}
              {role === "CANDIDATE" && (
                <>
                  <Link
                    href="/candidate/dashboard"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/candidate/dashboard" ? 700 : 500,
                      color: pathname === "/candidate/dashboard" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/jobs"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/jobs" ? 700 : 500,
                      color: pathname === "/jobs" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Find Jobs
                  </Link>
                  <Link
                    href="/candidate/applications"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/candidate/applications") ? 700 : 500,
                      color: pathname.startsWith("/candidate/applications") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    My Applications
                  </Link>
                  <Link
                    href="/candidate/resumes"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/candidate/resumes" ? 700 : 500,
                      color: pathname === "/candidate/resumes" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Resume Vault
                  </Link>
                </>
              )}

              {/* COMPANY / EMPLOYER CONTACT NAVIGATION */}
              {role === "COMPANY_CONTACT" && (
                <>
                  <Link
                    href="/company/dashboard"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/company/dashboard" || pathname === "/company" ? 700 : 500,
                      color: pathname.startsWith("/company") && !pathname.includes("/new") && !pathname.includes("/terms") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Hiring Console
                  </Link>
                  <Link
                    href="/company/requirements/new"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.includes("/requirements/new") ? 700 : 600,
                      color: pathname.includes("/requirements/new") ? "#2563EB" : "#0F172A",
                      textDecoration: "none",
                      background: "#EFF6FF",
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    + Post Vacancy
                  </Link>
                  <Link
                    href="/company/terms"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/company/terms" ? 700 : 500,
                      color: pathname === "/company/terms" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Terms Agreement
                  </Link>
                </>
              )}

              {/* AGENCY RECRUITER / EMPLOYEE NAVIGATION */}
              {role === "EMPLOYEE" && (
                <>
                  <Link
                    href="/employee/candidates"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/employee") && !pathname.includes("/new") ? 700 : 500,
                      color: pathname.startsWith("/employee") && !pathname.includes("/new") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Recruiter Desk
                  </Link>
                  <Link
                    href="/employee/candidates/new"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.includes("/candidates/new") ? 700 : 500,
                      color: pathname.includes("/candidates/new") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    + Add Candidate
                  </Link>
                </>
              )}

              {/* AGENCY ADMIN / FOUNDER NAVIGATION */}
              {role === "ADMIN" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/admin/dashboard") || pathname === "/admin" ? 700 : 500,
                      color: pathname.startsWith("/admin/dashboard") || pathname === "/admin" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Executive Dashboard
                  </Link>
                  <Link
                    href="/employee/candidates"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/employee/candidates") ? 700 : 500,
                      color: pathname.startsWith("/employee/candidates") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Recruiter Desk
                  </Link>
                  <Link
                    href="/admin/placements"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/admin/placements") ? 700 : 500,
                      color: pathname.startsWith("/admin/placements") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Placements & Invoices
                  </Link>
                  <Link
                    href="/admin/verifications"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/admin/verifications") ? 700 : 500,
                      color: pathname.startsWith("/admin/verifications") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Client Verifications
                  </Link>
                  <Link
                    href="/admin/settings"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.startsWith("/admin/settings") ? 700 : 500,
                      color: pathname.startsWith("/admin/settings") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Settings
                  </Link>
                </>
              )}

              {/* GUEST / PUBLIC NAVIGATION */}
              {!role && (
                <>
                  <Link
                    href="/jobs"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname === "/jobs" ? 700 : 500,
                      color: pathname === "/jobs" ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Explore Jobs
                  </Link>
                  <Link
                    href="/companies/inquire"
                    style={{
                      fontSize: 14,
                      fontWeight: pathname.includes("/companies/inquire") ? 700 : 500,
                      color: pathname.includes("/companies/inquire") ? "#2563EB" : "#475569",
                      textDecoration: "none",
                    }}
                  >
                    Hire Talent
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Side User Profile & Logout / Login */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {status === "loading" ? (
            <div style={{ fontSize: 13, color: "#94A3B8" }}>Loading...</div>
          ) : !isAuthPage && status === "authenticated" && user ? (
            <>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  {user.name || user.email?.split("@")[0] || "User"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      role === "ADMIN"
                        ? "#9333EA"
                        : role === "EMPLOYEE"
                        ? "#2563EB"
                        : role === "COMPANY_CONTACT"
                        ? "#0D9488"
                        : "#16A34A",
                    textTransform: "uppercase",
                  }}
                >
                  {role === "COMPANY_CONTACT" ? "Employer HR" : role || "CANDIDATE"}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Sign Out 🚪
              </button>
            </>
          ) : !isAuthPage ? (
            <Link
              href="/login"
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign In / Register →
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
