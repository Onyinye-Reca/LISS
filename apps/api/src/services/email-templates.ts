/**
 * Branded email templates (PRD brand guide: Maroon/Gold, Inter).
 * Each builder returns subject + html + a plain-text fallback.
 */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const MAROON = "#76301F";
const GOLD = "#C08D33";
const CREAM = "#FBF7F0";
const INK = "#241712";

function layout(heading: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CREAM};font-family:Inter,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid ${GOLD}33;overflow:hidden;">
          <tr><td style="background:${MAROON};padding:20px 24px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;">LISS11' Alumni</span>
          </td></tr>
          <tr><td style="padding:32px 24px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:${MAROON};">${heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${INK};">${body}</p>
            <a href="${ctaUrl}" style="display:inline-block;background:${GOLD};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">${ctaLabel}</a>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${INK}99;">
              If the button doesn't work, paste this link into your browser:<br/>
              <a href="${ctaUrl}" style="color:${MAROON};word-break:break-all;">${ctaUrl}</a>
            </p>
          </td></tr>
          <tr><td style="padding:16px 24px;border-top:1px solid ${GOLD}22;">
            <p style="margin:0;font-size:12px;color:${INK}80;">You're receiving this because someone used this address on the LISS11' Alumni site. If that wasn't you, you can ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(verifyUrl: string): EmailContent {
  return {
    subject: "Verify your LISS11' Alumni account",
    html: layout(
      "Confirm your email",
      "Welcome! Please confirm your email address to activate your LISS11' Alumni account. This link expires in 24 hours.",
      "Verify my email",
      verifyUrl,
    ),
    text: `Welcome to LISS11' Alumni!\n\nConfirm your email (link expires in 24 hours):\n${verifyUrl}\n\nIf that wasn't you, ignore this email.`,
  };
}

/** Escapes user-supplied text before embedding it in HTML email bodies. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactNotificationEmail(submission: {
  name: string;
  email: string;
  message: string;
}): EmailContent {
  const name = escapeHtml(submission.name);
  const email = escapeHtml(submission.email);
  const message = escapeHtml(submission.message).replace(/\n/g, "<br/>");
  return {
    subject: `New contact message from ${submission.name}`,
    html: layout(
      "New contact message",
      `<strong>${name}</strong> &lt;${email}&gt; wrote:<br/><br/>${message}`,
      `Reply to ${name}`,
      `mailto:${submission.email}`,
    ),
    text: `New contact message from ${submission.name} <${submission.email}>:\n\n${submission.message}`,
  };
}

export function passwordResetEmail(resetUrl: string): EmailContent {
  return {
    subject: "Reset your LISS11' Alumni password",
    html: layout(
      "Reset your password",
      "We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
      "Reset my password",
      resetUrl,
    ),
    text: `Reset your LISS11' Alumni password (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  };
}

export function paymentReceiptEmail(r: {
  typeLabel: string;
  amountNaira: number;
  reference: string;
  dateLabel: string;
  viewUrl: string;
}): EmailContent {
  const body =
    `Thank you - we've received your ${escapeHtml(r.typeLabel.toLowerCase())}.<br/><br/>` +
    `<strong>Amount:</strong> &#8358;${r.amountNaira.toLocaleString()}<br/>` +
    `<strong>Reference:</strong> ${escapeHtml(r.reference)}<br/>` +
    `<strong>Date:</strong> ${escapeHtml(r.dateLabel)}`;
  return {
    subject: `Your LISS11' Alumni ${r.typeLabel.toLowerCase()} receipt`,
    html: layout("Payment received", body, "View my payments", r.viewUrl),
    text: `Payment received - ${r.typeLabel}\nAmount: N${r.amountNaira}\nReference: ${r.reference}\nDate: ${r.dateLabel}\n\nView your payments: ${r.viewUrl}`,
  };
}
