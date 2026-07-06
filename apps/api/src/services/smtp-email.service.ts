import { injectable } from "inversify";
import nodemailer from "nodemailer";
import type {
  EmailService,
  ContactSubmission,
  PaymentReceipt,
} from "./email.service";
import {
  verificationEmail,
  passwordResetEmail,
  contactNotificationEmail,
  paymentReceiptEmail,
  EmailContent,
} from "./email-templates";

/**
 * Real email delivery over SMTP - e.g. Gmail's smtp.gmail.com using an App
 * Password. Constructed when SMTP credentials are set (see inversify.config.ts).
 *
 * Sending through Gmail's own SMTP is the only legitimate way to send "from" a
 * @gmail.com address: the mail is authenticated as that account, so it passes
 * SPF/DKIM/DMARC and lands in inboxes. Third-party senders (e.g. Resend) cannot
 * send as gmail.com and would be rejected or spam-filtered.
 */
@injectable()
export class SmtpEmailService implements EmailService {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;
  private readonly from: string;
  private readonly replyTo?: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      throw new Error(
        "SMTP_HOST, SMTP_USER and SMTP_PASS are required for SmtpEmailService",
      );
    }
    const port = Number(process.env.SMTP_PORT ?? 465);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user, pass },
      // Without these, a stalled SMTP connection hangs the request forever.
      // Fail fast instead so callers (verification, contact) don't block.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    // Gmail only lets you send as the authenticated account (or its aliases),
    // so EMAIL_FROM should use SMTP_USER's address. Falls back to it.
    this.from = process.env.EMAIL_FROM ?? user;
    // Replies to member-facing emails route here (e.g. emove.nig@gmail.com).
    this.replyTo = process.env.EMAIL_REPLY_TO;
  }

  private async send(
    to: string,
    content: EmailContent,
    replyTo?: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(replyTo ? { replyTo } : {}),
    });
  }

  sendVerification(to: string, verifyUrl: string): Promise<void> {
    return this.send(to, verificationEmail(verifyUrl), this.replyTo);
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    return this.send(to, passwordResetEmail(resetUrl), this.replyTo);
  }

  sendContactNotification(
    to: string,
    submission: ContactSubmission,
  ): Promise<void> {
    // Reply-to the submitter so the inbox owner can respond directly.
    return this.send(to, contactNotificationEmail(submission), submission.email);
  }

  sendPaymentReceipt(to: string, receipt: PaymentReceipt): Promise<void> {
    return this.send(to, paymentReceiptEmail(receipt), this.replyTo);
  }
}
