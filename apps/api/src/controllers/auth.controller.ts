import { Request, Response } from "express";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import {
  RegisterSchema,
  LoginSchema,
  ResendVerificationSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@liss11/shared";
import { TYPES } from "../types";
import { AuthService, AuthError } from "../services/auth.service";
import { validateBody } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";
import { shouldUseSecureCookies, cookieSameSite } from "../config/cookies";

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
        httpOnly: true, // JS can't read it. Kills the XSS token-theft vector
        secure: shouldUseSecureCookies(),
        sameSite: cookieSameSite(),
        path: "/",
        maxAge: this.auth.tokenTtlMs,
      });
      res.json({ member });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpGet("/verify")
  async verify(req: Request, res: Response) {
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
    const token = typeof req.query.token === "string" ? req.query.token : "";
    try {
      await this.auth.verify(token);
      // Land the user back on the web app with a success flag.
      res.redirect(`${webOrigin}/?verified=1`);
    } catch (err) {
      if (err instanceof AuthError) {
        return res.redirect(`${webOrigin}/?verified=0`);
      }
      this.handle(err, res);
    }
  }

  @httpPost("/resend-verification", validateBody(ResendVerificationSchema))
  async resendVerification(req: Request, res: Response) {
    try {
      await this.auth.resendVerification(req.body.email);
      // Generic response. Never reveal whether the email exists.
      res.json({ ok: true, message: "If that account exists, a link has been sent." });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpPost("/forgot-password", validateBody(ForgotPasswordSchema))
  async forgotPassword(req: Request, res: Response) {
    try {
      await this.auth.requestPasswordReset(req.body.email);
      // Generic response. Never reveal whether the email exists.
      res.json({ ok: true, message: "If that account exists, a reset link has been sent." });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpPost("/reset-password", validateBody(ResetPasswordSchema))
  async resetPassword(req: Request, res: Response) {
    try {
      await this.auth.resetPassword(req.body.token, req.body.password);
      // Clear any cookie on this client; other sessions are invalidated by
      // the tokenVersion bump.
      res.clearCookie("token", {
        path: "/",
        secure: shouldUseSecureCookies(),
        sameSite: cookieSameSite(),
      });
      res.json({ ok: true, message: "Password updated. Please log in." });
    } catch (err) {
      this.handle(err, res);
    }
  }

  @httpPost("/logout")
  logout(_req: Request, res: Response) {
    res.clearCookie("token", {
      path: "/",
      secure: shouldUseSecureCookies(),
      sameSite: cookieSameSite(),
    });
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
    captureError(err);
    res.status(500).json({ error: "Internal error" });
  }
}
