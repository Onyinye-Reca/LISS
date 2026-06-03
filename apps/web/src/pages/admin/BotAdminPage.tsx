import { FormEvent, useEffect, useState } from "react";
import { BotMemberView, BotMemberCreateInput } from "@liss11/shared";
import {
  getBotMembers,
  createBotMember,
  updateBotMember,
  deleteBotMember,
} from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";

type FormState = {
  fullName: string;
  designation: string;
  bio: string;
  email: string;
  sortOrder: string;
  photoUrl: string | null;
};

const blank: FormState = {
  fullName: "",
  designation: "",
  bio: "",
  email: "",
  sortOrder: "0",
  photoUrl: null,
};

function toForm(b: BotMemberView): FormState {
  return {
    fullName: b.fullName,
    designation: b.designation,
    bio: b.bio ?? "",
    email: b.email ?? "",
    sortOrder: b.sortOrder.toString(),
    photoUrl: b.photoUrl,
  };
}

function toPayload(f: FormState): BotMemberCreateInput {
  return {
    fullName: f.fullName,
    designation: f.designation,
    bio: f.bio || null,
    email: f.email || null,
    sortOrder: f.sortOrder ? Number(f.sortOrder) : 0,
    photoUrl: f.photoUrl,
  };
}

export default function BotAdminPage() {
  const [members, setMembers] = useState<BotMemberView[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getBotMembers().then(setMembers).catch((e) => setError(e.message));
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
      if (editing.id) await updateBotMember(editing.id, payload);
      else await createBotMember(payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b: BotMemberView) => {
    if (!confirm(`Remove ${b.fullName}?`)) return;
    try {
      await deleteBotMember(b.id);
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
        <h1 className="text-2xl font-bold text-maroon">Board of Trustees</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ id: null, form: blank })} className="w-auto px-4">
            Add member
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
          <h2 className="font-semibold text-maroon">{editing.id ? "Edit" : "New"} trustee</h2>
          <ImageUpload value={editing.form.photoUrl} folder="bot" onChange={(url) => set({ photoUrl: url })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" required value={editing.form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
            <TextField label="Designation" required value={editing.form.designation} onChange={(e) => set({ designation: e.target.value })} />
            <TextField label="Email (optional)" type="email" value={editing.form.email} onChange={(e) => set({ email: e.target.value })} />
            <TextField label="Sort order" type="number" value={editing.form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} />
          </div>
          <TextArea label="Bio (optional)" rows={3} value={editing.form.bio} onChange={(e) => set({ bio: e.target.value })} />
          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-medium text-ink/60 underline">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {members.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No trustees yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Designation</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((b) => (
                <tr key={b.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">{b.fullName}</td>
                  <td className="px-4 py-2 text-ink/70">{b.designation}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing({ id: b.id, form: toForm(b) })} className="mr-3 font-medium text-maroon hover:underline">Edit</button>
                    <button onClick={() => void remove(b)} className="font-medium text-danger hover:underline">Delete</button>
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
