import { useState } from "react";
import { uploadImage } from "../lib/content-api";

/** File picker that uploads immediately and reports back the stored URL. */
export default function ImageUpload({
  value,
  folder,
  onChange,
  label = "Photo",
  shape = "circle",
}: {
  value: string | null;
  folder: string;
  onChange: (url: string | null) => void;
  label?: string;
  shape?: "circle" | "rect";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewClass =
    shape === "circle"
      ? "h-16 w-16 rounded-full"
      : "h-16 w-28 rounded-lg";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={value} alt="Preview" className={`${previewClass} object-cover`} />
        ) : (
          <div className={`flex ${previewClass} items-center justify-center bg-ink/10 text-xs text-ink/50`}>
            None
          </div>
        )}
        <div className="space-y-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            disabled={busy}
            className="block text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-maroon file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-maroon-dark"
          />
          {busy && <p className="text-xs text-ink/50">Uploading…</p>}
          {error && <p className="text-xs text-danger">{error}</p>}
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-ink/60 underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
