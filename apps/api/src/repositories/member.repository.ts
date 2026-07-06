import { inject, injectable } from "inversify";
import { PrismaClient, Member } from "@prisma/client";
import { TYPES } from "../types";

/**
 * Data access for members. Wrapping Prisma here keeps DB concerns in one
 * layer so controllers/services depend on this interface, not on Prisma.
 */
@injectable()
export class MemberRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  findByEmail(email: string): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { email } });
  }

  findById(id: string): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { id } });
  }

  /** All members, oldest first, for the super-admin management table. */
  listAll(): Promise<Member[]> {
    return this.prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  }

  create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    photoUrl: string;
  }): Promise<Member> {
    return this.prisma.member.create({ data });
  }

  markVerified(id: string): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data: { verified: true },
    });
  }

  /** Sets a new password hash and bumps tokenVersion to invalidate old sessions. */
  setPassword(id: string, passwordHash: string): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
  }

  /** Lightweight lookup for the auth middleware: current role + tokenVersion. */
  findAuthInfo(id: string): Promise<{ role: string; tokenVersion: number } | null> {
    return this.prisma.member.findUnique({
      where: { id },
      select: { role: true, tokenVersion: true },
    });
  }

  /** Set a member's role (used by admin workflows). */
  setRole(id: string, role: unknown): Promise<Member> {
    // Cast to satisfy Prisma's generated enum type. Caller should validate the
    // role value (we validate at the controller level with Zod).
    return this.prisma.member.update({ where: { id }, data: { role: role as any } });
  }

  /** Admin override of a member's verified state. */
  setVerified(id: string, verified: boolean): Promise<Member> {
    return this.prisma.member.update({ where: { id }, data: { verified } });
  }

  /**
   * Activate/deactivate a member. Deactivating also bumps tokenVersion, which
   * invalidates any outstanding JWT sessions immediately (they can't log back
   * in either, per the login `approved` check).
   */
  setApproved(id: string, approved: boolean): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data: approved
        ? { approved: true }
        : { approved: false, tokenVersion: { increment: 1 } },
    });
  }

  /**
   * Counts a member's audit-bearing history. Members with votes or payments
   * must not be hard-deleted (election/financial integrity) - deactivate them.
   */
  async historyCounts(id: string): Promise<{ votes: number; payments: number }> {
    const [votes, payments] = await Promise.all([
      this.prisma.vote.count({ where: { memberId: id } }),
      this.prisma.payment.count({ where: { memberId: id } }),
    ]);
    return { votes, payments };
  }

  /** Hard-deletes a member. Cascades tokens + RSVPs; caller guards history. */
  delete(id: string): Promise<Member> {
    return this.prisma.member.delete({ where: { id } });
  }
}
