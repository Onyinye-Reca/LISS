import { inject, injectable } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../types";

type PasswordResetTokenRecord = {
  id: string;
  tokenHash: string;
  memberId: string;
  expiresAt: Date;
  createdAt: Date;
};

type PasswordResetTokenDelegate = {
  deleteMany(args: { where: { memberId: string } }): Promise<{ count: number }>;
  create(args: {
    data: {
      memberId: string;
      tokenHash: string;
      expiresAt: Date;
    };
  }): Promise<PasswordResetTokenRecord>;
  findUnique(args: {
    where: { tokenHash: string };
  }): Promise<PasswordResetTokenRecord | null>;
  delete(args: { where: { id: string } }): Promise<PasswordResetTokenRecord>;
};

/** Data access for password-reset tokens. Stores hashes only. */
@injectable()
export class PasswordResetTokenRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  private get tokenStore(): PasswordResetTokenDelegate {
    return (
      this.prisma as unknown as { passwordResetToken: PasswordResetTokenDelegate }
    ).passwordResetToken;
  }

  /** Invalidate any outstanding reset tokens for a member before issuing a new one. */
  deleteForMember(memberId: string): Promise<{ count: number }> {
    return this.tokenStore.deleteMany({ where: { memberId } });
  }

  create(data: {
    memberId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetTokenRecord> {
    return this.tokenStore.create({ data });
  }

  findByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    return this.tokenStore.findUnique({ where: { tokenHash } });
  }

  deleteById(id: string): Promise<PasswordResetTokenRecord> {
    return this.tokenStore.delete({ where: { id } });
  }
}
