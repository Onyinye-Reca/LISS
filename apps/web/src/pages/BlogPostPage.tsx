import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BlogPostView } from "@liss11/shared";
import { getBlogPost } from "../lib/content-api";
import { formatDate } from "../lib/format";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getBlogPost(slug)
      .then(setPost)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/blog" className="text-sm text-ink/60 hover:text-maroon">
        ← All posts
      </Link>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : error || !post ? (
        <p className="mt-12 text-center text-ink/60">{error ?? "Post not found."}</p>
      ) : (
        <article className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            {formatDate(post.publishedAt)} · {post.author}
            {!post.isPublished && (
              <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/60">
                Draft
              </span>
            )}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-maroon">{post.title}</h1>
          {post.coverUrl && (
            <img src={post.coverUrl} alt="" className="mt-6 w-full rounded-xl object-cover" />
          )}
          <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-ink/80">
            {post.body}
          </div>
        </article>
      )}
    </main>
  );
}
