import { inject, injectable } from "inversify";
import { PrismaClient, Album, GalleryImage, Prisma } from "@prisma/client";
import { TYPES } from "../types";

export type AlbumWithImages = Album & { images: GalleryImage[] };

@injectable()
export class AlbumRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Manual sort order first, then most recent event, with images in order.
  list(): Promise<AlbumWithImages[]> {
    return this.prisma.album.findMany({
      orderBy: [{ sortOrder: "asc" }, { eventDate: "desc" }, { createdAt: "desc" }],
      include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
  }

  findById(id: string): Promise<AlbumWithImages | null> {
    return this.prisma.album.findUnique({
      where: { id },
      include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
  }

  create(data: Prisma.AlbumUncheckedCreateInput): Promise<AlbumWithImages> {
    return this.prisma.album.create({ data, include: { images: true } });
  }

  update(id: string, data: Prisma.AlbumUncheckedUpdateInput): Promise<AlbumWithImages> {
    return this.prisma.album.update({
      where: { id },
      data,
      include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
  }

  delete(id: string): Promise<Album> {
    // Images cascade-delete via the schema relation.
    return this.prisma.album.delete({ where: { id } });
  }

  addImage(
    albumId: string,
    data: { url: string; caption?: string | null; sortOrder?: number },
  ): Promise<GalleryImage> {
    return this.prisma.galleryImage.create({
      data: {
        albumId,
        url: data.url,
        caption: data.caption ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  deleteImage(imageId: string): Promise<GalleryImage> {
    return this.prisma.galleryImage.delete({ where: { id: imageId } });
  }
}
