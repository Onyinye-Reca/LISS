import { useEffect, useState } from "react";
import {
  OfficerView,
  OFFICER_TIERS,
  OFFICER_TIER_LABELS,
} from "@liss11/shared";
import { getOfficers } from "../lib/content-api";
import PersonCard from "../components/PersonCard";
import { EmptyState } from "../components/ui";

function term(o: OfficerView): string | undefined {
  if (o.termStart && o.termEnd) return `${o.termStart} – ${o.termEnd}`;
  if (o.termStart) return `Since ${o.termStart}`;
  return undefined;
}

export default function ExcosPage() {
  const [officers, setOfficers] = useState<OfficerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    getOfficers()
      .then(setOfficers)
      .finally(() => setLoading(false));
  }, []);

  const current = officers.filter((o) => !o.isPast);
  const past = officers.filter((o) => o.isPast);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Our Leadership</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Meet the executive committee serving the LISS11' Alumni Association. The
          Secretary and PRO are your first points of contact.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : current.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="👤"
            heading="No officers listed yet"
            description="The executive committee will appear here once they're added."
            ctaLabel="Contact us"
            ctaTo="/contact"
          />
        </div>
      ) : (
        <div className="mt-12 space-y-12">
          {OFFICER_TIERS.map((tier) => {
            const group = current.filter((o) => o.tier === tier);
            if (group.length === 0) return null;
            return (
              <section key={tier}>
                <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-gold">
                  {OFFICER_TIER_LABELS[tier]}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((o) => (
                    <PersonCard
                      key={o.id}
                      photoUrl={o.photoUrl}
                      name={o.fullName}
                      subtitle={o.title}
                      note={term(o)}
                      email={o.email}
                      whatsapp={o.whatsapp}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-16 text-center">
          <button
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
            className="text-sm font-semibold text-maroon hover:underline"
          >
            {showPast ? "Hide" : "Show"} past executives ({past.length})
          </button>
          {showPast && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((o) => (
                <PersonCard
                  key={o.id}
                  photoUrl={o.photoUrl}
                  name={o.fullName}
                  subtitle={o.title}
                  note={term(o)}
                  email={o.email}
                  whatsapp={o.whatsapp}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
