/**
 * Resend email sending utility.
 *
 * Provides a typed `sendEmail` function that wraps the Resend API.
 * All email templates are React components rendered to HTML by React Email.
 *
 * Usage:
 *   import { sendEmail } from "@/lib/email/send";
 *   import { WelcomeEmail } from "@/emails/welcome";
 *
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "Welcome!",
 *     react: WelcomeEmail({ name: "Alice" }),
 *   });
 *
 * @see https://resend.com/docs/send-with-nextjs
 */

import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY!);

const DEFAULT_FROM = "notifications@yourdomain.com"; // Update with your verified domain

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

export async function sendEmail({
  to,
  subject,
  react,
  from = DEFAULT_FROM,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, messageId: null, error: error.message };
    }

    return { success: true, messageId: data?.id ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Email send failed:", message);
    return { success: false, messageId: null, error: message };
  }
}
