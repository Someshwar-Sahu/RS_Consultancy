import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOtpCode } from "@/lib/otp";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otpCode, newPassword } = await req.json();

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify OTP
    const verifyRes = await verifyOtpCode(cleanEmail, otpCode, "PASSWORD_RESET");
    if (!verifyRes.valid) {
      return NextResponse.json({ error: verifyRes.error || "Invalid or expired reset code." }, { status: 400 });
    }

    // 2. Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { email: cleanEmail },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
