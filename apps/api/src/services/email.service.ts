import { injectable } from "inversify";

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

export interface PaymentReceipt {
  typeLabel: string; // e.g. "Dues payment" / "Donation"
  amountNaira: number;
  reference: string;
  dateLabel: string;
  viewUrl: string;
}

export interface EmailService {
  /** Sends the verification email. `verifyUrl` is the fully-composed link. */
  sendVerification(to: string, verifyUrl: string): Promise<void>;
  /** Sends the password-reset email. `resetUrl` is the fully-composed link. */
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
  /** Notifies the site inbox of a new contact-form submission. */
  sendContactNotification(to: string, submission: ContactSubmission): Promise<void>;
  /** Sends a receipt after a settled Paystack charge (dues or donation). */
  sendPaymentReceipt(to: string, receipt: PaymentReceipt): Promise<void>;
}

/**
 * Local-dev default: logs the link instead of sending it, so development
 * needs no email credentials. The container falls back to this whenever
 * RESEND_API_KEY is not set (see inversify.config.ts).
 */
@injectable()
export class ConsoleEmailService implements EmailService {
  async sendVerification(to: string, verifyUrl: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[email] verify ${to} -> ${verifyUrl}`);
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[email] reset ${to} -> ${resetUrl}`);
  }

  async sendContactNotification(
    to: string,
    submission: ContactSubmission,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[email] contact -> ${to} from ${submission.name} <${submission.email}>: ${submission.message}`,
    );
  }

  async sendPaymentReceipt(to: string, receipt: PaymentReceipt): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `[email] receipt ${to} -> N${receipt.amountNaira} ${receipt.typeLabel} (${receipt.reference})`,
    );
  }
}
