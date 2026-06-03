import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, EmptyState } from "../components/ui";
import Accordion, { AccordionItem } from "../components/Accordion";

// Hero media. Cloudinary-hosted placeholders (PRD picked Cloudinary). Swap
// these public IDs for the real LISS11' hero once EXCOS supplies the video
// (PRD 4.1 / open question #6). The maroon gradient behind the video means the
// hero still looks intentional if the video fails to load (image fallback).
const HERO_VIDEO = "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4";
const HERO_POSTER = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

// PRD 4.1 / US-002: the four "Why must I join?" benefits.
const whyJoin: AccordionItem[] = [
  {
    title: "Alumni Events",
    body: "Hangouts, weddings, AGMs and game nights. Stay in the loop and never miss a reunion with the set.",
  },
  {
    title: "Jobs & Internship",
    body: "Tap into a network of classmates hiring and referring. Opportunities shared within the set, first.",
  },
  {
    title: "Mentorship",
    body: "Give and get guidance across industries from the people who already know you.",
  },
  {
    title: "Giving Back",
    body: "Pool our strength for scholarships and community projects that carry the LISS11' name forward.",
  },
];

export default function HomePage() {
  const [params] = useSearchParams();
  const verified = params.get("verified");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggleVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon text-white">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-maroon via-maroon/90 to-maroon-dark" />

        {/* Play/Pause toggle (US-001: keyboard accessible) */}
        <button
          type="button"
          onClick={toggleVideo}
          aria-label={playing ? "Pause background video" : "Play background video"}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
        </button>

        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-32">
          {verified === "1" && (
            <div className="mb-6 max-w-md">
              <Alert kind="success">Email verified. You can now log in.</Alert>
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
            Welcome to the home of the LISS11' alumni community where old
            friendships endure and we keep building something bigger together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-light"
            >
              Let's Get Started
            </Link>
            <Link
              to="/gallery"
              className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              See how far we've come
            </Link>
          </div>
        </div>
      </section>

      {/* Why must I join? Accordion (US-002) */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-maroon">Why must I join?</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/70">
          Four good reasons to be part of the set.
        </p>
        <div className="mt-8">
          <Accordion items={whyJoin} />
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="inline-block rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
          >
            Join Now
          </Link>
        </div>
      </section>

      {/* If love were in pictures. Gallery strip (data arrives in Sprint 3) */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-maroon">If love were in pictures</h2>
            <Link to="/gallery" className="text-sm font-semibold text-maroon hover:underline">
              View gallery →
            </Link>
          </div>
          <EmptyState
            icon="🖼"
            heading="Photos coming soon"
            description="Moments from hangouts, weddings, and game nights will appear here once the gallery is live."
            ctaLabel="Visit the gallery"
            ctaTo="/gallery"
          />
        </div>
      </section>

      {/* Better Update. Announcements preview (Sprint 3) */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-maroon">Better Update</h2>
          <Link to="/announcements" className="text-sm font-semibold text-maroon hover:underline">
            View all →
          </Link>
        </div>
        <EmptyState
          icon="📣"
          heading="No announcements yet"
          description="The latest news and updates from the EXCOS will show up here."
          ctaLabel="See announcements"
          ctaTo="/announcements"
        />
      </section>

      {/* Upcoming Events preview (Sprint 3) */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-maroon">Upcoming Events</h2>
            <Link to="/events" className="text-sm font-semibold text-maroon hover:underline">
              View all →
            </Link>
          </div>
          <EmptyState
            icon="📅"
            heading="No upcoming events"
            description="Hangouts, AGMs and game nights will be listed here as they're scheduled."
            ctaLabel="See events"
            ctaTo="/events"
          />
        </div>
      </section>
    </>
  );
}
