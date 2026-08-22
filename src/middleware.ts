import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const userRole = (req.auth?.user as any)?.role;

    // Protect /admin routes
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect /employee routes (Admin can also access)
    if (pathname.startsWith("/employee") && !["ADMIN", "EMPLOYEE"].includes(userRole)) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect /company routes
    if (pathname.startsWith("/company") && userRole !== "COMPANY_CONTACT") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect /candidate routes
    if (pathname.startsWith("/candidate") && userRole !== "CANDIDATE") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/admin/:path*", "/employee/:path*", "/company/:path*", "/candidate/:path*"],
};
