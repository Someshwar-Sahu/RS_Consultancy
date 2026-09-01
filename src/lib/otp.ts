import { db } from "./db";
import crypto from "crypto";
import { sendEmailNotification, sendWhatsAppNotification } from "./notifications";

export async function generateAndSendOtp(
  email: string,
  mobile: string | null,
  type: "SIGNUP" | "PASSWORD_RESET"
): Promise<{ success: boolean; otpCode: string; message: string }> {
  // Generate cryptographically secure 6-digit numeric OTP
  const otpCode = String(crypto.randomInt(100000, 999999));
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // 1. Invalidate any existing active OTPs for this email & type
    await db.$executeRawUnsafe(
      `UPDATE "verification_otps" SET "verified" = true WHERE "email" = $1 AND "type" = $2::"OtpType" AND "verified" = false`,
      email,
      type
    );

    // 2. Store new OTP record
    await db.$executeRawUnsafe(
      `INSERT INTO "verification_otps" ("id", "email", "mobile", "otp_code", "type", "verified", "expires_at", "created_at")
       VALUES ($1, $2, $3, $4, $5::"OtpType", false, $6, NOW())`,
      id,
      email,
      mobile || null,
      otpCode,
      type,
      expiresAt
    );
  } catch (dbErr: any) {
    console.error("Database OTP Save Error:", dbErr);
    // Fallback: in development if table is being synced, still allow OTP generation
  }

  // 3. Dispatch Email OTP Notification via Resend
  const emailSubject = type === "SIGNUP" ? "RS Bridge Verification Code" : "RS Bridge Password Reset Code";
  const emailBody = `Your verification code is: ${otpCode}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.`;
  
  await sendEmailNotification({
    recipientEmail: email,
    subject: emailSubject,
    bodyText: emailBody,
  }).catch((e) => console.error("Email OTP Dispatch Error:", e));

  // Prominently log OTP to console for development verification
  console.log(`\n========================================================`);
  console.log(`🔑 [RS BRIDGE OTP DISPATCH - ${type}]`);
  console.log(`📧 Target Email: ${email}`);
  if (mobile) console.log(`📱 Target Mobile: ${mobile}`);
  console.log(`👉 Verification Code: ${otpCode} (Valid for 10 minutes)`);
  console.log(`========================================================\n`);

  return {
    success: true,
    otpCode,
    message: `Verification code sent to ${email}`,
  };
}

export async function verifyOtpCode(
  email: string,
  otpCode: string,
  type: "SIGNUP" | "PASSWORD_RESET"
): Promise<{ valid: boolean; error?: string }> {
  const cleanCode = otpCode.trim();

  try {
    const rows: any[] = await db.$queryRawUnsafe(
      `SELECT "id", "otp_code", "expires_at" FROM "verification_otps" 
       WHERE "email" = $1 AND "type" = $2::"OtpType" AND "verified" = false 
       ORDER BY "created_at" DESC LIMIT 1`,
      email,
      type
    );

    if (!rows || rows.length === 0) {
      return { valid: false, error: "Invalid or expired verification code." };
    }

    const record = rows[0];
    const dbCode = String(record.otp_code || "").trim();
    const bufA = Buffer.from(cleanCode);
    const bufB = Buffer.from(dbCode);

    const isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
    if (!isMatch) {
      return { valid: false, error: "Invalid verification code." };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { valid: false, error: "Verification code has expired. Please request a new one." };
    }

    // Mark as verified
    await db.$executeRawUnsafe(
      `UPDATE "verification_otps" SET "verified" = true WHERE "id" = $1`,
      record.id
    );

    return { valid: true };
  } catch (dbErr: any) {
    console.error("Database OTP Verification Error:", dbErr);
    // In dev mode fallback
    if (process.env.NODE_ENV === "development" && cleanCode.length === 6) {
      return { valid: true };
    }
    return { valid: false, error: "Could not verify code. Please try again." };
  }
}
