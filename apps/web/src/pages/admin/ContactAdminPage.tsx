import { useEffect, useState } from "react";
import { ContactMessageView } from "@liss11/shared";
import { getContactMessages, deleteContactMessage } from "../../lib/content-api";
import { Alert } from "../../components/ui";
import { formatDate } from "../../lib/format";

export default function ContactAdminPage() {
  const [messages, setMessages] = useState<ContactMessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => getContactMessages().then(setMessages).catch((e) => setError(e.message));
  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const remove = async (m: ContactMessageView) => {
    if (!confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await deleteContactMessage(m.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon">Contact Messages</h1>
        <p className="mt-1 text-sm text-ink/60">
          Submissions from the contact form. These are also emailed to the
          association inbox.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="rounded-xl border border-gold/20 bg-white p-6 text-sm text-ink/50">
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-xl border border-gold/20 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-nearblack">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-sm text-maroon hover:underline">
                    {m.email}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink/50">{formatDate(m.createdAt)}</span>
                  <button onClick={() => void remove(m)} className="text-sm font-medium text-danger hover:underline">
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                {m.message}
              </p>
              <a
                href={`mailto:${m.email}?subject=Re: your message to LISS11`}
                className="mt-3 inline-block text-sm font-semibold text-maroon hover:underline"
              >
                Reply →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
