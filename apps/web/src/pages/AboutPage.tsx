import { Link } from "react-router-dom";

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
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">About Us</h1>
        <p className="mx-auto mt-3 max-w-2xl text-ink/70">
          The LISS Class of 2011 Alumni Association is the digital home of our set —
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
              View →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
