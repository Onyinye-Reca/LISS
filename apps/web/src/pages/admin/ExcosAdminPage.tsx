import { FormEvent, useEffect, useState } from "react";
import {
  OfficerView,
  OfficerCreateInput,
  OFFICER_TIERS,
  OFFICER_TIER_LABELS,
} from "@liss11/shared";
import {
  getOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
} from "../../lib/content-api";
import { Button, TextField, SelectField, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";

type FormState = {
  fullName: string;
  title: string;
  tier: OfficerView["tier"];
  email: string;
  whatsapp: string;
  termStart: string;
  termEnd: string;
  isPast: boolean;
  sortOrder: string;
  photoUrl: string | null;
};

const blank: FormState = {
  fullName: "",
  title: "",
  tier: "OTHER",
  email: "",
  whatsapp: "",
  termStart: "",
  termEnd: "",
  isPast: false,
  sortOrder: "0",
  photoUrl: null,
};

function toForm(o: OfficerView): FormState {
  return {
    fullName: o.fullName,
    title: o.title,
    tier: o.tier,
    email: o.email,
    whatsapp: o.whatsapp ?? "",
    termStart: o.termStart?.toString() ?? "",
    termEnd: o.termEnd?.toString() ?? "",
    isPast: o.isPast,
    sortOrder: o.sortOrder.toString(),
    photoUrl: o.photoUrl,
  };
}

function toPayload(f: FormState): OfficerCreateInput {
  return {
    fullName: f.fullName,
    title: f.title,
    tier: f.tier,
    email: f.email,
    whatsapp: f.whatsapp || null,
    termStart: f.termStart ? Number(f.termStart) : null,
    termEnd: f.termEnd ? Number(f.termEnd) : null,
    isPast: f.isPast,
    sortOrder: f.sortOrder ? Number(f.sortOrder) : 0,
    photoUrl: f.photoUrl,
  };
}

export default function ExcosAdminPage() {
  const [officers, setOfficers] = useState<OfficerView[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getOfficers().then(setOfficers).catch((e) => setError(e.message));
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
      if (editing.id) await updateOfficer(editing.id, payload);
      else await createOfficer(payload);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o: OfficerView) => {
    if (!confirm(`Remove ${o.fullName}?`)) return;
    try {
      await deleteOfficer(o.id);
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
        <h1 className="text-2xl font-bold text-maroon">EXCOS / Leadership</h1>
        {!editing && (
          <Button type="button" onClick={() => setEditing({ id: null, form: blank })} className="w-auto px-4">
            Add officer
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
          <h2 className="font-semibold text-maroon">{editing.id ? "Edit" : "New"} officer</h2>
          <ImageUpload
            value={editing.form.photoUrl}
            folder="officers"
            onChange={(url) => set({ photoUrl: url })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" required value={editing.form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
            <TextField label="Title" required value={editing.form.title} onChange={(e) => set({ title: e.target.value })} />
            <SelectField label="Tier" value={editing.form.tier} onChange={(e) => set({ tier: e.target.value as FormState["tier"] })}>
              {OFFICER_TIERS.map((t) => (
                <option key={t} value={t}>{OFFICER_TIER_LABELS[t]}</option>
              ))}
            </SelectField>
            <TextField label="Email" type="email" required value={editing.form.email} onChange={(e) => set({ email: e.target.value })} />
            <TextField label="WhatsApp (optional)" value={editing.form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
            <TextField label="Sort order" type="number" value={editing.form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} />
            <TextField label="Term start (year)" type="number" value={editing.form.termStart} onChange={(e) => set({ termStart: e.target.value })} />
            <TextField label="Term end (year)" type="number" value={editing.form.termEnd} onChange={(e) => set({ termEnd: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={editing.form.isPast} onChange={(e) => set({ isPast: e.target.checked })} />
            Past executive (show in the archive section)
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-medium text-ink/60 underline">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {officers.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No officers yet. Add the first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Tier</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">
                    {o.fullName} {o.isPast && <span className="text-xs text-ink/40">(past)</span>}
                  </td>
                  <td className="px-4 py-2 text-ink/70">{o.title}</td>
                  <td className="px-4 py-2 text-ink/60">{OFFICER_TIER_LABELS[o.tier]}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing({ id: o.id, form: toForm(o) })} className="mr-3 font-medium text-maroon hover:underline">Edit</button>
                    <button onClick={() => void remove(o)} className="font-medium text-danger hover:underline">Delete</button>
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
