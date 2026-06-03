import { Request, Response } from "express";
import { controller, httpGet, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import {
  RegionUpdateSchema,
  RegionView,
  RegionKey,
  REGION_KEYS,
  CONTENT_ROLES,
} from "@liss11/shared";
import { Region } from "@prisma/client";
import { TYPES } from "../types";
import { RegionRepository } from "../repositories/region.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(r: Region): RegionView {
  return {
    id: r.id,
    key: r.key as RegionKey,
    name: r.name,
    description: r.description,
    repName: r.repName,
    repEmail: r.repEmail,
    repWhatsapp: r.repWhatsapp,
    memberCount: r.memberCount,
  };
}

@controller("/regions")
export class RegionController {
  constructor(@inject(TYPES.RegionRepository) private repo: RegionRepository) {}

  @httpGet("/")
  async list(_req: Request, res: Response) {
    const regions = await this.repo.list();
    res.json({ regions: regions.map(toView) });
  }

  // Regions are fixed (seeded) and edited by key, not created/deleted.
  @httpPut(
    "/:key",
    requireAuth,
    requireRole(...CONTENT_ROLES),
    validateBody(RegionUpdateSchema),
  )
  async update(req: Request, res: Response) {
    const key = req.params.key as RegionKey;
    if (!REGION_KEYS.includes(key)) {
      return res.status(400).json({ error: "Unknown region" });
    }
    try {
      const region = await this.repo.update(key, req.body);
      res.json({ region: toView(region) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not update region" });
    }
  }
}
