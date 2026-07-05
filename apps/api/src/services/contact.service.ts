import { inject, injectable } from "inversify";
import { ContactInput } from "@liss11/shared";
import { TYPES } from "../types";
import { ContactMessageRepository } from "../repositories/contact-message.repository";
import type { EmailService } from "./email.service";
import { captureError } from "../instrument";

@injectable()
export class ContactService {
  constructor(
    @inject(TYPES.ContactMessageRepository)
    private repo: ContactMessageRepository,
    @inject(TYPES.EmailService) private email: EmailService,
  ) {}

  /**
   * Persists the submission, then best-effort notifies the site inbox. Email
   * failure does not fail the request. The message is already stored.
   */
  async submit(input: ContactInput): Promise<void> {
    await this.repo.create(input);

    const to = process.env.CONTACT_TO;
    if (to) {
      // Fire-and-forget: the message is already stored, so the user should not
      // wait on (or fail because of) email delivery. Errors are reported but
      // never bubble up to the request.
      void this.email
        .sendContactNotification(to, input)
        .catch((err) => captureError(err));
    }
  }
}
