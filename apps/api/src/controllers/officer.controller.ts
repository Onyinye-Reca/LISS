import { Request, Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  OfficerCreateSchema,
  OfficerUpdateSchema,
  OfficerView,
  OfficerTier,
  CONTENT_ROLES,
} from "@liss11/shared";
import { Officer } from "@prisma/client";
import { TYPES } from "../types";
import { OfficerRepository } from "../repositories/officer.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(o: Officer): OfficerView {
  return {
    id: o.id,
    fullName: o.fullName,
    title: o.title,
    tier: o.tier as OfficerTier,
    email: o.email,
    whatsapp: o.whatsapp,
    termStart: o.termStart,
    termEnd: o.termEnd,
    photoUrl: o.photoUrl,
    isPast: o.isPast,
    sortOrder: o.sortOrder,
  };
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

@controller("/officers")
export class OfficerController {
  constructor(@inject(TYPES.OfficerRepository) private repo: OfficerRepository) {}

  @httpGet("/")
  async list(_req: Request, res: Response) {
    const officers = await this.repo.list();
    res.json({ officers: officers.map(toView) });
  }

  @httpPost("/", ...writeGuards, validateBody(OfficerCreateSchema))
  async create(req: Request, res: Response) {
    try {
      const officer = await this.repo.create(req.body);
      res.status(201).json({ officer: toView(officer) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create officer" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(OfficerUpdateSchema))
  async update(req: Request, res: Response) {
    try {
      const officer = await this.repo.update(req.params.id, req.body);
      res.json({ officer: toView(officer) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Officer not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update officer" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: Request, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Officer not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete officer" });
    }
  }
}
