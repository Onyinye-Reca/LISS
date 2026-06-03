import { inject, injectable } from "inversify";
import { PrismaClient, Region, RegionKey, Prisma } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class RegionRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Declared enum order: South-South, South-East, South-West, North, Diaspora.
  list(): Promise<Region[]> {
    return this.prisma.region.findMany({ orderBy: { key: "asc" } });
  }

  findByKey(key: RegionKey): Promise<Region | null> {
    return this.prisma.region.findUnique({ where: { key } });
  }

  update(key: RegionKey, data: Prisma.RegionUpdateInput): Promise<Region> {
    return this.prisma.region.update({ where: { key }, data });
  }
}
