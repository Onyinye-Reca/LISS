import { inject, injectable } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../types";

type VerificationTokenRecord = {
  id: string;
  tokenHash: string;
  memberId: string;
  expiresAt: Date;
  createdAt: Date;
};

type VerificationTokenDelegate = {
  deleteMany(args: { where: { memberId: string } }): Promise<{ count: number }>;
  create(args: {
    data: {
      memberId: string;
      tokenHash: string;
      expiresAt: Date;
    };
  }): Promise<VerificationTokenRecord>;
  findUnique(args: {
    where: { tokenHash: string };
  }): Promise<VerificationTokenRecord | null>;
  delete(args: { where: { id: string } }): Promise<VerificationTokenRecord>;
};

/** Data access for email-verification tokens. Stores hashes only. */
@injectable()
export class VerificationTokenRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  private get tokenStore(): VerificationTokenDelegate {
    return (this.prisma as unknown as { verificationToken: VerificationTokenDelegate })
      .verificationToken;
  }

  /** Invalidate any outstanding tokens for a member before issuing a new one. */
  deleteForMember(memberId: string): Promise<{ count: number }> {
    return this.tokenStore.deleteMany({ where: { memberId } });
  }

  create(data: {
    memberId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<VerificationTokenRecord> {
    return this.tokenStore.create({ data });
  }

  findByHash(tokenHash: string): Promise<VerificationTokenRecord | null> {
    return this.tokenStore.findUnique({ where: { tokenHash } });
  }

  deleteById(id: string): Promise<VerificationTokenRecord> {
    return this.tokenStore.delete({ where: { id } });
  }
}
