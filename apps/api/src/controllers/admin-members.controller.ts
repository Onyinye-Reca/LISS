import { Request, Response } from "express";
import { controller, httpPut } from "inversify-express-utils";
import { inject } from "inversify";
import { Role, RoleUpdateInput, RoleUpdateSchema } from "@liss11/shared";
import { TYPES } from "../types";
import { MemberRepository } from "../repositories/member.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

@controller("/admin/members")
export class AdminMembersController {
  constructor(@inject(TYPES.MemberRepository) private members: MemberRepository) {}

  // Only SUPER_ADMIN may change another member's role.
  @httpPut("/:id/role", requireAuth, requireRole(Role.SUPER_ADMIN), validateBody(RoleUpdateSchema))
  async setRole(req: Request, res: Response) {
    const id = req.params.id;
    const { role } = req.body as RoleUpdateInput;
    try {
      const updated = await this.members.setRole(id, role);
      res.json({ member: { id: updated.id, role: updated.role } });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update role" });
    }
  }
}
