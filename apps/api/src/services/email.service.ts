import { injectable } from "inversify";

export interface EmailService {
  sendVerification(to: string, token: string): Promise<void>;
}

/**
 * Sprint 0 placeholder: logs the email instead of sending it.
 * Swap the container binding for a ResendEmailService in Sprint 1.
 */
@injectable()
export class ConsoleEmailService implements EmailService {
  async sendVerification(to: string, token: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[email] verification for ${to}: token=${token}`);
  }
}
