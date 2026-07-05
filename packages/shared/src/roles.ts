/**
 * Roles map to PRD section 3.2 (Roles & Permissions).
 * Keep this enum as the single source of truth shared by API and web.
 */
export enum Role {
  MEMBER = "MEMBER",
  EDITOR = "EDITOR",
  ELECTORAL_COMMITTEE = "ELECTORAL_COMMITTEE",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

/** Roles permitted to reach the admin panel at all (server-side gate, PRD 4.14). */
export const ADMIN_PANEL_ROLES: Role[] = [
  Role.EDITOR,
  Role.ELECTORAL_COMMITTEE,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

/**
 * Roles allowed to manage site content (EXCOS/BOT/Regions/etc.).
 * Excludes ELECTORAL_COMMITTEE, who are scoped to elections only (PRD 4.11).
 */
export const CONTENT_ROLES: Role[] = [Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN];

/**
 * Roles allowed to manage elections (the Electoral Committee plus admins).
 * Mirror of CONTENT_ROLES for the election domain (PRD 4.11 isolation): the
 * Electoral Committee can run elections but not touch general content.
 */
export const ELECTION_ROLES: Role[] = [
  Role.ELECTORAL_COMMITTEE,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];
