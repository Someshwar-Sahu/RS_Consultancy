import { NextResponse } from "next/server";
import { generateAndSendOtp } from "@/lib/otp";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, countryCode = "+91", mobile, type = "SIGNUP" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Accurately extract core 10 digits of mobile number
    let fullMobile: string | null = null;
    let core10Digits: string | null = null;
    if (mobile) {
      const allDigits = String(mobile).replace(/\D/g, "");
      if (allDigits.length >= 10) {
        core10Digits = allDigits.slice(-10);
        fullMobile = `${countryCode} ${core10Digits}`;
      } else if (allDigits.length > 0) {
        core10Digits = allDigits;
        fullMobile = `${countryCode} ${allDigits}`;
      }
    }

    // 1. If SIGNUP: Strictly block if Email OR Mobile Number is already registered
    if (type === "SIGNUP") {
      // Check existing email in users table
      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email address is already registered. Please switch to Sign In." },
          { status: 409 }
        );
      }

      // Check existing mobile in candidates table
      if (core10Digits) {
        const existingCandidate = await db.candidate.findFirst({
          where: {
            OR: [
              ...(fullMobile ? [{ mobile: fullMobile }] : []),
              { mobile: { contains: core10Digits } },
            ],
          },
        });

        if (existingCandidate) {
          return NextResponse.json(
            {
              error: `A candidate profile is already registered with mobile number ending in ${core10Digits}. Each candidate can only have 1 account. Please switch to Sign In.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // 2. If PASSWORD_RESET: Require that email actually exists
    if (type === "PASSWORD_RESET") {
      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      });
      if (!existingUser) {
        return NextResponse.json(
          { error: "No registered account found with this email address. Please check and try again." },
          { status: 404 }
        );
      }
    }

    const result = await generateAndSendOtp(cleanEmail, fullMobile, type);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
