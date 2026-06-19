import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlbumView } from "@liss11/shared";
import { getAlbums } from "../lib/content-api";
import { formatDate } from "../lib/format";
import { EmptyState } from "../components/ui";

export default function GalleryPage() {
  const [albums, setAlbums] = useState<AlbumView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Gallery</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Moments from hangouts, weddings, Annual General Meetings and game nights.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : albums.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="🖼"
            heading="No photos yet"
            description="Albums from our events will appear here once they're added."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Link
              key={a.id}
              to={`/gallery/${a.id}`}
              className="group overflow-hidden rounded-xl border border-gold/30 bg-card transition hover:border-gold hover:shadow-sm"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-ink/5">
                {a.coverUrl ? (
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-ink/30">
                    🖼
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-maroon">{a.title}</h2>
                <p className="mt-1 text-xs text-ink/60">
                  {a.eventDate && <span>{formatDate(a.eventDate)} · </span>}
                  {a.imageCount} {a.imageCount === 1 ? "photo" : "photos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
