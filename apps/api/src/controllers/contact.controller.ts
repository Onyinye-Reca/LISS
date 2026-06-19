import { Request, Response } from "express";
import { controller, httpPost, httpGet, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import { ContactSchema, ContactMessageView, CONTENT_ROLES } from "@liss11/shared";
import { ContactMessage } from "@prisma/client";
import { TYPES } from "../types";
import { ContactService } from "../services/contact.service";
import { ContactMessageRepository } from "../repositories/contact-message.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(m: ContactMessage): ContactMessageView {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  };
}

const adminGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

@controller("/contact")
export class ContactController {
  constructor(
    @inject(TYPES.ContactService) private contact: ContactService,
    @inject(TYPES.ContactMessageRepository) private repo: ContactMessageRepository,
  ) {}

  // Public: submit the contact form.
  @httpPost("/", validateBody(ContactSchema))
  async submit(req: Request, res: Response) {
    try {
      await this.contact.submit(req.body);
      res.json({ ok: true, message: "Thanks for reaching out. We'll be in touch." });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not send your message" });
    }
  }

  // Admin inbox: read submitted messages.
  @httpGet("/", ...adminGuards)
  async list(_req: Request, res: Response) {
    const messages = await this.repo.list();
    res.json({ messages: messages.map(toView) });
  }

  @httpDelete("/:id", ...adminGuards)
  async remove(req: Request, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Message not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete message" });
    }
  }
}
