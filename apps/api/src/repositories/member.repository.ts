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
    fullName: string;
    email: string;
    passwordHash: string;
  }): Promise<Member> {
    return this.prisma.member.create({ data });
  }
}
