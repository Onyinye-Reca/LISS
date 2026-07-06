import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ADMIN_PANEL_ROLES, Role } from "@liss11/shared";
import { useAuth } from "../auth/AuthContext";
import UserMenu from "./UserMenu";
import NavDropdown from "./NavDropdown";

type NavLeaf = { to: string; label: string; end?: boolean; auth?: boolean };
type NavGroup = { label: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const isGroup = (i: NavItem): i is NavGroup => "children" in i;

// Site nav (PRD site map). `auth: true` items are members-only: hidden when
// logged out (routes + API also enforce it). Related pages are grouped into
// dropdowns to keep the top bar clean.
const navItems: NavItem[] = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/membership", label: "Membership" },
  {
    label: "Explore",
    children: [
      { to: "/gallery", label: "Gallery" },
      { to: "/events", label: "Events" },
      { to: "/blog", label: "Blog" },
      { to: "/announcements", label: "Announcements", auth: true },
    ],
  },
  {
    label: "Members",
    children: [
      { to: "/financials", label: "Financials", auth: true },
      { to: "/donate", label: "Donate", auth: true },
      { to: "/decides", label: "Decides", auth: true },
    ],
  },
  { to: "/contact", label: "Contact" },
];

// Drop members-only items (and any now-empty groups) for logged-out visitors.
function visibleNav(loggedIn: boolean): NavItem[] {
  const out: NavItem[] = [];
  for (const item of navItems) {
    if (isGroup(item)) {
      const children = item.children.filter((c) => !c.auth || loggedIn);
      if (children.length) out.push({ ...item, children });
    } else if (!item.auth || loggedIn) {
      out.push(item);
    }
  }
  return out;
}

function groupChildren(label: string, loggedIn: boolean): NavLeaf[] {
  const g = navItems.find((i) => isGroup(i) && i.label === label) as
    | NavGroup
    | undefined;
  return (g?.children ?? []).filter((c) => !c.auth || loggedIn);
}

const socials = [
  {
    label: "X (Twitter)",
    href: "https://x.com",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M22 12.06C22 6.48 17.52 2 11.94 2 6.36 2 1.88 6.48 1.88 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.77v-2.9h2.55V9.85c0-2.52 1.5-3.91 3.8-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.84a6 6 0 100 12 6 6 0 000-12zm0 9.9a3.9 3.9 0 110-7.8 3.9 3.9 0 010 7.8zm6.24-10.14a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z",
  },
];

function SocialIcon({ label, href, path }: (typeof socials)[number]) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    </a>
  );
}

export default function PublicLayout() {
  const { member, logout } = useAuth();
  const isAdmin = !!member && ADMIN_PANEL_ROLES.includes(member.role as Role);
  const items = visibleNav(!!member);
  const exploreLinks = groupChildren("Explore", !!member);
  const membersLinks = groupChildren("Members", !!member);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? "text-gold" : "text-ink/70 hover:text-gold"}`;
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-2 py-3 text-base font-medium ${
      isActive ? "text-gold" : "text-ink hover:text-gold"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-cream font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-gold/20 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-maroon" onClick={closeMenu}>
            LISS11' Alumni
          </Link>

          {/* Desktop nav: grouped links + dropdowns. Shown at lg+; below that
              the hamburger takes over. */}
          <nav className="hidden flex-1 items-center lg:flex">
            <div className="mx-auto flex items-center gap-6">
              {items.map((item) =>
                isGroup(item) ? (
                  <NavDropdown key={item.label} label={item.label} items={item.children} />
                ) : (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>
            <div className="ml-4 shrink-0">
              {member ? (
                <UserMenu />
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-maroon px-3 py-1.5 text-sm font-semibold text-white hover:bg-maroon-dark"
                >
                  Log in
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile hamburger (PRD 7.4): shown below 1024px. */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-maroon lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="text-2xl" aria-hidden="true">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile menu panel: groups become labelled sections. */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            className="border-t border-gold/20 bg-cream px-4 py-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {items.map((item) =>
                isGroup(item) ? (
                  <li key={item.label} className="mt-1">
                    <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                      {item.label}
                    </div>
                    {item.children.map((c) => (
                      <NavLink key={c.to} to={c.to} onClick={closeMenu} className={mobileLinkClass}>
                        {c.label}
                      </NavLink>
                    ))}
                  </li>
                ) : (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} onClick={closeMenu} className={mobileLinkClass}>
                      {item.label}
                    </NavLink>
                  </li>
                ),
              )}
              <li className="mt-2 border-t border-gold/20 pt-3">
                {member ? (
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 text-sm text-ink/60">
                      Signed in as{" "}
                      <span className="font-semibold text-maroon">{member.firstName} {member.lastName}</span>
                    </span>
                    {isAdmin && (
                      <Link to="/admin" onClick={closeMenu} className="px-2 py-3 font-medium text-maroon">
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        closeMenu();
                        void logout();
                      }}
                      className="px-2 py-3 text-left font-medium text-ink/70"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="block rounded-lg bg-maroon px-4 py-3 text-center font-semibold text-white"
                  >
                    Log in
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        )}
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer. PRD 9.3: maroon background, white text, grouped nav + socials */}
      <footer className="bg-maroon text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="text-lg font-bold">LISS11' Alumni</div>
              <p className="mt-2 text-sm text-white/70">
                Connect, earn, grow and vibe with your classmates.
              </p>
              <a
                href="mailto:info@liss11.org"
                className="mt-3 inline-block text-sm text-gold-light hover:underline"
              >
                info@liss11.org
              </a>
              <div className="mt-3 flex gap-3 text-sm text-white/80">
                <Link to="/about" className="hover:text-white">About</Link>
                <Link to="/contact" className="hover:text-white">Contact</Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Explore
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {exploreLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-white/80 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {membersLinks.length > 0 && (
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Members
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {membersLinks.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-white/80 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Follow us
              </div>
              <div className="mt-2 flex gap-1">
                {socials.map((s) => (
                  <SocialIcon key={s.label} {...s} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/15 pt-6 text-sm text-white/60">
            © {new Date().getFullYear()} LISS Class of 2011 Alumni Association. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
