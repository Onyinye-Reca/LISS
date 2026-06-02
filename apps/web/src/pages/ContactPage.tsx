import { FormEvent, useState } from "react";
import { submitContact } from "../lib/contact-api";
import { TextField, Button, Alert } from "../components/ui";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const msg = await submitContact({ name, email, message });
      setSuccess(msg);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-bold text-maroon">Get in touch</h1>
      <p className="mt-2 text-sm text-ink/60">
        Questions, ideas, or want to get involved? Send us a message and the
        association will get back to you.
      </p>

      <div className="mt-8 rounded-xl border border-gold/30 bg-white p-6">
        {success ? (
          <Alert kind="success">{success}</Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <TextField
              label="Your name"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Message</span>
              <textarea
                required
                minLength={10}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
