import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ElectionSummary } from "@liss11/shared";
import { getElections } from "../lib/election-api";
import { EmptyState } from "../components/ui";

export default function ElectionsPage() {
  const [elections, setElections] = useState<ElectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElections()
      .then(setElections)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">LISS Decides</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Alumni elections. Cast your vote while an election is open; results are
          published once voting closes.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : elections.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="🗳️"
            heading="No elections yet"
            description="Elections appear here when the Electoral Committee opens one."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {elections.map((e) => (
            <li key={e.id}>
              <Link
                to={`/elections/${e.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-gold/20 bg-white p-4 transition hover:border-gold/50"
              >
                <div>
                  <p className="font-semibold text-nearblack">{e.title}</p>
                  <p className="text-xs text-ink/60">
                    {e.positionCount} position{e.positionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {e.hasVoted && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                      Voted
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      e.isOpen ? "bg-gold/20 text-maroon" : "bg-ink/10 text-ink/60"
                    }`}
                  >
                    {e.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
