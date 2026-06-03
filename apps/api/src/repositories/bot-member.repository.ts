import { inject, injectable } from "inversify";
import { PrismaClient, BotMember, Prisma } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class BotMemberRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  list(): Promise<BotMember[]> {
    return this.prisma.botMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
    });
  }

  findById(id: string): Promise<BotMember | null> {
    return this.prisma.botMember.findUnique({ where: { id } });
  }

  create(data: Prisma.BotMemberCreateInput): Promise<BotMember> {
    return this.prisma.botMember.create({ data });
  }

  update(id: string, data: Prisma.BotMemberUpdateInput): Promise<BotMember> {
    return this.prisma.botMember.update({ where: { id }, data });
  }

  delete(id: string): Promise<BotMember> {
    return this.prisma.botMember.delete({ where: { id } });
  }
}
