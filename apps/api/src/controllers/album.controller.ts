import { Request, Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  AlbumCreateSchema,
  AlbumUpdateSchema,
  GalleryImageCreateSchema,
  GalleryImageUpdateSchema,
  AlbumView,
  GalleryImageView,
  CONTENT_ROLES,
} from "@liss11/shared";
import { GalleryImage, Prisma } from "@prisma/client";
import { TYPES } from "../types";
import { AlbumRepository, AlbumWithImages } from "../repositories/album.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { captureError } from "../instrument";

function imageView(i: GalleryImage): GalleryImageView {
  return { id: i.id, url: i.url, caption: i.caption, sortOrder: i.sortOrder };
}

function toView(a: AlbumWithImages): AlbumView {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    // Fall back to the first image so an album always has a cover to show.
    coverUrl: a.coverUrl ?? a.images[0]?.url ?? null,
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
    sortOrder: a.sortOrder,
    imageCount: a.images.length,
    images: a.images.map(imageView),
  };
}

// Map validated body to Prisma input, converting the date string to a Date.
function toData(body: {
  title?: string;
  description?: string | null;
  coverUrl?: string | null;
  eventDate?: string | null;
  sortOrder?: number;
}): Prisma.AlbumUncheckedUpdateInput {
  const data: Prisma.AlbumUncheckedUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.eventDate !== undefined) {
    data.eventDate = body.eventDate ? new Date(body.eventDate) : null;
  }
  return data;
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

@controller("/albums")
export class AlbumController {
  constructor(@inject(TYPES.AlbumRepository) private repo: AlbumRepository) {}

  @httpGet("/")
  async list(_req: Request, res: Response) {
    const albums = await this.repo.list();
    res.json({ albums: albums.map(toView) });
  }

  @httpGet("/:id")
  async detail(req: Request, res: Response) {
    const album = await this.repo.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json({ album: toView(album) });
  }

  @httpPost("/", ...writeGuards, validateBody(AlbumCreateSchema))
  async create(req: Request, res: Response) {
    try {
      const album = await this.repo.create(
        toData(req.body) as Prisma.AlbumUncheckedCreateInput,
      );
      res.status(201).json({ album: toView(album) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create album" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(AlbumUpdateSchema))
  async update(req: Request, res: Response) {
    try {
      const album = await this.repo.update(req.params.id, toData(req.body));
      res.json({ album: toView(album) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Album not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update album" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: Request, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Album not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete album" });
    }
  }

  // --- Images within an album ---

  @httpPost("/:id/images", ...writeGuards, validateBody(GalleryImageCreateSchema))
  async addImage(req: Request, res: Response) {
    try {
      const image = await this.repo.addImage(req.params.id, req.body);
      res.status(201).json({ image: imageView(image) });
    } catch (err) {
      // Bad albumId -> foreign-key violation.
      if ((err as { code?: string }).code === "P2003") {
        return res.status(404).json({ error: "Album not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not add image" });
    }
  }

  @httpPut("/images/:imageId", ...writeGuards, validateBody(GalleryImageUpdateSchema))
  async updateImage(req: Request, res: Response) {
    try {
      const image = await this.repo.updateImage(req.params.imageId, req.body);
      res.json({ image: imageView(image) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Image not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update image" });
    }
  }

  @httpDelete("/images/:imageId", ...writeGuards)
  async removeImage(req: Request, res: Response) {
    try {
      await this.repo.deleteImage(req.params.imageId);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Image not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete image" });
    }
  }
}
