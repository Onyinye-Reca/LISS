import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlbumView,
  AnnouncementView,
  EventView,
  SiteSettingsView,
} from "@liss11/shared";
import { Alert, EmptyState } from "../components/ui";
import Accordion, { AccordionItem } from "../components/Accordion";
import {
  getAlbums,
  getAnnouncements,
  getEvents,
  getSiteSettings,
} from "../lib/content-api";
import { formatDate, formatDateTime } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

// PRD 4.1 / US-002: the four "Why must I join?" benefits.
const whyJoin: AccordionItem[] = [
  {
    title: "Alumni Events",
    body: "Hangouts, weddings, Annual General Meetings and game nights. Stay in the loop and never miss a reunion with the set.",
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
  const { member } = useAuth();
  const [params] = useSearchParams();
  const verified = params.get("verified");
  const [albums, setAlbums] = useState<AlbumView[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [events, setEvents] = useState<EventView[]>([]);
  const [hero, setHero] = useState<SiteSettingsView>({
    heroVideoUrl: null,
    heroPosterUrl: null,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  // Admin-managed hero media (optional). Falls back to the maroon gradient.
  useEffect(() => {
    getSiteSettings().then(setHero).catch(() => {});
  }, []);

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

  // Gallery and events are public (events use per-event visibility, so guests
  // get the public ones), so their strips load for everyone. Announcements are
  // members-only. Failures fall back to the empty state, so swallow errors.
  useEffect(() => {
    getAlbums().then((a) => setAlbums(a.slice(0, 4))).catch(() => {});
    getEvents()
      .then((all) => {
        const now = Date.now();
        setEvents(
          all
            .filter((e) => new Date(e.startsAt).getTime() >= now)
            .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
            .slice(0, 3),
        );
      })
      .catch(() => {});
    if (member) {
      getAnnouncements().then((a) => setAnnouncements(a.slice(0, 3))).catch(() => {});
    } else {
      setAnnouncements([]);
    }
  }, [member]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon text-white">
        {/* Admin-set background video (optional); maroon gradient over it. */}
        {hero.heroVideoUrl && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            autoPlay
            muted
            loop
            playsInline
            poster={hero.heroPosterUrl ?? undefined}
          >
            <source src={hero.heroVideoUrl} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-maroon via-maroon/90 to-maroon-dark" />

        {hero.heroVideoUrl && (
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={playing ? "Pause background video" : "Play background video"}
            className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          </button>
        )}

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
            {/* Members are already in - point them at members' content instead
                of a create-account CTA. */}
            {member ? (
              <Link
                to="/events"
                className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-light"
              >
                See upcoming events
              </Link>
            ) : (
              <Link
                to="/register"
                className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-light"
              >
                Let's Get Started
              </Link>
            )}
            <Link
              to="/gallery"
              className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              See how far we've come
            </Link>
          </div>
        </div>
      </section>

      {/* Member benefits. Shown to everyone; only the Join Now CTA (which goes
          to registration) is hidden once you're a logged-in member. */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-maroon">
          {member ? "Your member benefits" : "Why must I join?"}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink/70">
          {member
            ? "Make the most of being part of the set."
            : "Four good reasons to be part of the set."}
        </p>
        <div className="mt-8">
          <Accordion items={whyJoin} />
        </div>
        {!member && (
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="inline-block rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-dark"
            >
              Join Now
            </Link>
          </div>
        )}
      </section>

      {/* If love were in pictures. Gallery strip */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-maroon">If love were in pictures</h2>
            <Link to="/gallery" className="text-sm font-semibold text-maroon hover:underline">
              View gallery →
            </Link>
          </div>
          {albums.length === 0 ? (
            <EmptyState
              icon="🖼"
              heading="Photos coming soon"
              description="Moments from hangouts, weddings, and game nights will appear here once the gallery is live."
              ctaLabel="Visit the gallery"
              ctaTo="/gallery"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {albums.map((a) => (
                <Link
                  key={a.id}
                  to={`/gallery/${a.id}`}
                  className="group overflow-hidden rounded-xl border border-gold/30 bg-card"
                >
                  <div className="aspect-square w-full overflow-hidden bg-ink/5">
                    {a.coverUrl ? (
                      <img
                        src={a.coverUrl}
                        alt={a.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-ink/30">🖼</div>
                    )}
                  </div>
                  <p className="truncate px-3 py-2 text-sm font-medium text-maroon">{a.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Better Update. Announcements preview (members-only) */}
      {member && (
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-maroon">Better Update</h2>
          <Link to="/announcements" className="text-sm font-semibold text-maroon hover:underline">
            View all →
          </Link>
        </div>
        {announcements.length === 0 ? (
          <EmptyState
            icon="📣"
            heading="No announcements yet"
            description="The latest news and updates from the EXCOS will show up here."
            ctaLabel="See announcements"
            ctaTo="/announcements"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {announcements.map((a) => (
              <Link
                key={a.id}
                to={`/announcements/${a.id}`}
                className="block overflow-hidden rounded-xl border border-gold/30 bg-card transition hover:border-gold hover:shadow-sm"
              >
                {a.coverUrl && (
                  <img src={a.coverUrl} alt="" className="h-32 w-full object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                    {formatDate(a.publishedAt)}
                  </p>
                  <h3 className="mt-1 font-semibold text-maroon">{a.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      )}

      {/* Upcoming Events preview (public - per-event visibility) */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-maroon">Upcoming Events</h2>
            <Link to="/events" className="text-sm font-semibold text-maroon hover:underline">
              View all →
            </Link>
          </div>
          {events.length === 0 ? (
            <EmptyState
              icon="📅"
              heading="No upcoming events"
              description="Hangouts, Annual General Meetings and game nights will be listed here as they're scheduled."
              ctaLabel="See events"
              ctaTo="/events"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to="/events"
                  className="block overflow-hidden rounded-xl border border-gold/30 bg-card transition hover:border-gold hover:shadow-sm"
                >
                  {e.coverUrl && (
                    <img src={e.coverUrl} alt="" className="h-32 w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                      {formatDateTime(e.startsAt)}
                    </p>
                    <h3 className="mt-1 font-semibold text-maroon">{e.title}</h3>
                    {e.location && <p className="mt-1 text-xs text-ink/60">📍 {e.location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
