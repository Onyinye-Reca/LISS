import { Request, Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  BotMemberCreateSchema,
  BotMemberUpdateSchema,
  BotMemberView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { BotMember } from "@prisma/client";
import { TYPES } from "../types";
import { BotMemberRepository } from "../repositories/bot-member.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(b: BotMember): BotMemberView {
  return {
    id: b.id,
    firstName: b.firstName,
    lastName: b.lastName,
    designation: b.designation,
    bio: b.bio,
    email: b.email,
    photoUrl: b.photoUrl,
    sortOrder: b.sortOrder,
  };
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

@controller("/bot")
export class BotMemberController {
  constructor(@inject(TYPES.BotMemberRepository) private repo: BotMemberRepository) {}

  // Members-only (About sub-pages are gated): require a session to read.
  @httpGet("/", requireAuth)
  async list(_req: Request, res: Response) {
    const members = await this.repo.list();
    res.json({ members: members.map(toView) });
  }

  @httpPost("/", ...writeGuards, validateBody(BotMemberCreateSchema))
  async create(req: Request, res: Response) {
    try {
      const member = await this.repo.create(req.body);
      res.status(201).json({ member: toView(member) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create BOT member" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(BotMemberUpdateSchema))
  async update(req: Request, res: Response) {
    try {
      const member = await this.repo.update(req.params.id, req.body);
      res.json({ member: toView(member) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "BOT member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update BOT member" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: Request, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "BOT member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete BOT member" });
    }
  }
}
