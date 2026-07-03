import { useEffect, useState } from "react";
import { BotMemberView } from "@liss11/shared";
import { getBotMembers } from "../lib/content-api";
import PersonCard from "../components/PersonCard";
import { EmptyState } from "../components/ui";

export default function BotPage() {
  const [members, setMembers] = useState<BotMemberView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBotMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-maroon">Board of Trustees</h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink/70">
          Our Board of Trustees provides guidance, governance, and continuity for the
          association - stewarding its long-term interests.
        </p>
      </header>

      {loading ? (
        <p className="mt-12 text-center text-ink/50">Loading…</p>
      ) : members.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon="🏛"
            heading="No trustees designated yet"
            description="Board of Trustees members will be announced here in due course."
            ctaLabel="Contact us"
            ctaTo="/contact"
          />
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <PersonCard
              key={m.id}
              photoUrl={m.photoUrl}
              name={`${m.firstName} ${m.lastName}`}
              subtitle={m.designation}
              bio={m.bio}
              email={m.email}
            />
          ))}
        </div>
      )}
    </main>
  );
}
