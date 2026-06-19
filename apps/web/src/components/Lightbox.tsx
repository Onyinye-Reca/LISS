import { useCallback, useEffect } from "react";
import { GalleryImageView } from "@liss11/shared";

/** Full-screen image viewer with keyboard nav (← → Esc). */
export default function Lightbox({
  images,
  index,
  onChange,
  onClose,
}: {
  images: GalleryImageView[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const prev = useCallback(
    () => onChange((index - 1 + images.length) % images.length),
    [index, images.length, onChange],
  );
  const next = useCallback(
    () => onChange((index + 1) % images.length),
    [index, images.length, onChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const img = images[index];
  if (!img) return null;
  const many = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
      >
        ×
      </button>

      {many && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous photo"
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ‹
        </button>
      )}

      <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.url}
          alt={img.caption ?? ""}
          className="max-h-[80vh] w-auto rounded-lg object-contain"
        />
        {img.caption && (
          <figcaption className="mt-3 text-center text-sm text-white/80">
            {img.caption}
          </figcaption>
        )}
        {many && (
          <p className="mt-1 text-center text-xs text-white/50">
            {index + 1} / {images.length}
          </p>
        )}
      </figure>

      {many && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next photo"
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ›
        </button>
      )}
    </div>
  );
}
