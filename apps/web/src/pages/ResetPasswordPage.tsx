import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/auth-api";
import { AuthShell, TextField, Button, Alert } from "../components/ui";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <Link to="/login" className="font-semibold text-maroon underline">
      Back to login
    </Link>
  );

  if (!token) {
    return (
      <AuthShell title="Invalid link" footer={footer}>
        <Alert>This reset link is missing its token. Request a new one.</Alert>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" footer={footer}>
        <Alert kind="success">
          Your password has been changed. Please log in with your new password.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" footer={footer}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
