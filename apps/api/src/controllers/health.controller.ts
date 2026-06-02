import { Request, Response } from "express";
import { controller, httpGet } from "inversify-express-utils";
import { Role } from "@liss11/shared";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

@controller("/health")
export class HealthController {
  /** Open liveness check used by the web app's status dot. */
  @httpGet("/")
  index(_req: Request, res: Response) {
    res.json({ status: "ok", service: "liss11-api" });
  }

  /** Proves the auth hook + role guard + cookie round-trip all work. */
  @httpGet("/secure", requireAuth, requireRole(Role.ADMIN, Role.SUPER_ADMIN))
  secure(req: AuthedRequest, res: Response) {
    res.json({ status: "ok", you: req.auth });
  }
}
