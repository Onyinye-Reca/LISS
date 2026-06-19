import { Request, Response } from "express";
import { controller, httpGet, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import {
  SiteSettingsUpdateSchema,
  SiteSettingsView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { TYPES } from "../types";
import { SiteSettingRepository } from "../repositories/site-setting.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(map: Record<string, string>): SiteSettingsView {
  return {
    heroVideoUrl: map.heroVideoUrl ?? null,
    heroPosterUrl: map.heroPosterUrl ?? null,
  };
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

// Public read (the hero media shows on the home page for everyone); guarded write.
@controller("/settings")
export class SiteSettingController {
  constructor(
    @inject(TYPES.SiteSettingRepository) private repo: SiteSettingRepository,
  ) {}

  @httpGet("/")
  async get(_req: Request, res: Response) {
    res.json({ settings: toView(await this.repo.getMap()) });
  }

  @httpPut("/", ...writeGuards, validateBody(SiteSettingsUpdateSchema))
  async update(
    req: { body: { heroVideoUrl?: string | null; heroPosterUrl?: string | null } },
    res: Response,
  ) {
    try {
      const apply = async (key: string, value: string | null | undefined) => {
        if (value === undefined) return; // not part of this request
        if (value) await this.repo.upsert(key, value);
        else await this.repo.clear(key);
      };
      await apply("heroVideoUrl", req.body.heroVideoUrl);
      await apply("heroPosterUrl", req.body.heroPosterUrl);
      res.json({ settings: toView(await this.repo.getMap()) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not save settings" });
    }
  }
}
