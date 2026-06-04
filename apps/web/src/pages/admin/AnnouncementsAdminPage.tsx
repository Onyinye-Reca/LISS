import { FormEvent, useEffect, useState } from "react";
import { AnnouncementView, AnnouncementCreateInput } from "@liss11/shared";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { formatDate, toDateInput } from "../../lib/format";

type FormState = {
  title: string;
  body: string;
  publishedAt: string;
  coverUrl: string | null;
};

const blank: FormState = { title: "", body: "", publishedAt: "", coverUrl: null };

function toForm(a: AnnouncementView): FormState {
  return {
    title: a.title,
    body: a.body,
    publishedAt: toDateInput(a.publishedAt),
    coverUrl: a.coverUrl,
  };
}

function toPayload(f: FormState): AnnouncementCreateInput {
  return {
    title: f.title,
    body: f.body,
    coverUrl: f.coverUrl,
    publishedAt: f.publishedAt || null,
  };
}

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<AnnouncementView[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getAnnouncements().then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const payload = toPayload(editing.form);
      if (editing.id) await updateAnnouncement(editing.id, payload);
      else await createAnnouncement(payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AnnouncementView) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    try {
      await deleteAnnouncement(a.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const set = (patch: Partial<FormState>) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-maroon">Announcements</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ id: null, form: blank })} className="w-auto px-4">
            New announcement
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
          <h2 className="font-semibold text-maroon">{editing.id ? "Edit" : "New"} announcement</h2>
          <ImageUpload
            label="Cover image (optional)"
            shape="rect"
            value={editing.form.coverUrl}
            folder="announcements"
            onChange={(url) => set({ coverUrl: url })}
          />
          <TextField label="Title" required value={editing.form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextArea label="Body" required rows={8} value={editing.form.body} onChange={(e) => set({ body: e.target.value })} />
          <TextField
            label="Publish date (optional — defaults to today)"
            type="date"
            value={editing.form.publishedAt}
            onChange={(e) => set({ publishedAt: e.target.value })}
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-medium text-ink/60 underline">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No announcements yet. Write the first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Published</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">{a.title}</td>
                  <td className="px-4 py-2 text-ink/60">{formatDate(a.publishedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing({ id: a.id, form: toForm(a) })} className="mr-3 font-medium text-maroon hover:underline">Edit</button>
                    <button onClick={() => void remove(a)} className="font-medium text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
