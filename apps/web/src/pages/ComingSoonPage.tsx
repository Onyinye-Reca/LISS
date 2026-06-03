import { Link, useLocation } from "react-router-dom";

/**
 * Placeholder for public pages not yet built (About, Gallery, Events, etc.).
 * Keeps nav links from dead-ending and follows the PRD 9.3 empty-state pattern.
 */
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const name =
    pathname.replace("/", "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()) ||
    "This page";

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="text-4xl text-gold" aria-hidden="true">
        🚧
      </div>
      <h1 className="mt-4 text-3xl font-bold text-maroon">{name} coming soon</h1>
      <p className="mt-3 text-ink/70">
        We're still building this page. Check back shortly. In the meantime, explore
        the rest of the site or get in touch.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
        >
          Back home
        </Link>
        <Link
          to="/contact"
          className="rounded-lg border border-maroon/30 px-5 py-3 text-sm font-semibold text-maroon hover:bg-card"
        >
          Get in touch
        </Link>
      </div>
    </main>
  );
}
