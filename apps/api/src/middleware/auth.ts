import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@liss11/shared";

export interface AuthedRequest extends Request {
  auth?: { memberId: string; role: Role };
}

/**
 * Looks up a member's current role + tokenVersion. Wired from the DI
 * container at startup (see server.ts). When set, the auth guard enforces
 * tokenVersion, so a password reset invalidates outstanding sessions.
 */
export type AuthLookup = (
  memberId: string,
) => Promise<{ role: string; tokenVersion: number } | null>;

let authLookup: AuthLookup | null = null;

export function configureAuthLookup(lookup: AuthLookup): void {
  authLookup = lookup;
}

/** Verifies the JWT carried in the httpOnly cookie. Runs on every protected request (PRD 3.3). */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const payload = jwt.verify(token, secret) as {
      sub: string;
      role: Role;
      ver?: number;
    };

    // When the lookup is wired, confirm the session is still valid against the
    // DB: the member must exist and the tokenVersion must match. This is the
    // mechanism that logs out old sessions after a password reset.
    if (authLookup) {
      const current = await authLookup(payload.sub);
      if (!current) {
        return res.status(401).json({ error: "Session no longer valid" });
      }
      if (typeof payload.ver === "number" && payload.ver !== current.tokenVersion) {
        return res.status(401).json({ error: "Session expired, please log in again" });
      }
      // Trust the DB for the role so it can't go stale in a long-lived token.
      req.auth = { memberId: payload.sub, role: current.role as Role };
    } else {
      req.auth = { memberId: payload.sub, role: payload.role };
    }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

/**
 * Soft auth for pages that are public but render differently when logged in
 * (e.g. public events: guests see public ones, members see all + their RSVP).
 * Populates req.auth when a valid session exists; never rejects.
 */
export async function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return next();
  try {
    const payload = jwt.verify(token, secret) as {
      sub: string;
      role: Role;
      ver?: number;
    };
    if (authLookup) {
      const current = await authLookup(payload.sub);
      if (
        current &&
        (typeof payload.ver !== "number" || payload.ver === current.tokenVersion)
      ) {
        req.auth = { memberId: payload.sub, role: current.role as Role };
      }
    } else {
      req.auth = { memberId: payload.sub, role: payload.role };
    }
  } catch {
    // Ignore invalid/expired tokens - treat as a guest.
  }
  next();
}

/** Server-side role gate. Use after requireAuth (PRD 4.14). */
export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Not authenticated" });
    if (!allowed.includes(req.auth.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
