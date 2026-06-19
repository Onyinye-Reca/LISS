import { FormEvent, useEffect, useRef, useState } from "react";
import { AlbumView, AlbumCreateInput, GalleryImageView } from "@liss11/shared";
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbum,
  addAlbumImage,
  updateAlbumImage,
  deleteAlbumImage,
  uploadImage,
} from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { formatDate, toDateInput } from "../../lib/format";

type FormState = {
  title: string;
  description: string;
  coverUrl: string | null;
  eventDate: string;
  sortOrder: string;
};

const blank: FormState = { title: "", description: "", coverUrl: null, eventDate: "", sortOrder: "0" };

function toForm(a: AlbumView): FormState {
  return {
    title: a.title,
    description: a.description ?? "",
    coverUrl: a.coverUrl,
    eventDate: toDateInput(a.eventDate),
    sortOrder: a.sortOrder.toString(),
  };
}

function toPayload(f: FormState): AlbumCreateInput {
  return {
    title: f.title,
    description: f.description || null,
    coverUrl: f.coverUrl,
    eventDate: f.eventDate || null,
    sortOrder: f.sortOrder ? Number(f.sortOrder) : 0,
  };
}

/** Manages the photos inside one saved album: batch upload + delete. */
function AlbumImages({ album, onChange }: { album: AlbumView; onChange: () => void }) {
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setBusy({ done: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], "gallery");
        await addAlbumImage(album.id, { url, caption: null, sortOrder: 0 });
        setBusy({ done: i + 1, total: files.length });
      }
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = async (imageId: string) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await deleteAlbumImage(imageId);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="mt-6 border-t border-gold/20 pt-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-maroon">Photos ({album.images.length})</h3>
        <label className="cursor-pointer rounded-lg bg-maroon px-3 py-1.5 text-sm font-semibold text-white hover:bg-maroon-dark">
          {busy ? `Uploading ${busy.done}/${busy.total}…` : "Add photos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={!!busy}
            onChange={onFiles}
            className="hidden"
          />
        </label>
      </div>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      {album.images.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">No photos yet. Use “Add photos” to upload (you can select several at once).</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {album.images.map((img) => (
            <ImageCell
              key={img.id}
              img={img}
              onRemove={() => void removeImage(img.id)}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** One gallery photo with a delete button and a save-on-blur caption field. */
function ImageCell({
  img,
  onRemove,
  onChange,
}: {
  img: GalleryImageView;
  onRemove: () => void;
  onChange: () => void;
}) {
  const [caption, setCaption] = useState(img.caption ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (caption.trim() === (img.caption ?? "")) return; // unchanged
    setSaving(true);
    try {
      await updateAlbumImage(img.id, caption.trim() || null);
      onChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-lg bg-ink/5">
        <img src={img.url} alt={img.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete photo"
          className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white group-hover:flex"
        >
          ×
        </button>
      </div>
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={() => void save()}
        placeholder={saving ? "Saving…" : "Add caption"}
        className="mt-1 w-full rounded border border-ink/15 px-2 py-1 text-xs outline-none focus:border-gold"
      />
    </div>
  );
}

function AlbumEditor({
  album,
  onSaved,
  onCancel,
}: {
  album: AlbumView | null; // null = creating
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(album ? toForm(album) : blank);
  const [current, setCurrent] = useState<AlbumView | null>(album);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const reloadImages = async () => {
    if (!current) return;
    setCurrent(await getAlbum(current.id));
    onSaved();
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = toPayload(form);
      const saved = current
        ? await updateAlbum(current.id, payload)
        : await createAlbum(payload);
      setCurrent(saved); // reveals the photo manager for a freshly-created album
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
      <form onSubmit={save} className="space-y-4">
        <h2 className="font-semibold text-maroon">{current ? "Edit" : "New"} album</h2>
        {error && <Alert>{error}</Alert>}
        <ImageUpload
          label="Cover thumbnail (optional)"
          shape="rect"
          value={form.coverUrl}
          folder="gallery"
          onChange={(url) => set({ coverUrl: url })}
        />
        <p className="rounded-lg bg-card px-3 py-2 text-xs text-ink/70">
          The cover is just the album&apos;s thumbnail. The album&apos;s actual
          pictures are added with <strong>“Add photos”</strong> below
          {current ? "." : " (it appears once you create the album)."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Title" required value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField label="Event date (optional)" type="date" value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} />
        </div>
        <TextArea label="Description (optional)" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        <TextField label="Sort order" type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} />
        <div className="flex gap-3">
          <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : current ? "Save changes" : "Create album"}</Button>
          <button type="button" onClick={onCancel} className="text-sm font-medium text-ink/60 underline">Done</button>
        </div>
      </form>

      {current && <AlbumImages album={current} onChange={reloadImages} />}
    </div>
  );
}

export default function GalleryAdminPage() {
  const [albums, setAlbums] = useState<AlbumView[]>([]);
  const [editing, setEditing] = useState<{ album: AlbumView | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => getAlbums().then(setAlbums).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);

  const remove = async (a: AlbumView) => {
    if (!confirm(`Delete album "${a.title}" and all its photos?`)) return;
    try {
      await deleteAlbum(a.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-maroon">Gallery</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ album: null })} className="w-auto px-4">
            New album
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing ? (
        <AlbumEditor
          album={editing.album}
          onSaved={refresh}
          onCancel={() => {
            setEditing(null);
            void refresh();
          }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.length === 0 ? (
            <p className="text-sm text-ink/50">No albums yet. Create the first one.</p>
          ) : (
            albums.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-xl border border-gold/20 bg-white">
                <div className="aspect-[4/3] w-full bg-ink/5">
                  {a.coverUrl ? (
                    <img src={a.coverUrl} alt={a.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-ink/30">🖼</div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-maroon">{a.title}</h2>
                  <p className="mt-1 text-xs text-ink/60">
                    {a.eventDate && <span>{formatDate(a.eventDate)} · </span>}
                    {a.imageCount} {a.imageCount === 1 ? "photo" : "photos"}
                  </p>
                  <div className="mt-3 text-sm">
                    <button onClick={() => setEditing({ album: a })} className="mr-3 font-medium text-maroon hover:underline">
                      Manage
                    </button>
                    <button onClick={() => void remove(a)} className="font-medium text-danger hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
