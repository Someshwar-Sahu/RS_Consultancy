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

  try {
    const { error } = await resend.emails.send({
      from: "RS Bridge Consultancy <notifications@rsbridge.com>",
      to: [payload.recipientEmail],
      subject: payload.subject,
      text: payload.bodyText,
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
          to: payload.recipientMobile,
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
