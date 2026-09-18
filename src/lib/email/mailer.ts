import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    transporter = null;
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? "true") !== "false",
      auth: { user, pass },
    });
  } else {
    // Gmail SMTP (smtp.gmail.com:465) with an App Password.
    transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  }
  return transporter;
}

export function isEmailConfigured() {
  return getTransporter() !== null;
}

export async function sendMail(message: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const t = getTransporter();
  if (!t) {
    console.info(`[email] SMTP not configured — skipped "${message.subject}" to ${message.to}`);
    return { sent: false };
  }
  const from = process.env.MAIL_FROM || `JEXI Accessories <${process.env.GMAIL_USER}>`;
  try {
    await t.sendMail({ from, ...message });
    return { sent: true };
  } catch (err) {
    // Email must never break checkout or status updates.
    console.error(`[email] Failed to send "${message.subject}" to ${message.to}:`, err);
    return { sent: false };
  }
}
