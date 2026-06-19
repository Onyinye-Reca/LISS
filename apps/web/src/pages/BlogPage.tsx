import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlogPostView } from "@liss11/shared";
import { getBlogPosts } from "../lib/content-api";
import { formatDate } from "../lib/format";
import { EmptyState } from "../components/ui";

function teaser(p: BlogPostView): string {
  if (p.excerpt) return p.excerpt;
  const flat = p.body.replace(/\s+/g, " ").trim();
  return flat.length > 200 ? `${flat.slice(0, 200)}…` : flat;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Blog</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Stories, reflections and longer reads from the LISS11' community.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="✍️"
            heading="No posts yet"
            description="Articles and stories from the set will appear here."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="block overflow-hidden rounded-xl border border-gold/30 bg-card transition hover:border-gold hover:shadow-sm"
            >
              {p.coverUrl && (
                <img src={p.coverUrl} alt="" className="h-48 w-full object-cover" loading="lazy" />
              )}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                  {formatDate(p.publishedAt)} · {p.author}
                  {!p.isPublished && (
                    <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/60">
                      Draft
                    </span>
                  )}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-maroon">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{teaser(p)}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-maroon">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
