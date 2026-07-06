import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getSiteSettings } from "../lib/content-api";

const sections = [
  {
    to: "/about/excos",
    title: "Leadership (EXCOS)",
    body: "Meet the executive committee serving the association.",
  },
  {
    to: "/about/bot",
    title: "Board of Trustees",
    body: "The trustees who steward the association's long-term interests.",
  },
  {
    to: "/about/regions",
    title: "Regional Presence",
    body: "Where our members are based, and who to reach in each region.",
  },
];

export default function AboutPage() {
  // The three sub-pages are members-only; flag that to logged-out visitors.
  const { member } = useAuth();
  const [constitutionUrl, setConstitutionUrl] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then((s) => setConstitutionUrl(s.constitutionUrl))
      .catch(() => {
        /* the constitution link is optional */
      });
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">About Us</h1>
        <p className="mx-auto mt-3 max-w-2xl text-ink/70">
          The LISS Class of 2011 Alumni Association is the digital home of our set -
          a place to reconnect, stay informed, celebrate one another, and give back.
        </p>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-xl border border-gold/30 bg-card p-6 transition hover:border-gold hover:shadow-sm"
          >
            <h2 className="text-lg font-semibold text-maroon">{s.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{s.body}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-maroon">
              {member ? "View →" : "🔒 Members only - log in to view"}
            </span>
          </Link>
        ))}
      </div>

      {constitutionUrl && (
        <div className="mt-12 rounded-xl border border-gold/30 bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-maroon">Our Constitution</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink/70">
            The document that governs the association — its structure, roles, and
            how we make decisions.
          </p>
          <a
            href={constitutionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-maroon px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon/90"
          >
            Download the Constitution (PDF)
          </a>
        </div>
      )}
    </main>
  );
}
