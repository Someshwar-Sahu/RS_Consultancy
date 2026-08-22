import { describe, it, expect } from "vitest";
import { sendEmailNotification, sendWhatsAppNotification } from "../src/lib/notifications";

describe("Notification Engine (Email & WhatsApp Dispatch)", () => {
  it("POSITIVE: Simulates Email notification dispatch in dev mode", async () => {
    const success = await sendEmailNotification({
      recipientEmail: "test.candidate@example.com",
      subject: "Interview Scheduled",
      bodyText: "Your interview with RS Bridge Consultancy client has been scheduled.",
    });

    expect(success).toBe(true);
  });

  it("POSITIVE: Simulates WhatsApp notification dispatch in dev mode", async () => {
    const success = await sendWhatsAppNotification({
      recipientEmail: "test.candidate@example.com",
      recipientMobile: "919876543210",
      subject: "Application Received",
      bodyText: "RS Bridge: Your application has been received successfully.",
    });

    expect(success).toBe(true);
  });
});
