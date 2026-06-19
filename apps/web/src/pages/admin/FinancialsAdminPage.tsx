import { FormEvent, useEffect, useRef, useState } from "react";
import { FinancialStatementView } from "@liss11/shared";
import {
  getFinancialStatements,
  uploadFinancialStatement,
  deleteFinancialStatement,
  financialDownloadUrl,
} from "../../lib/content-api";
import { Button, TextField, Alert } from "../../components/ui";
import { formatDate } from "../../lib/format";

export default function FinancialsAdminPage() {
  const [items, setItems] = useState<FinancialStatementView[]>([]);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => getFinancialStatements().then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF file to upload.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uploadFinancialStatement({ title, period, file });
      setTitle("");
      setPeriod("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: FinancialStatementView) => {
    if (!confirm(`Delete "${s.title}"?`)) return;
    try {
      await deleteFinancialStatement(s.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon">Financial Statements</h1>
      <p className="text-sm text-ink/60">
        Upload PDF statements. Files are stored privately - only logged-in members
        can open them, via a session-gated signed link. Click View to preview.
      </p>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gold/30 bg-white p-6">
        <h2 className="font-semibold text-maroon">Upload a statement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2024 Annual Financial Statement" />
          <TextField label="Period (optional)" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2024" />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-ink">PDF file</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-maroon file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-maroon-dark"
          />
        </div>
        <Button type="submit" disabled={busy} className="w-auto px-5">{busy ? "Uploading…" : "Upload"}</Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No statements uploaded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Uploaded</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-medium text-nearblack">{s.title}</td>
                  <td className="px-4 py-2 text-ink/60">{s.period ?? "-"}</td>
                  <td className="px-4 py-2 text-ink/60">{formatDate(s.uploadedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={financialDownloadUrl(s.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-3 font-medium text-maroon hover:underline"
                    >
                      View
                    </a>
                    <button onClick={() => void remove(s)} className="font-medium text-danger hover:underline">Delete</button>
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
