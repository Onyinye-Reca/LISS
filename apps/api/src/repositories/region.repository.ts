import { inject, injectable } from "inversify";
import { PrismaClient, Region, RegionKey, Prisma } from "@prisma/client";
import { TYPES } from "../types";

// The five fixed regions (PRD 4.5). Mirrors prisma/seed.ts; kept here so the
// API self-heals environments where the seed was never run.
const FIXED_REGIONS: { key: RegionKey; name: string }[] = [
  { key: "SOUTH_SOUTH", name: "South-South" },
  { key: "SOUTH_EAST", name: "South-East" },
  { key: "SOUTH_WEST", name: "South-West" },
  { key: "NORTH", name: "North" },
  { key: "DIASPORA", name: "Diaspora" },
];

@injectable()
export class RegionRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  /**
   * Idempotently ensures the five fixed regions exist. `update: {}` means an
   * existing region is never clobbered, so EXCOS edits are preserved.
   */
  async ensureSeeded(): Promise<void> {
    await Promise.all(
      FIXED_REGIONS.map((r) =>
        this.prisma.region.upsert({
          where: { key: r.key },
          update: {},
          create: { key: r.key, name: r.name },
        }),
      ),
    );
  }

  // Declared enum order: South-South, South-East, South-West, North, Diaspora.
  async list(): Promise<Region[]> {
    let regions = await this.prisma.region.findMany({ orderBy: { key: "asc" } });
    if (regions.length < FIXED_REGIONS.length) {
      // Backfill any missing fixed regions, then re-read in order.
      await this.ensureSeeded();
      regions = await this.prisma.region.findMany({ orderBy: { key: "asc" } });
    }
    return regions;
  }

  findByKey(key: RegionKey): Promise<Region | null> {
    return this.prisma.region.findUnique({ where: { key } });
  }

  update(key: RegionKey, data: Prisma.RegionUpdateInput): Promise<Region> {
    return this.prisma.region.update({ where: { key }, data });
  }
}
