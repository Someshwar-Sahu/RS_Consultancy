import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const invites = await db.userInvite.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (error: any) {
    console.error("Admin Invites Error:", error);
    return NextResponse.json({ error: "Failed to fetch invites." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { email, role = "EMPLOYEE" } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email." }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await db.userInvite.upsert({
      where: { email },
      create: {
        email,
        role,
        tokenHash: token,
        invitedBy: session.user.id || "ADMIN",
        expiresAt,
      },
      update: {
        role,
        tokenHash: token,
        expiresAt,
        acceptedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      inviteLink: `/register/invite?token=${token}`,
      invite,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Admin Invite Create Error:", error);
    return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });
  }
}
