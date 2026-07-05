import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ElectionDetail, ElectionResults } from "@liss11/shared";
import { getElection, getElectionResults, castVote } from "../lib/election-api";
import { Button, Alert } from "../components/ui";

export default function ElectionBallotPage() {
  const { id = "" } = useParams();
  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const e = await getElection(id);
      setElection(e);
      // Members can only see results once voting has closed.
      if (!e.isOpen) {
        try {
          setResults(await getElectionResults(id));
        } catch {
          /* results may be gated; ignore */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load election");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!election) return;
    setError(null);
    if (election.positions.some((p) => !selections[p.id])) {
      setError("Please choose a candidate for every position.");
      return;
    }
    setBusy(true);
    try {
      await castVote(id, {
        selections: election.positions.map((p) => ({
          positionId: p.id,
          candidateId: selections[p.id],
        })),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your vote");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-ink/50">Loading…</main>;
  }
  if (!election) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Alert>{error ?? "Election not found"}</Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link to="/elections" className="text-sm text-maroon hover:underline">
        ← All elections
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-maroon">{election.title}</h1>

      {results ? (
        <ResultsView results={results} />
      ) : election.hasVoted ? (
        <div className="mt-8">
          <Alert kind="success">
            Thank you — your vote has been recorded. Results will be published
            when voting closes.
          </Alert>
        </div>
      ) : !election.isOpen ? (
        <div className="mt-8">
          <Alert>Voting for this election is closed.</Alert>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-6">
          {error && <Alert>{error}</Alert>}
          {election.positions.length === 0 && (
            <p className="text-ink/60">This election has no positions yet.</p>
          )}
          {election.positions.map((p) => (
            <fieldset key={p.id} className="rounded-xl border border-gold/30 bg-white p-5">
              <legend className="px-1 text-sm font-semibold text-maroon">{p.title}</legend>
              <div className="mt-2 space-y-2">
                {p.candidates.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/10 p-3 transition hover:border-gold/50"
                  >
                    <input
                      type="radio"
                      name={p.id}
                      value={c.id}
                      checked={selections[p.id] === c.id}
                      onChange={() => setSelections((s) => ({ ...s, [p.id]: c.id }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-nearblack">{c.name}</div>
                      {c.manifesto && <div className="text-sm text-ink/60">{c.manifesto}</div>}
                    </div>
                  </label>
                ))}
                {p.candidates.length === 0 && (
                  <p className="text-sm text-ink/50">No candidates yet.</p>
                )}
              </div>
            </fieldset>
          ))}
          {election.positions.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-ink/50">
                Your vote is final and cannot be changed once submitted.
              </p>
              <Button type="submit" disabled={busy}>
                {busy ? "Submitting…" : "Submit my vote"}
              </Button>
            </div>
          )}
        </form>
      )}
    </main>
  );
}

function ResultsView({ results }: { results: ElectionResults }) {
  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-maroon">Results</h2>
      {results.positions.map((pos) => (
        <div key={pos.positionId} className="rounded-xl border border-gold/20 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-nearblack">{pos.title}</h3>
            <span className="text-xs text-ink/50">
              {pos.totalVotes} vote{pos.totalVotes === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {pos.candidates.map((c, i) => {
              const pct = pos.totalVotes ? Math.round((c.votes / pos.totalVotes) * 100) : 0;
              const leading = i === 0 && c.votes > 0;
              return (
                <li key={c.candidateId}>
                  <div className="flex justify-between text-sm">
                    <span className={leading ? "font-semibold text-maroon" : "text-ink"}>
                      {c.name}
                      {leading ? " · leading" : ""}
                    </span>
                    <span className="text-ink/60">
                      {c.votes} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ink/10">
                    <div className="h-2 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
