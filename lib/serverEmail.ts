import "server-only";

import { CONTACT_EMAIL } from "@/lib/contactConfig";
import nodemailer from "nodemailer";

export type ContactEmailPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactEmailResult = {
  delivered: boolean;
  provider: "mock" | "smtp";
  messageId: string;
};

export async function sendContactEmail(payload: ContactEmailPayload): Promise<ContactEmailResult> {
  const smtpConfig = getSmtpConfig();
  const toEmail = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER || CONTACT_EMAIL;
  const bodyText = [
    "Dijital Iz Avcisi iletisim formu mesaji",
    "",
    `Gonderen ad: ${payload.name}`,
    `Gonderen e-posta: ${payload.email}`,
    `Konu: ${payload.topic}`,
    "",
    "Mesaj:",
    payload.message
  ].join("\n");

  if (!smtpConfig) {
    console.warn("contact_email_mock_delivery", { to: toEmail, topic: payload.topic });
    return {
      delivered: true,
      provider: "mock",
      messageId: `mock-contact-${Date.now()}`
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass
    }
  });

  try {
    const result = await transporter.sendMail({
      from: `Dijital Iz Avcisi <${fromEmail}>`,
      to: toEmail,
      replyTo: payload.email,
      subject: `[Dijital Iz Avcisi] ${payload.topic}`,
      text: bodyText
    });

    return {
      delivered: true,
      provider: "smtp",
      messageId: result.messageId || `smtp-${Date.now()}`
    };
  } catch (error) {
    console.error("contact_email_delivery_failed", {
      error: error instanceof Error ? error.message : "Bilinmeyen SMTP hatasi"
    });
    throw new Error("Iletisim e-postasi gonderilemedi.");
  }
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || Number.isNaN(port)) {
    return null;
  }

  return { host, port, secure, user, pass };
}

