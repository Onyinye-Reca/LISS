import { z } from "zod";

// Treat empty form strings as "cleared" (null) for optional fields.
const nullableStr = (max: number) =>
  z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().max(max).nullable().optional(),
  );
const nullableEmail = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().email().nullable().optional(),
);
const nullableUrl = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().url().nullable().optional(),
);
// Accepts an ISO/date string from a form; "" clears it. Validated as a real date.
const nullableDate = z.preprocess(
  (v) => (v === "" ? null : v),
  z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date")
    .nullable()
    .optional(),
);
// A required date/datetime string (e.g. from a datetime-local input).
const requiredDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

// --- EXCOS / Officers (PRD 4.3) ---
export const OFFICER_TIERS = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "PRO",
  "TREASURER",
  "OTHER",
] as const;
export type OfficerTier = (typeof OFFICER_TIERS)[number];

export const OFFICER_TIER_LABELS: Record<OfficerTier, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice-President",
  SECRETARY: "Secretary",
  PRO: "PRO",
  TREASURER: "Treasurer",
  OTHER: "Other Officers",
};

export const OfficerCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  title: z.string().min(2).max(120),
  tier: z.enum(OFFICER_TIERS).default("OTHER"),
  email: z.string().email(),
  whatsapp: nullableStr(40),
  termStart: z.number().int().min(2011).max(2100).nullable().optional(),
  termEnd: z.number().int().min(2011).max(2100).nullable().optional(),
  photoUrl: nullableUrl,
  isPast: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});
export type OfficerCreateInput = z.infer<typeof OfficerCreateSchema>;
export const OfficerUpdateSchema = OfficerCreateSchema.partial();
export type OfficerUpdateInput = z.infer<typeof OfficerUpdateSchema>;

export interface OfficerView {
  id: string;
  fullName: string;
  title: string;
  tier: OfficerTier;
  email: string;
  whatsapp: string | null;
  termStart: number | null;
  termEnd: number | null;
  photoUrl: string | null;
  isPast: boolean;
  sortOrder: number;
}

// --- Board of Trustees (PRD 4.4) ---
export const BotMemberCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  designation: z.string().min(2).max(120),
  bio: nullableStr(2000),
  email: nullableEmail,
  photoUrl: nullableUrl,
  sortOrder: z.number().int().optional().default(0),
});
export type BotMemberCreateInput = z.infer<typeof BotMemberCreateSchema>;
export const BotMemberUpdateSchema = BotMemberCreateSchema.partial();
export type BotMemberUpdateInput = z.infer<typeof BotMemberUpdateSchema>;

export interface BotMemberView {
  id: string;
  fullName: string;
  designation: string;
  bio: string | null;
  email: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

// --- Regions (PRD 4.5) ---
export const REGION_KEYS = [
  "SOUTH_SOUTH",
  "SOUTH_EAST",
  "SOUTH_WEST",
  "NORTH",
  "DIASPORA",
] as const;
export type RegionKey = (typeof REGION_KEYS)[number];

export const RegionUpdateSchema = z.object({
  description: nullableStr(2000),
  repName: nullableStr(120),
  repEmail: nullableEmail,
  repWhatsapp: nullableStr(40),
  memberCount: z.number().int().min(0).optional(),
});
export type RegionUpdateInput = z.infer<typeof RegionUpdateSchema>;

export interface RegionView {
  id: string;
  key: RegionKey;
  name: string;
  description: string | null;
  repName: string | null;
  repEmail: string | null;
  repWhatsapp: string | null;
  memberCount: number;
}

// --- Announcements (PRD 4.6 / "Better Update") ---
export const AnnouncementCreateSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(20000),
  coverUrl: nullableUrl,
  // Omit to default to now(); a date string lets admins backdate a post.
  publishedAt: nullableDate,
});
export type AnnouncementCreateInput = z.infer<typeof AnnouncementCreateSchema>;
export const AnnouncementUpdateSchema = AnnouncementCreateSchema.partial();
export type AnnouncementUpdateInput = z.infer<typeof AnnouncementUpdateSchema>;

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string; // ISO string
}

// --- Gallery: albums + images (PRD 4.6) ---
export const AlbumCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: nullableStr(2000),
  coverUrl: nullableUrl,
  eventDate: nullableDate,
  sortOrder: z.number().int().optional().default(0),
});
export type AlbumCreateInput = z.infer<typeof AlbumCreateSchema>;
export const AlbumUpdateSchema = AlbumCreateSchema.partial();
export type AlbumUpdateInput = z.infer<typeof AlbumUpdateSchema>;

export const GalleryImageCreateSchema = z.object({
  url: z.string().url(),
  caption: nullableStr(300),
  sortOrder: z.number().int().optional().default(0),
});
export type GalleryImageCreateInput = z.infer<typeof GalleryImageCreateSchema>;

export interface GalleryImageView {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface AlbumView {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  eventDate: string | null; // ISO string
  sortOrder: number;
  imageCount: number;
  images: GalleryImageView[];
}

// --- Events (PRD: alumni events, members-only) ---
export const EventCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: nullableStr(5000),
  location: nullableStr(200),
  startsAt: requiredDate,
  endsAt: nullableDate,
  coverUrl: nullableUrl,
  // Public events show to everyone; members-only events are hidden from guests.
  isPublic: z.boolean().optional().default(true),
});
export type EventCreateInput = z.infer<typeof EventCreateSchema>;
export const EventUpdateSchema = EventCreateSchema.partial();
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;

export interface EventView {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string; // ISO string
  endsAt: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  rsvpCount: number;
  isAttending: boolean; // for the requesting member (false when logged out)
}

// --- Financial Statements (PRD: financial transparency, members-only) ---
// The file is uploaded as multipart; only the metadata is validated here.
export const FinancialStatementCreateSchema = z.object({
  title: z.string().min(2).max(200),
  period: nullableStr(50),
});
export type FinancialStatementCreateInput = z.infer<
  typeof FinancialStatementCreateSchema
>;
export const FinancialStatementUpdateSchema =
  FinancialStatementCreateSchema.partial();
export type FinancialStatementUpdateInput = z.infer<
  typeof FinancialStatementUpdateSchema
>;

export interface FinancialStatementView {
  id: string;
  title: string;
  period: string | null;
  fileName: string | null;
  uploadedAt: string; // ISO string
  // No file URL is exposed; download via GET /financials/:id/download (gated).
}

// --- Blog (PRD: long-form articles, public, distinct from Announcements) ---
// The slug is generated server-side from the title, so it is not an input.
export const BlogPostCreateSchema = z.object({
  title: z.string().min(2).max(200),
  excerpt: nullableStr(500),
  body: z.string().min(1).max(50000),
  coverUrl: nullableUrl,
  author: z.string().min(1).max(120),
  isPublished: z.boolean().optional().default(true),
  publishedAt: nullableDate,
});
export type BlogPostCreateInput = z.infer<typeof BlogPostCreateSchema>;
export const BlogPostUpdateSchema = BlogPostCreateSchema.partial();
export type BlogPostUpdateInput = z.infer<typeof BlogPostUpdateSchema>;

export interface BlogPostView {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  author: string;
  isPublished: boolean;
  publishedAt: string; // ISO string
}
