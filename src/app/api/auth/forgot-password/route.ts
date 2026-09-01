import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndSendOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success without revealing whether email exists (security best practice)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a reset OTP has been sent.",
      });
    }

    const result = await generateAndSendOtp(cleanEmail, null, "PASSWORD_RESET");

    return NextResponse.json({
      success: true,
      message: "Password reset OTP sent to your registered email.",
      devOtp: process.env.NODE_ENV === "development" ? result.otpCode : undefined,
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Failed to process forgot password request." }, { status: 500 });
  }
}
