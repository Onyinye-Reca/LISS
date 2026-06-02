import { injectable } from "inversify";
import { Resend } from "resend";
import type { EmailService, ContactSubmission } from "./email.service";
import {
  verificationEmail,
  passwordResetEmail,
  contactNotificationEmail,
  EmailContent,
} from "./email-templates";

/**
 * Real email delivery via Resend (PRD section 8). Only constructed when
 * RESEND_API_KEY is set — see the binding in inversify.config.ts.
 */
@injectable()
export class ResendEmailService implements EmailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is required for ResendEmailService");
    this.client = new Resend(apiKey);
    // e.g. "LISS11' Alumni <no-reply@liss11.org>"
    this.from = process.env.EMAIL_FROM ?? "LISS11' Alumni <onboarding@resend.dev>";
  }

  private async send(
    to: string,
    content: EmailContent,
    replyTo?: string,
  ): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      throw new Error(`Resend failed to send "${content.subject}": ${error.message}`);
    }
  }

  sendVerification(to: string, verifyUrl: string): Promise<void> {
    return this.send(to, verificationEmail(verifyUrl));
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    return this.send(to, passwordResetEmail(resetUrl));
  }

  sendContactNotification(to: string, submission: ContactSubmission): Promise<void> {
    // Reply-to the submitter so the inbox owner can respond directly.
    return this.send(to, contactNotificationEmail(submission), submission.email);
  }
}
