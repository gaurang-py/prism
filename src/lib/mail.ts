import nodemailer from "nodemailer";
import { appUrl } from "./paths";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim());
}

async function sendSmtp(to: string, subject: string, text: string, html: string): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) throw new Error("SMTP_HOST is not set.");
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || process.env.MAIL_FROM?.trim() || "Prism <noreply@localhost>",
    to,
    subject,
    text,
    html,
  });
}

async function sendResend(to: string, subject: string, text: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  const from =
    process.env.MAIL_FROM?.trim() || process.env.RESEND_FROM?.trim() || "Prism <noreply@onresend.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body.slice(0, 200)}`);
  }
}

export async function sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const subject = "Reset your Prism password";
  const text = `Reset your Prism password:\n${resetUrl}\n\nThis link expires in one hour. If you did not request it, ignore this email.`;
  const html = `<p>Reset your Prism password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in one hour. If you did not request it, ignore this email.</p>`;

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendResend(email, subject, text, html);
    return;
  }
  if (process.env.SMTP_HOST?.trim()) {
    await sendSmtp(email, subject, text, html);
    return;
  }

  console.info(`[mail] RESEND_API_KEY / SMTP_HOST not set. Password reset URL for ${email}: ${resetUrl}`);
}
