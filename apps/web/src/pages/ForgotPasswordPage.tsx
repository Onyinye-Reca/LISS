import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../lib/auth-api";
import { AuthShell, TextField, Button, Alert } from "../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setMessage(await forgotPassword(email));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one"
      footer={
        <Link to="/login" className="font-semibold text-maroon underline">
          Back to login
        </Link>
      }
    >
      {message ? (
        <Alert kind="success">{message}</Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
