import { Request, Response } from "express";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import { RegisterSchema, LoginSchema } from "@liss11/shared";
import { TYPES } from "../types";
import { AuthService, AuthError } from "../services/auth.service";
import { validateBody } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/auth";

@controller("/auth")
export class AuthController {
  constructor(@inject(TYPES.AuthService) private auth: AuthService) {}

  @httpPost("/register", validateBody(RegisterSchema))
  async register(req: Request, res: Response) {
    try {
      const member = await this.auth.register(req.body);
      res.status(201).json({ member });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpPost("/login", validateBody(LoginSchema))
  async login(req: Request, res: Response) {
    try {
      const { token, member } = await this.auth.login(req.body);
      res.cookie("token", token, {
        httpOnly: true, // JS can't read it — kills the XSS token-theft vector
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: this.auth.tokenTtlMs,
      });
      res.json({ member });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpPost("/logout")
  logout(_req: Request, res: Response) {
    res.clearCookie("token", { path: "/" });
    res.json({ ok: true });
  }

  @httpGet("/me", requireAuth)
  async me(req: AuthedRequest, res: Response) {
    const member = await this.auth.getMember(req.auth!.memberId);
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json({ member });
  }

  private handle(err: unknown, res: Response) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
}
