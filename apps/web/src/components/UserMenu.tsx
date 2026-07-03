import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";

/**
 * Compact account menu for the desktop header: an avatar + first name that
 * opens a dropdown with the full name, Admin (if permitted), and Log out.
 * Collapses what used to be two inline items ("Hi, X" + "Log out") into one.
 */
export default function UserMenu() {
  const { member, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!member) return null;
  const isAdmin = ADMIN_PANEL_ROLES.includes(member.role as Role);
  const initial = member.firstName.trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${member.firstName} ${member.lastName}`}
        title={`${member.firstName} ${member.lastName}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon text-sm font-semibold text-white ring-offset-2 ring-offset-cream transition hover:bg-maroon-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-gold/20 bg-white py-1 shadow-lg"
        >
          <div className="px-4 py-2">
            <div className="text-xs text-ink/50">Signed in as</div>
            <div className="truncate text-sm font-semibold text-maroon">
              {member.firstName} {member.lastName}
            </div>
          </div>
          <div className="my-1 border-t border-gold/10" />
          {isAdmin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-card"
            >
              Admin panel
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-card"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
