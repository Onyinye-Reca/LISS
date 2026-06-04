import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnnouncementView } from "@liss11/shared";
import { getAnnouncement } from "../lib/content-api";
import { formatDate } from "../lib/format";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<AnnouncementView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAnnouncement(id)
      .then(setItem)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/announcements" className="text-sm text-ink/60 hover:text-maroon">
        ← All announcements
      </Link>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : error || !item ? (
        <p className="mt-12 text-center text-ink/60">
          {error ?? "Announcement not found."}
        </p>
      ) : (
        <article className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            {formatDate(item.publishedAt)}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-maroon">{item.title}</h1>
          {item.coverUrl && (
            <img
              src={item.coverUrl}
              alt=""
              className="mt-6 w-full rounded-xl object-cover"
            />
          )}
          <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-ink/80">
            {item.body}
          </div>
        </article>
      )}
    </main>
  );
}
