import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DuesStatusView } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";
import { getDuesStatus } from "../lib/payments-api";

// Quick links surfaced on a member's dashboard (PRD 4.9 member area).
const memberLinks: { to: string; title: string; blurb: string }[] = [
  { to: "/pay", title: "Dues & Donations", blurb: "Pay your annual dues or make a donation." },
  { to: "/decides", title: "LISS Decides", blurb: "View elections and cast your vote." },
  { to: "/financials", title: "Financial Statements", blurb: "Review the association's finances." },
  { to: "/announcements", title: "Announcements", blurb: "Latest news for members." },
  { to: "/events", title: "Events", blurb: "Reunions, meetups and RSVPs." },
  { to: "/gallery", title: "Gallery", blurb: "Photos from our gatherings." },
];

const benefits = [
  "Vote in association elections (LISS Decides)",
  "Access members-only financial statements",
  "RSVP to reunions and events",
  "Stay in the loop with member announcements",
  "Support the class through dues and donations",
];

function DuesCard() {
  const [dues, setDues] = useState<DuesStatusView | null>(null);

  useEffect(() => {
    getDuesStatus()
      .then(setDues)
      .catch(() => {
        /* best-effort */
      });
  }, []);

  if (!dues) return null;

  return (
    <div
      className={`rounded-xl border p-5 ${
        dues.paid ? "border-success/30 bg-success/5" : "border-gold/30 bg-gold/5"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-maroon">
            {dues.year} membership dues
          </p>
          <p className="mt-1 text-sm text-ink/70">
            {dues.paid ? (
              <>
                <span className="font-medium text-success">Paid</span>
                {dues.amountNaira != null && ` — ₦${dues.amountNaira.toLocaleString()}`}
                . Thank you!
              </>
            ) : (
              <>
                <span className="font-medium text-gold">Not paid yet</span>
                {dues.duesAmountNaira != null &&
                  ` — the annual dues are ₦${dues.duesAmountNaira.toLocaleString()}.`}
              </>
            )}
          </p>
        </div>
        {!dues.paid && (
          <Link
            to="/pay"
            className="shrink-0 rounded-lg bg-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-maroon/90"
          >
            Pay dues
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const { member } = useAuth();

  // Signed-in members see their dashboard; visitors see the join page.
  if (member) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-maroon">
          Welcome, {member.firstName}
        </h1>
        <p className="mt-2 text-ink/60">Your membership at a glance.</p>

        <div className="mt-8">
          <DuesCard />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border border-gold/30 bg-white p-5 transition hover:border-gold hover:shadow-sm"
            >
              <p className="font-semibold text-maroon">{l.title}</p>
              <p className="mt-1 text-sm text-ink/60">{l.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-maroon">Become a member</h1>
      <p className="mt-3 text-lg text-ink/70">
        Join the LISS Class of 2011 Alumni Association to connect with your
        classmates, take part in association life, and support the class.
      </p>

      <ul className="mt-8 space-y-3">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span className="mt-1 text-gold" aria-hidden="true">
              ✓
            </span>
            <span className="text-ink/80">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          to="/register"
          className="rounded-lg bg-maroon px-6 py-3 font-semibold text-white hover:bg-maroon/90"
        >
          Join now
        </Link>
        <span className="text-sm text-ink/60">
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-maroon hover:underline">
            Log in
          </Link>
        </span>
      </div>
    </div>
  );
}
