import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../components/ui";

// Hero media — Cloudinary-hosted placeholders (PRD picked Cloudinary). Swap
// these public IDs for the real LISS11' hero once assets are uploaded. The
// maroon gradient behind the video means the hero still looks intentional if
// the video fails to load (PRD: video with image fallback).
const HERO_VIDEO = "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4";
const HERO_POSTER = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

const highlights = [
  {
    title: "Stay connected",
    body: "Reconnect with classmates and grow the LISS11' network across regions.",
  },
  {
    title: "Give back",
    body: "Support scholarships and community projects through dues and donations.",
  },
  {
    title: "Have a say",
    body: "Vote in association elections and help shape the alumni body's direction.",
  },
];

export default function HomePage() {
  const [params] = useSearchParams();
  const verified = params.get("verified");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
          aria-hidden="true"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-maroon via-maroon/90 to-maroon-dark" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-32">
          {verified === "1" && (
            <div className="mb-6 max-w-md">
              <Alert kind="success">Email verified — you can now log in.</Alert>
            </div>
          )}
          {verified === "0" && (
            <div className="mb-6 max-w-md">
              <Alert kind="error">
                That verification link is invalid or has expired.
              </Alert>
            </div>
          )}

          <p className="text-sm font-semibold uppercase tracking-wider text-gold-light">
            LISS11' Alumni Association
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            One class. One bond. A lifetime of impact.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Welcome to the home of the LISS11' alumni community — where old
            friendships endure and we keep building something bigger together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-light"
            >
              Join the network
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-xl border border-gold/30 bg-white p-6"
            >
              <h2 className="text-lg font-semibold text-maroon">{h.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About / mission */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-maroon">Our mission</h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            The LISS11' Alumni Association exists to keep our set connected,
            celebrate one another's milestones, and channel our collective
            strength into projects that uplift our school and communities. From
            mentorship to giving, every member has a part to play.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
          >
            Become a member
          </Link>
        </div>
      </section>
    </>
  );
}
