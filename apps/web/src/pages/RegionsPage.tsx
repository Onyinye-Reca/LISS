import { useEffect, useState } from "react";
import { RegionView } from "@liss11/shared";
import { getRegions } from "../lib/content-api";
import { waLink } from "../components/PersonCard";

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Where are we?</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Our members are spread across these regions. This is a "where are we" map —
          not branch offices. Reach your Regional Rep below.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {regions.map((r) => (
            <section
              key={r.key}
              className="rounded-xl border border-gold/30 bg-card p-6"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-maroon">{r.name}</h2>
                <span className="rounded-full bg-gold/15 px-3 py-0.5 text-xs font-semibold text-maroon">
                  {r.memberCount} {r.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
              {r.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {r.description}
                </p>
              )}

              <div className="mt-4 border-t border-gold/20 pt-4">
                {r.repName ? (
                  <>
                    <p className="text-sm">
                      <span className="text-ink/60">Regional Rep:</span>{" "}
                      <span className="font-semibold text-nearblack">{r.repName}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {r.repEmail && (
                        <a
                          href={`mailto:${r.repEmail}?subject=${encodeURIComponent(
                            `LISS11' ${r.name} enquiry`,
                          )}`}
                          className="font-medium text-maroon hover:underline"
                        >
                          Contact your rep
                        </a>
                      )}
                      {r.repWhatsapp && (
                        <a
                          href={waLink(r.repWhatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-maroon hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink/60">
                    Rep: TBD —{" "}
                    <a href="/contact" className="font-medium text-maroon hover:underline">
                      contact the Secretary
                    </a>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
