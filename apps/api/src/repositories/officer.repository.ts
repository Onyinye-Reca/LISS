import { inject, injectable } from "inversify";
import { PrismaClient, Officer, Prisma } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class OfficerRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Current first, then by tier (declaration order), then sortOrder/name.
  list(): Promise<Officer[]> {
    return this.prisma.officer.findMany({
      orderBy: [
        { isPast: "asc" },
        { tier: "asc" },
        { sortOrder: "asc" },
        { fullName: "asc" },
      ],
    });
  }

  findById(id: string): Promise<Officer | null> {
    return this.prisma.officer.findUnique({ where: { id } });
  }

  create(data: Prisma.OfficerCreateInput): Promise<Officer> {
    return this.prisma.officer.create({ data });
  }

  update(id: string, data: Prisma.OfficerUpdateInput): Promise<Officer> {
    return this.prisma.officer.update({ where: { id }, data });
  }

  delete(id: string): Promise<Officer> {
    return this.prisma.officer.delete({ where: { id } });
  }
}
