import { injectable } from "inversify";
import { randomBytes } from "crypto";
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

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

/** MIME encoded-word so non-ASCII subjects (names, the naira sign) survive. */
function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

/** Base64 body, wrapped at 76 chars per MIME. */
function base64Body(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/(.{76})/g, "$1\r\n");
}

/** Builds a multipart/alternative RFC 2822 message (pure ASCII, UTF-8 bodies). */
function buildMime(opts: {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = `b_${randomBytes(12).toString("hex")}`;
  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
    `Subject: ${encodeSubject(opts.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(opts.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(opts.html),
    `--${boundary}--`,
    "",
  ];
  return lines.join("\r\n");
}

/**
 * Sends email through the Gmail API over HTTPS (not SMTP), so it works on hosts
 * that block outbound SMTP (e.g. Render). Authenticated with an OAuth2 refresh
 * token for the sending Gmail account, so mail is genuinely sent by Gmail and
 * passes SPF/DKIM/DMARC - landing in inboxes.
 *
 * Requires GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN (scope
 * https://www.googleapis.com/auth/gmail.send). EMAIL_FROM is the sending Gmail
 * address, optionally with a display name: "LISS11' Alumni <addr@gmail.com>".
 */
@injectable()
export class GmailApiEmailService implements EmailService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly from: string;
  private readonly replyTo?: string;

  // Access tokens last ~1h; cache and refresh a minute early.
  private accessToken: string | null = null;
  private accessTokenExpiry = 0;

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN are required for GmailApiEmailService",
      );
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.from = process.env.EMAIL_FROM ?? "";
    this.replyTo = process.env.EMAIL_REPLY_TO;
  }

  /** Exchanges the refresh token for a short-lived access token (cached). */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiry) {
      return this.accessToken;
    }
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new Error(
        `Gmail token refresh failed: ${data.error_description ?? data.error ?? res.status}`,
      );
    }
    this.accessToken = data.access_token;
    this.accessTokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000;
    return this.accessToken;
  }

  private async send(
    to: string,
    content: EmailContent,
    replyTo?: string,
  ): Promise<void> {
    const raw = Buffer.from(
      buildMime({
        from: this.from,
        to,
        replyTo,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
      "utf8",
    ).toString("base64url");

    const accessToken = await this.getAccessToken();
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gmail API send failed (${res.status}): ${body}`);
    }
  }

  sendVerification(to: string, verifyUrl: string): Promise<void> {
    return this.send(to, verificationEmail(verifyUrl), this.replyTo);
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    return this.send(to, passwordResetEmail(resetUrl), this.replyTo);
  }

  sendContactNotification(to: string, submission: ContactSubmission): Promise<void> {
    // Reply-to the submitter so the inbox owner can respond directly.
    return this.send(to, contactNotificationEmail(submission), submission.email);
  }

  sendPaymentReceipt(to: string, receipt: PaymentReceipt): Promise<void> {
    return this.send(to, paymentReceiptEmail(receipt), this.replyTo);
  }
}
