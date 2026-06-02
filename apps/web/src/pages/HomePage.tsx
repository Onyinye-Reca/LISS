import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/ui";

type Status = "checking" | "up" | "down";

export default function HomePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [params] = useSearchParams();
  const { member, logout } = useAuth();
  const verified = params.get("verified");
  const isAdmin =
    !!member && ADMIN_PANEL_ROLES.includes(member.role as Role);

  useEffect(() => {
    apiFetch("/health")
      .then((r) => setStatus(r.ok ? "up" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  const dot =
    status === "up" ? "bg-green-500" : status === "down" ? "bg-red-500" : "bg-gold";

  return (
    <main className="min-h-screen bg-cream text-ink font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold text-maroon">LISS11' Alumni</h1>

        {verified === "1" && (
          <Alert kind="success">Email verified — you can now log in.</Alert>
        )}
        {verified === "0" && (
          <Alert kind="error">
            That verification link is invalid or has expired.
          </Alert>
        )}

        <div className="inline-flex items-center gap-3 rounded-lg border border-gold/40 bg-white px-4 py-3">
          <span className={`h-3 w-3 rounded-full ${dot}`} />
          <span className="text-sm">
            API status:{" "}
            <strong className="text-maroon">
              {status === "checking" ? "checking…" : status}
            </strong>
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm">
          {member ? (
            <>
              <p>
                Signed in as <strong className="text-maroon">{member.fullName}</strong>{" "}
                ({member.role})
              </p>
              <div className="flex gap-4">
                {isAdmin && (
                  <Link to="/admin" className="font-semibold text-maroon underline">
                    Admin dashboard
                  </Link>
                )}
                <button
                  onClick={() => void logout()}
                  className="font-semibold text-ink/70 underline"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="font-semibold text-maroon underline">
                Log in
              </Link>
              <Link to="/register" className="font-semibold text-maroon underline">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
