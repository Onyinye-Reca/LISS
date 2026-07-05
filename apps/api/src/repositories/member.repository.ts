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
}
