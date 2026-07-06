import { Response } from "express";
import { controller, httpGet, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  Role,
  RoleUpdateInput,
  RoleUpdateSchema,
  MemberVerifiedInput,
  MemberVerifiedSchema,
  MemberActiveInput,
  MemberActiveSchema,
  AdminMemberView,
} from "@liss11/shared";
import { Member } from "@prisma/client";
import { TYPES } from "../types";
import { MemberRepository } from "../repositories/member.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(m: Member): AdminMemberView {
  return {
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role as Role,
    verified: m.verified,
    approved: m.approved,
    createdAt: m.createdAt.toISOString(),
  };
}

// All member management is SUPER_ADMIN only (exposes PII, alters access).
const superGuards = [requireAuth, requireRole(Role.SUPER_ADMIN)] as const;

@controller("/admin/members")
export class AdminMembersController {
  constructor(@inject(TYPES.MemberRepository) private members: MemberRepository) {}

  @httpGet("/", ...superGuards)
  async list(_req: AuthedRequest, res: Response) {
    const members = await this.members.listAll();
    res.json({ members: members.map(toView) });
  }

  // Change another member's role.
  @httpPut("/:id/role", ...superGuards, validateBody(RoleUpdateSchema))
  async setRole(req: AuthedRequest, res: Response) {
    const { role } = req.body as RoleUpdateInput;
    try {
      const updated = await this.members.setRole(req.params.id, role);
      res.json({ member: toView(updated) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update role" });
    }
  }

  // Manually verify / unverify a member.
  @httpPut("/:id/verified", ...superGuards, validateBody(MemberVerifiedSchema))
  async setVerified(req: AuthedRequest, res: Response) {
    const { verified } = req.body as MemberVerifiedInput;
    try {
      const updated = await this.members.setVerified(req.params.id, verified);
      res.json({ member: toView(updated) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update member" });
    }
  }

  // Activate / deactivate a member's ability to log in.
  @httpPut("/:id/active", ...superGuards, validateBody(MemberActiveSchema))
  async setActive(req: AuthedRequest, res: Response) {
    const { approved } = req.body as MemberActiveInput;
    if (req.params.id === req.auth!.memberId) {
      return res.status(400).json({ error: "You can't deactivate your own account." });
    }
    try {
      const updated = await this.members.setApproved(req.params.id, approved);
      res.json({ member: toView(updated) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update member" });
    }
  }

  // Hard-delete a member. Blocked for members with voting/payment history so
  // election and financial audit records stay intact - deactivate them instead.
  @httpDelete("/:id", ...superGuards)
  async remove(req: AuthedRequest, res: Response) {
    const id = req.params.id;
    if (id === req.auth!.memberId) {
      return res.status(400).json({ error: "You can't delete your own account." });
    }
    try {
      const { votes, payments } = await this.members.historyCounts(id);
      if (votes > 0 || payments > 0) {
        return res.status(409).json({
          error:
            "This member has voting or payment history and can't be deleted. Deactivate them instead.",
        });
      }
      await this.members.delete(id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete member" });
    }
  }
}
