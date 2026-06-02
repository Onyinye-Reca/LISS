import { injectable } from "inversify";

export interface EmailService {
  /** Sends the verification email. `verifyUrl` is the fully-composed link. */
  sendVerification(to: string, verifyUrl: string): Promise<void>;
  /** Sends the password-reset email. `resetUrl` is the fully-composed link. */
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
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
}
