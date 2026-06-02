import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

type Status = "checking" | "up" | "down";

export default function App() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    fetch(`${API_BASE}/health`, { credentials: "include" })
      .then((r) => (r.ok ? setStatus("up") : setStatus("down")))
      .catch(() => setStatus("down"));
  }, []);

  const dot =
    status === "up" ? "bg-green-500" : status === "down" ? "bg-red-500" : "bg-gold";

  return (
    <main className="min-h-screen bg-cream text-ink font-sans flex items-center justify-center p-grid">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-maroon">LISS11' Alumni</h1>
        <p className="text-ink/70">
          Sprint 0 scaffold — Vite + React + Tailwind talking to the Express + Inversify API.
        </p>
        <div className="inline-flex items-center gap-3 rounded-lg border border-gold/40 bg-white px-4 py-3">
          <span className={`h-3 w-3 rounded-full ${dot}`} />
          <span className="text-sm">
            API status:{" "}
            <strong className="text-maroon">
              {status === "checking" ? "checking…" : status}
            </strong>
          </span>
        </div>
        <p className="text-xs text-ink/50">
          Green dot = both apps are running and talking across origins.
        </p>
      </div>
    </main>
  );
}
