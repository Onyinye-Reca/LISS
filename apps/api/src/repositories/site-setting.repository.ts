import { inject, injectable } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class SiteSettingRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // All settings as a plain key -> value map.
  async getMap(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  upsert(key: string, value: string) {
    return this.prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  // Clearing a setting removes the row (so getMap falls back to null).
  async clear(key: string): Promise<void> {
    await this.prisma.siteSetting.deleteMany({ where: { key } });
  }
}
