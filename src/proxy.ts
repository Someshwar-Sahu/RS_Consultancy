import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  // 1. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 2. Protect /employee routes (Admin can also access)
  if (pathname.startsWith("/employee")) {
    if (!isLoggedIn || !["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 3. Protect /company routes
  if (pathname.startsWith("/company")) {
    if (!isLoggedIn || userRole !== "COMPANY_CONTACT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 4. Protect /candidate routes
  if (pathname.startsWith("/candidate")) {
    if (!isLoggedIn || userRole !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/employee/:path*",
    "/company/:path*",
    "/candidate/:path*",
  ],
};
