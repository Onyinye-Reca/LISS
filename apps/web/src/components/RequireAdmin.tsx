import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";

/**
 * Client-side gate for the admin route group. This is UX only. The server
 * re-checks role on every request (PRD 4.14); never trust this alone.
 */
export default function RequireAdmin() {
  const { member, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-ink/60">
        Loading…
      </div>
    );
  }

  if (!member) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!ADMIN_PANEL_ROLES.includes(member.role as Role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
