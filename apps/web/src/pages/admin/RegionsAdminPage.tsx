import { FormEvent, useEffect, useState } from "react";
import { RegionView, RegionUpdateInput } from "@liss11/shared";
import { getRegions, updateRegion } from "../../lib/content-api";
import { Button, TextField, TextArea, Alert } from "../../components/ui";

type FormState = {
  description: string;
  repName: string;
  repEmail: string;
  repWhatsapp: string;
  memberCount: string;
};

function toForm(r: RegionView): FormState {
  return {
    description: r.description ?? "",
    repName: r.repName ?? "",
    repEmail: r.repEmail ?? "",
    repWhatsapp: r.repWhatsapp ?? "",
    memberCount: r.memberCount.toString(),
  };
}

function toPayload(f: FormState): RegionUpdateInput {
  return {
    description: f.description || null,
    repName: f.repName || null,
    repEmail: f.repEmail || null,
    repWhatsapp: f.repWhatsapp || null,
    memberCount: f.memberCount ? Number(f.memberCount) : 0,
  };
}

function RegionForm({ region, onSaved }: { region: RegionView; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(toForm(region));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateRegion(region.key, toPayload(form));
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-xl border border-gold/30 bg-white p-6">
      <h2 className="font-semibold text-maroon">{region.name}</h2>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      {saved && <div className="mt-3"><Alert kind="success">Saved.</Alert></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextField label="Rep name" value={form.repName} onChange={(e) => set({ repName: e.target.value })} />
        <TextField label="Member count" type="number" value={form.memberCount} onChange={(e) => set({ memberCount: e.target.value })} />
        <TextField label="Rep email" type="email" value={form.repEmail} onChange={(e) => set({ repEmail: e.target.value })} />
        <TextField label="Rep WhatsApp" value={form.repWhatsapp} onChange={(e) => set({ repWhatsapp: e.target.value })} />
      </div>
      <div className="mt-4">
        <TextArea label="Description" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div className="mt-4">
        <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

export default function RegionsAdminPage() {
  const [regions, setRegions] = useState<RegionView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => getRegions().then(setRegions).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon">Regional Presence</h1>
      <p className="text-sm text-ink/60">
        The five regions are fixed. Edit each region's rep contact, description, and
        member count.
      </p>
      {error && <Alert>{error}</Alert>}
      <div className="space-y-5">
        {regions.map((r) => (
          <RegionForm key={r.key} region={r} onSaved={refresh} />
        ))}
      </div>
    </div>
  );
}
