import { Request, Response } from "express";
import { controller, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import { ContactSchema } from "@liss11/shared";
import { TYPES } from "../types";
import { ContactService } from "../services/contact.service";
import { validateBody } from "../middleware/validate";
import { captureError } from "../instrument";

@controller("/contact")
export class ContactController {
  constructor(@inject(TYPES.ContactService) private contact: ContactService) {}

  @httpPost("/", validateBody(ContactSchema))
  async submit(req: Request, res: Response) {
    try {
      await this.contact.submit(req.body);
      res.json({ ok: true, message: "Thanks for reaching out — we'll be in touch." });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not send your message" });
    }
  }
}
