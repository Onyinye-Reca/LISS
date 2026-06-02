import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";
import { AuthShell, TextField, Button, Alert } from "../components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const member = await login(email, password);
      // Send admins to where they were headed (or the dashboard); others home.
      if (from) navigate(from, { replace: true });
      else if (ADMIN_PANEL_ROLES.includes(member.role as Role))
        navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your LISS11' Alumni account"
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="font-semibold text-maroon underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-maroon underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}
