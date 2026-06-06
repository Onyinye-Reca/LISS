import { inject, injectable } from "inversify";
import { PrismaClient, BlogPost, Prisma } from "@prisma/client";
import { TYPES } from "../types";

/** Lowercase, hyphenated, URL-safe slug from a title. */
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "post"
  );
}

@injectable()
export class BlogPostRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // `includeDrafts` is true only for content-role admins.
  list(includeDrafts: boolean): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      where: includeDrafts ? {} : { isPublished: true },
      orderBy: [{ publishedAt: "desc" }],
    });
  }

  findBySlug(slug: string): Promise<BlogPost | null> {
    return this.prisma.blogPost.findUnique({ where: { slug } });
  }

  findById(id: string): Promise<BlogPost | null> {
    return this.prisma.blogPost.findUnique({ where: { id } });
  }

  async create(
    data: Omit<Prisma.BlogPostUncheckedCreateInput, "slug">,
  ): Promise<BlogPost> {
    const slug = await this.uniqueSlug(slugify(data.title));
    return this.prisma.blogPost.create({ data: { ...data, slug } });
  }

  update(id: string, data: Prisma.BlogPostUncheckedUpdateInput): Promise<BlogPost> {
    // Slug stays stable across edits so existing links don't break.
    return this.prisma.blogPost.update({ where: { id }, data });
  }

  delete(id: string): Promise<BlogPost> {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  // Appends -2, -3, ... until the slug is free.
  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (await this.prisma.blogPost.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    return slug;
  }
}
