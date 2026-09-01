import { NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, otpCode, type = "SIGNUP" } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: "Email and OTP code are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await verifyOtpCode(cleanEmail, otpCode, type);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Invalid verification code." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Code verified successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Failed to verify code." }, { status: 500 });
  }
}
