import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventView } from "@liss11/shared";
import { getEvents, rsvpEvent, cancelRsvp } from "../lib/content-api";
import { formatDateTime } from "../lib/format";
import { Alert, EmptyState } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

function EventCard({ event, onChange }: { event: EventView; onChange: (e: EventView) => void }) {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    // Guests must log in to reserve; bring them back to events afterwards.
    if (!member) {
      navigate("/login", { state: { from: "/events" } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(event.isAttending ? await cancelRsvp(event.id) : await rsvpEvent(event.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const label = !member
    ? "Log in to reserve"
    : event.isAttending
      ? "Cancel reservation"
      : "Reserve a spot";

  return (
    <div className="overflow-hidden rounded-xl border border-gold/30 bg-card">
      {event.coverUrl && (
        <img src={event.coverUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold">
          {formatDateTime(event.startsAt)}
          {event.endsAt && ` – ${formatDateTime(event.endsAt)}`}
          {!event.isPublic && (
            <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/60">
              Members only
            </span>
          )}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-maroon">{event.title}</h3>
        {event.location && <p className="mt-1 text-sm text-ink/60">📍 {event.location}</p>}
        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{event.description}</p>
        )}
        {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => void toggle()}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              event.isAttending
                ? "border border-maroon text-maroon hover:bg-maroon/5"
                : "bg-maroon text-white hover:bg-maroon-dark"
            }`}
          >
            {busy ? "…" : label}
          </button>
          <span className="text-sm text-ink/60">
            {event.rsvpCount} {event.rsvpCount === 1 ? "person" : "people"} attending
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const replace = (e: EventView) =>
    setEvents((list) => list.map((x) => (x.id === e.id ? e : x)));

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = events
    .filter((e) => new Date(e.startsAt).getTime() < now)
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Events</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Hangouts, Annual General Meetings and game nights. Reserve your spot.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : events.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="📅"
            heading="No events yet"
            description="Upcoming events will be listed here as they're scheduled."
            ctaLabel="Back home"
            ctaTo="/"
          />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink/50">No upcoming events right now.</p>
            ) : (
              <div className="space-y-5">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} onChange={replace} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/40">
                Past events
              </h2>
              <div className="space-y-5 opacity-75">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} onChange={replace} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
