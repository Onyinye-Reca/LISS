import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlbumView, GalleryImageView } from "@liss11/shared";
import { getAlbum } from "../lib/content-api";
import { formatDate } from "../lib/format";
import Lightbox from "../components/Lightbox";

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null); // lightbox index

  useEffect(() => {
    if (!id) return;
    getAlbum(id)
      .then(setAlbum)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // Show the album's photos; if none were added but a cover exists, fall back
  // to showing the cover so the page is never blank for visitors.
  const images: GalleryImageView[] =
    album && album.images.length === 0 && album.coverUrl
      ? [{ id: "cover", url: album.coverUrl, caption: null, sortOrder: 0 }]
      : album?.images ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <Link to="/gallery" className="text-sm text-ink/60 hover:text-maroon">
        ← All albums
      </Link>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : error || !album ? (
        <p className="mt-12 text-center text-ink/60">{error ?? "Album not found."}</p>
      ) : (
        <>
          <header className="mt-6">
            <h1 className="text-3xl font-bold text-maroon">{album.title}</h1>
            {album.eventDate && (
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gold">
                {formatDate(album.eventDate)}
              </p>
            )}
            {album.description && (
              <p className="mt-3 max-w-2xl text-ink/70">{album.description}</p>
            )}
          </header>

          {images.length === 0 ? (
            <p className="mt-12 text-center text-ink/50">
              No photos in this album yet.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="aspect-square overflow-hidden rounded-lg bg-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? album.title}
                    className="h-full w-full object-cover transition hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {active !== null && (
            <Lightbox
              images={images}
              index={active}
              onChange={setActive}
              onClose={() => setActive(null)}
            />
          )}
        </>
      )}
    </main>
  );
}
