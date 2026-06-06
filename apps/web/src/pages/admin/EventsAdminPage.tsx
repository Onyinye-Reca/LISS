import { FormEvent, useEffect, useState } from "react";
import { EventView, EventCreateInput } from "@liss11/shared";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { formatDateTime, toDateTimeInput } from "../../lib/format";

type FormState = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  coverUrl: string | null;
  isPublic: boolean;
};

const blank: FormState = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  coverUrl: null,
  isPublic: true,
};

function toForm(e: EventView): FormState {
  return {
    title: e.title,
    description: e.description ?? "",
    location: e.location ?? "",
    startsAt: toDateTimeInput(e.startsAt),
    endsAt: toDateTimeInput(e.endsAt),
    coverUrl: e.coverUrl,
    isPublic: e.isPublic,
  };
}

function toPayload(f: FormState): EventCreateInput {
  return {
    title: f.title,
    description: f.description || null,
    location: f.location || null,
    startsAt: f.startsAt,
    endsAt: f.endsAt || null,
    coverUrl: f.coverUrl,
    isPublic: f.isPublic,
  };
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<EventView[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getEvents().then(setEvents).catch((e) => setError(e.message));
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
      if (editing.id) await updateEvent(editing.id, payload);
      else await createEvent(payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ev: EventView) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    try {
      await deleteEvent(ev.id);
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
        <h1 className="text-2xl font-bold text-maroon">Events</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ id: null, form: blank })} className="w-auto px-4">
            New event
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
          <h2 className="font-semibold text-maroon">{editing.id ? "Edit" : "New"} event</h2>
          <ImageUpload
            label="Cover image (optional)"
            shape="rect"
            value={editing.form.coverUrl}
            folder="events"
            onChange={(url) => set({ coverUrl: url })}
          />
          <TextField label="Title" required value={editing.form.title} onChange={(e) => set({ title: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Starts" type="datetime-local" required value={editing.form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} />
            <TextField label="Ends (optional)" type="datetime-local" value={editing.form.endsAt} onChange={(e) => set({ endsAt: e.target.value })} />
          </div>
          <TextField label="Location (optional)" value={editing.form.location} onChange={(e) => set({ location: e.target.value })} />
          <TextArea label="Description (optional)" rows={4} value={editing.form.description} onChange={(e) => set({ description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={editing.form.isPublic} onChange={(e) => set({ isPublic: e.target.checked })} />
            Public - visible to non-members (uncheck for members-only events like AGMs)
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-medium text-ink/60 underline">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {events.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No events yet. Create the first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Reserved</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">
                    {ev.title}{" "}
                    {!ev.isPublic && (
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-normal text-ink/60">
                        Members only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink/60">{formatDateTime(ev.startsAt)}</td>
                  <td className="px-4 py-2 text-ink/70">{ev.rsvpCount}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing({ id: ev.id, form: toForm(ev) })} className="mr-3 font-medium text-maroon hover:underline">Edit</button>
                    <button onClick={() => void remove(ev)} className="font-medium text-danger hover:underline">Delete</button>
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
