import { FormEvent, useEffect, useState } from "react";
import { ElectionSummary, ElectionDetail } from "@liss11/shared";
import {
  getElections,
  getElection,
  createElection,
  updateElection,
  deleteElection,
  addPosition,
  deletePosition,
  addCandidate,
  deleteCandidate,
  uploadCandidatePhoto,
  electionAuditCsvUrl,
} from "../../lib/election-api";
import { Button, TextField, Alert } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";

export default function ElectionsAdminPage() {
  const [elections, setElections] = useState<ElectionSummary[]>([]);
  const [selected, setSelected] = useState<ElectionDetail | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    getElections()
      .then(setElections)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  useEffect(() => {
    void refresh();
  }, []);

  const reloadSelected = async () => {
    if (selected) setSelected(await getElection(selected.id));
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const el = await createElection({ title: newTitle });
      setNewTitle("");
      await refresh();
      setSelected(el);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create election");
    } finally {
      setBusy(false);
    }
  };

  const toggleOpen = async () => {
    if (!selected) return;
    setError(null);
    try {
      await updateElection(selected.id, { isOpen: !selected.isOpen });
      await reloadSelected();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update election");
    }
  };

  const removeElection = async (id: string) => {
    if (!confirm("Delete this election? This cannot be undone.")) return;
    setError(null);
    try {
      await deleteElection(id);
      if (selected?.id === id) setSelected(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete election");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon">Elections</h1>
      {error && <Alert>{error}</Alert>}

      <form onSubmit={create} className="flex gap-3 rounded-xl border border-gold/30 bg-white p-4">
        <div className="flex-1">
          <TextField
            label="New election title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-auto px-5">
            {busy ? "…" : "Create"}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {elections.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No elections yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Positions</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {elections.map((e) => (
                <tr key={e.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">{e.title}</td>
                  <td className="px-4 py-2 text-ink/70">{e.positionCount}</td>
                  <td className="px-4 py-2">
                    {e.isOpen ? (
                      <span className="font-medium text-gold">Open</span>
                    ) : (
                      <span className="text-ink/50">Closed</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => void getElection(e.id).then(setSelected)}
                      className="mr-3 font-medium text-maroon hover:underline"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => void removeElection(e.id)}
                      className="font-medium text-danger hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ManagePanel
          election={selected}
          onChange={reloadSelected}
          onToggleOpen={toggleOpen}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ManagePanel({
  election,
  onChange,
  onToggleOpen,
  onClose,
}: {
  election: ElectionDetail;
  onChange: () => Promise<void>;
  onToggleOpen: () => Promise<void>;
  onClose: () => void;
}) {
  const [posTitle, setPosTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const addPos = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await addPosition(election.id, { title: posTitle });
      setPosTitle("");
      await onChange();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not add position");
    }
  };

  const removePos = async (id: string) => {
    setErr(null);
    try {
      await deletePosition(id);
      await onChange();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not remove position");
    }
  };

  const togglePublish = async () => {
    setErr(null);
    try {
      await updateElection(election.id, { resultsPublished: !election.resultsPublished });
      await onChange();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not update results visibility");
    }
  };

  return (
    <div className="rounded-xl border border-maroon/30 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-maroon">Manage: {election.title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void onToggleOpen()} className="w-auto px-4">
            {election.isOpen ? "Close voting" : "Open voting"}
          </Button>
          {!election.isOpen && (
            <Button type="button" onClick={() => void togglePublish()} className="w-auto px-4">
              {election.resultsPublished ? "Unpublish results" : "Publish results"}
            </Button>
          )}
          <a
            href={electionAuditCsvUrl(election.id)}
            className="text-sm font-medium text-maroon hover:underline"
          >
            Audit CSV
          </a>
          <button onClick={onClose} className="text-sm text-ink/60 underline">
            Done
          </button>
        </div>
      </div>
      {err && (
        <div className="mt-3">
          <Alert>{err}</Alert>
        </div>
      )}
      {election.isOpen && (
        <p className="mt-3 text-xs text-gold">
          Voting is open — avoid changing positions or candidates now.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {election.positions.map((p) => (
          <div key={p.id} className="rounded-lg border border-gold/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-nearblack">{p.title}</h3>
              <button
                onClick={() => void removePos(p.id)}
                className="text-xs text-danger hover:underline"
              >
                Remove position
              </button>
            </div>
            <CandidateEditor position={p} onChange={onChange} />
          </div>
        ))}
        {election.positions.length === 0 && (
          <p className="text-sm text-ink/50">No positions yet. Add the first below.</p>
        )}
      </div>

      <form onSubmit={addPos} className="mt-4 flex gap-3">
        <div className="flex-1">
          <TextField
            label="Add position"
            value={posTitle}
            onChange={(e) => setPosTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-auto px-4">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}

function CandidateEditor({
  position,
  onChange,
}: {
  position: ElectionDetail["positions"][number];
  onChange: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await addCandidate(position.id, { name, manifesto: manifesto || null, photoUrl });
      setName("");
      setManifesto("");
      setPhotoUrl(null);
      await onChange();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not add candidate");
    }
  };

  const remove = async (id: string) => {
    setErr(null);
    try {
      await deleteCandidate(id);
      await onChange();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not remove candidate");
    }
  };

  return (
    <div className="mt-3">
      {err && (
        <div className="mb-2">
          <Alert>{err}</Alert>
        </div>
      )}
      <ul className="space-y-1">
        {position.candidates.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded border border-ink/10 px-3 py-1.5 text-sm"
          >
            <span className="flex items-center gap-2 text-nearblack">
              {c.photoUrl && (
                <img src={c.photoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              {c.name}
            </span>
            <button
              onClick={() => void remove(c.id)}
              className="text-xs text-danger hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
        {position.candidates.length === 0 && (
          <li className="text-xs text-ink/50">No candidates yet.</li>
        )}
      </ul>
      <div className="mt-3">
        <ImageUpload
          value={photoUrl}
          folder="candidates"
          uploader={uploadCandidatePhoto}
          onChange={setPhotoUrl}
          label="Candidate photo (optional)"
          shape="circle"
        />
      </div>
      <form onSubmit={add} className="mt-2 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <TextField label="Candidate" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField
          label="Manifesto (optional)"
          value={manifesto}
          onChange={(e) => setManifesto(e.target.value)}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-auto px-3">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
