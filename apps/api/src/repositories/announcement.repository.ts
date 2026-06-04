import { inject, injectable } from "inversify";
import { PrismaClient, Announcement, Prisma } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class AnnouncementRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Newest first (by the displayed publish date).
  list(): Promise<Announcement[]> {
    return this.prisma.announcement.findMany({
      orderBy: [{ publishedAt: "desc" }],
    });
  }

  findById(id: string): Promise<Announcement | null> {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  create(data: Prisma.AnnouncementUncheckedCreateInput): Promise<Announcement> {
    return this.prisma.announcement.create({ data });
  }

  update(
    id: string,
    data: Prisma.AnnouncementUncheckedUpdateInput,
  ): Promise<Announcement> {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  delete(id: string): Promise<Announcement> {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
