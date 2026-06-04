import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnnouncementView } from "@liss11/shared";
import { getAnnouncements } from "../lib/content-api";
import { formatDate } from "../lib/format";
import { EmptyState } from "../components/ui";

/** First ~220 chars of the body, for the list preview. */
function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > 220 ? `${flat.slice(0, 220)}…` : flat;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Announcements</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          The latest news and updates from the EXCOS.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="📣"
            heading="No announcements yet"
            description="Check back soon for news and updates from the association."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/announcements/${a.id}`}
              className="block overflow-hidden rounded-xl border border-gold/30 bg-card transition hover:border-gold hover:shadow-sm"
            >
              {a.coverUrl && (
                <img
                  src={a.coverUrl}
                  alt=""
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                  {formatDate(a.publishedAt)}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-maroon">{a.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{excerpt(a.body)}</p>
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
