import { Response } from "express";
import { controller, httpGet, httpPost, httpPut, httpDelete } from "inversify-express-utils";
import { inject } from "inversify";
import {
  BlogPostCreateSchema,
  BlogPostUpdateSchema,
  BlogPostView,
  CONTENT_ROLES,
  Role,
} from "@liss11/shared";
import { BlogPost, Prisma } from "@prisma/client";
import { TYPES } from "../types";
import { BlogPostRepository } from "../repositories/blog-post.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(p: BlogPost): BlogPostView {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    coverUrl: p.coverUrl,
    author: p.author,
    isPublished: p.isPublished,
    publishedAt: p.publishedAt.toISOString(),
  };
}

function toData(body: {
  title?: string;
  excerpt?: string | null;
  body?: string;
  coverUrl?: string | null;
  author?: string;
  isPublished?: boolean;
  publishedAt?: string | null;
}): Prisma.BlogPostUncheckedUpdateInput {
  const data: Prisma.BlogPostUncheckedUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.body !== undefined) data.body = body.body;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl;
  if (body.author !== undefined) data.author = body.author;
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;
  if (body.publishedAt !== undefined && body.publishedAt !== null) {
    data.publishedAt = new Date(body.publishedAt);
  }
  return data;
}

// Content-role admins may see/manage drafts; everyone else sees published only.
function canSeeDrafts(req: AuthedRequest): boolean {
  return !!req.auth && CONTENT_ROLES.includes(req.auth.role as Role);
}

const writeGuards = [requireAuth, requireRole(...CONTENT_ROLES)] as const;

// Public blog (SEO). Reads are open; drafts are visible only to content roles.
@controller("/blog")
export class BlogPostController {
  constructor(
    @inject(TYPES.BlogPostRepository) private repo: BlogPostRepository,
  ) {}

  @httpGet("/", optionalAuth)
  async list(req: AuthedRequest, res: Response) {
    const posts = await this.repo.list(canSeeDrafts(req));
    res.json({ posts: posts.map(toView) });
  }

  @httpGet("/:slug", optionalAuth)
  async detail(req: AuthedRequest, res: Response) {
    const post = await this.repo.findBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: "Post not found" });
    // Hide unpublished drafts from non-admins.
    if (!post.isPublished && !canSeeDrafts(req)) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ post: toView(post) });
  }

  @httpPost("/", ...writeGuards, validateBody(BlogPostCreateSchema))
  async create(req: AuthedRequest, res: Response) {
    try {
      const post = await this.repo.create(
        toData(req.body) as Omit<Prisma.BlogPostUncheckedCreateInput, "slug">,
      );
      res.status(201).json({ post: toView(post) });
    } catch (err) {
      captureError(err);
      res.status(500).json({ error: "Could not create post" });
    }
  }

  @httpPut("/:id", ...writeGuards, validateBody(BlogPostUpdateSchema))
  async update(req: AuthedRequest, res: Response) {
    try {
      const post = await this.repo.update(req.params.id, toData(req.body));
      res.json({ post: toView(post) });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Post not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not update post" });
    }
  }

  @httpDelete("/:id", ...writeGuards)
  async remove(req: AuthedRequest, res: Response) {
    try {
      await this.repo.delete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Post not found" });
      }
      captureError(err);
      res.status(500).json({ error: "Could not delete post" });
    }
  }
}
