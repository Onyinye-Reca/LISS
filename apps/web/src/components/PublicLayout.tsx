import { Link, NavLink, Outlet } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium ${
    isActive ? "text-maroon" : "text-ink/70 hover:text-maroon"
  }`;
}

export default function PublicLayout() {
  const { member, logout } = useAuth();
  const isAdmin = !!member && ADMIN_PANEL_ROLES.includes(member.role as Role);

  return (
    <div className="flex min-h-screen flex-col bg-cream font-sans text-ink">
      <header className="sticky top-0 z-10 border-b border-gold/20 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-maroon">
            LISS11' Alumni
          </Link>
          <nav className="flex items-center gap-5">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/contact" className={navClass}>
              Contact
            </NavLink>
            {member ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium text-maroon">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => void logout()}
                  className="text-sm font-medium text-ink/70 hover:text-maroon"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-maroon px-3 py-1.5 text-sm font-semibold text-white hover:bg-maroon-dark"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-gold/20 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-ink/60 sm:flex-row">
          <span>© {new Date().getFullYear()} LISS11' Alumni Association</span>
          <Link to="/contact" className="hover:text-maroon">
            Get in touch
          </Link>
        </div>
      </footer>
    </div>
  );
}
