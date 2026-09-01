import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface NotificationPayload {
  recipientEmail: string;
  recipientMobile?: string;
  subject: string;
  bodyText: string;
  whatsappTemplateName?: string;
}

/**
 * Transactional Email Dispatcher via Resend
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  if (!resend) {
    console.log(`[DEV MODE - EMAIL SIMULATION] To: ${payload.recipientEmail} | Subject: ${payload.subject}`);
    console.log(`Body: ${payload.bodyText}`);
    return true; // Simulates success in dev when API key is missing
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">RS BRIDGE CONSULTANCY</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Executive Search & Strategic Staffing</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <h3 style="margin-top: 0; color: #0f172a;">${payload.subject}</h3>
        <p style="white-space: pre-line;">${payload.bodyText}</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">This email was sent by RS Bridge Consultancy. Confidentiality rules apply.</p>
        <p style="margin: 4px 0 0 0;"><a href="https://rsbridge.com/unsubscribe" style="color: #64748b; text-decoration: underline;">Unsubscribe / Email Preferences</a></p>
      </div>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "RS Bridge Consultancy <onboarding@resend.dev>",
      to: [payload.recipientEmail],
      subject: payload.subject,
      text: payload.bodyText,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email Dispatch Exception:", err);
    return false;
  }
}

/**
 * Transactional WhatsApp Dispatcher via Meta Cloud API Direct
 */
export async function sendWhatsAppNotification(payload: NotificationPayload): Promise<boolean> {
  if (!process.env.META_WHATSAPP_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
    console.log(`[DEV MODE - WHATSAPP SIMULATION] To: ${payload.recipientMobile} | Message: ${payload.bodyText}`);
    return true; // Simulates success in dev when API key is missing
  }

  try {
    const cleanPhone = (payload.recipientMobile || "").replace(/\D/g, "");
    if (!cleanPhone) {
      console.warn("Skipping WhatsApp dispatch: No valid numeric mobile number.");
      return false;
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: payload.bodyText },
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      console.error("Meta WhatsApp API Error:", errData);
      return false;
    }
    return true;
  } catch (err) {
    console.error("WhatsApp Dispatch Exception:", err);
    return false;
  }
}

/**
 * Generates an iCal (.ics) calendar invite payload for scheduled candidate interviews
 */
export function generateIcsCalendarInvite(summary: string, description: string, startDate: Date, durationMinutes: number = 45): string {
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RS Bridge Consultancy//Interview Scheduler//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:interview-${Date.now()}@rsbridge.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
