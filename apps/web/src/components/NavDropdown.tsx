import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export type NavChild = { to: string; label: string };

/**
 * Desktop nav dropdown: click to toggle, closes on outside-click or Escape.
 * Highlights the trigger when one of its children is the active route.
 */
export default function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: NavChild[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const active = items.some(
    (i) => pathname === i.to || pathname.startsWith(`${i.to}/`),
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-1 text-sm font-medium ${
          active ? "text-gold" : "text-ink/70 hover:text-gold"
        }`}
      >
        {label}
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.73a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 min-w-[12rem] rounded-xl border border-gold/20 bg-white py-2 shadow-lg"
        >
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm ${
                  isActive ? "text-gold" : "text-ink/80 hover:bg-card hover:text-maroon"
                }`
              }
            >
              {i.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
