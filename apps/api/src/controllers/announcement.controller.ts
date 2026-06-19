import { Request, Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  AnnouncementCreateSchema,
  AnnouncementUpdateSchema,
  AnnouncementView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { Announcement, Prisma } from "@prisma/client";
import { TYPES } from "../types";
import { AnnouncementRepository } from "../repositories/announcement.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(a: Announcement): AnnouncementView {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    coverUrl: a.coverUrl,
    publishedAt: a.publishedAt.toISOString(),
  };
}

// Map the validated body to Prisma input, turning the date string into a Date.
// Omitting publishedAt on create lets the DB default (now()) apply.
function toData(body: {
  title?: string;
  body?: string;
  coverUrl?: string | null;
  publishedAt?: string | null;
}): Prisma.AnnouncementUncheckedUpdateInput {
  const data: Prisma.AnnouncementUncheckedUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.body !== undefined) data.body = body.body;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;
  if (body.publishedAt !== undefined && body.publishedAt !== null) {
    data.publishedAt = new Date(body.publishedAt);
  }
  return data;
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

@controller("/announcements")
export class AnnouncementController {
  constructor(
    @inject(TYPES.AnnouncementRepository) private repo: AnnouncementRepository,
  ) {}

  // Members-only (PRD access split): require a session to read announcements.
  @httpGet("/", requireAuth)
  async list(_req: Request, res: Response) {
    const items = await this.repo.list();
    res.json({ announcements: items.map(toView) });
  }

  @httpGet("/:id", requireAuth)
  async detail(req: Request, res: Response) {
    const item = await this.repo.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Announcement not found" });
    res.json({ announcement: toView(item) });
  }

  @httpPost("/", ...writeGuards, validateBody(AnnouncementCreateSchema))
  async create(req: Request, res: Response) {
    try {
      const item = await this.repo.create(
        toData(req.body) as Prisma.AnnouncementUncheckedCreateInput,
      );
      res.status(201).json({ announcement: toView(item) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create announcement" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(AnnouncementUpdateSchema))
  async update(req: Request, res: Response) {
    try {
      const item = await this.repo.update(req.params.id, toData(req.body));
      res.json({ announcement: toView(item) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Announcement not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update announcement" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: Request, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Announcement not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete announcement" });
    }
  }
}
