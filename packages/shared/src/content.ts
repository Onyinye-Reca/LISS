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
