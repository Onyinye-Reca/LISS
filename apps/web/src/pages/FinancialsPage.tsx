import { useEffect, useState } from "react";
import { FinancialStatementView } from "@liss11/shared";
import { getFinancialStatements, financialDownloadUrl } from "../lib/content-api";
import { formatDate } from "../lib/format";
import { EmptyState } from "../components/ui";

export default function FinancialsPage() {
  const [items, setItems] = useState<FinancialStatementView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinancialStatements()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Financial Statements</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Our financial records, shared with the membership for transparency.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="📄"
            heading="No statements yet"
            description="Financial statements will appear here once they're published."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-gold/15 overflow-hidden rounded-xl border border-gold/20 bg-white">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-nearblack">{s.title}</p>
                <p className="text-xs text-ink/60">
                  {s.period && <span>{s.period} · </span>}
                  Uploaded {formatDate(s.uploadedAt)}
                </p>
              </div>
              {/* Session-gated endpoint. View previews inline; Download forces a file. */}
              <div className="flex shrink-0 gap-2">
                <a
                  href={financialDownloadUrl(s.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-maroon px-4 py-2 text-sm font-semibold text-maroon hover:bg-maroon/5"
                >
                  View
                </a>
                <a
                  href={financialDownloadUrl(s.id, true)}
                  className="rounded-lg bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-dark"
                >
                  Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
