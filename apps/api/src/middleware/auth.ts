import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@liss11/shared";

export interface AuthedRequest extends Request {
  auth?: { memberId: string; role: Role };
}

/** Verifies the JWT carried in the httpOnly cookie. Runs on every protected request (PRD 3.3). */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const payload = jwt.verify(token, secret) as { sub: string; role: Role };
    req.auth = { memberId: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
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
