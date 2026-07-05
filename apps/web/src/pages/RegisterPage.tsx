import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { register, uploadAvatar } from "../lib/auth-api";
import { AuthShell, TextField, Button, Alert } from "../components/ui";
import ImageUpload from "../components/ImageUpload";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!photoUrl) {
      setError("Please add a profile picture.");
      return;
    }
    setBusy(true);
    try {
      await register(firstName, lastName, email, password, photoUrl);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="Check your email"
        footer={
          <Link to="/login" className="font-semibold text-maroon underline">
            Back to login
          </Link>
        }
      >
        <Alert kind="success">
          We've sent a verification link to <strong>{email}</strong>. Click it to
          activate your account, then log in.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the LISS11' Alumni network"
      footer={
        <>
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-maroon underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <ImageUpload
          value={photoUrl}
          folder="avatars"
          uploader={uploadAvatar}
          onChange={setPhotoUrl}
          label="Profile picture (required)"
          shape="circle"
        />
        <TextField
          label="First name"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          label="Last name"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
