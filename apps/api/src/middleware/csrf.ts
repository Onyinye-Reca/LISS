import { Request, Response, NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "crypto";

/**
 * Double-submit-cookie CSRF protection (PRD 7.2). Required because auth is
 * cookie-based: the browser auto-sends the session cookie cross-site, so a
 * forged request would otherwise be authenticated.
 *
 * Flow: GET /csrf issues a random token as both a cookie and a JSON value.
 * The client echoes the value in the X-CSRF-Token header on every mutating
 * request; the server checks that header == cookie. A cross-site attacker
 * can ride the cookie but cannot read the value to set the header.
 * SameSite=Lax on both cookies is the second layer.
 */
export const CSRF_COOKIE = "csrf";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Paths exempt from CSRF (e.g. machine-to-machine webhooks that authenticate
// via signature, not cookies). None yet; Paystack's webhook will go here.
const EXEMPT_PREFIXES: string[] = [];

export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // readable by the client so it can echo it in the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return token;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PREFIXES.some((p) => req.path.startsWith(p))) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ error: "Invalid or missing CSRF token" });
  }
  next();
}
