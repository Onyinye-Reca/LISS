import { z } from "zod";

/**
 * Elections & voting (PRD 4.10-4.11). Votes are INSERT-only (one per member per
 * position), enforced by a unique constraint + a DB trigger. The Electoral
 * Committee manages elections; members cast votes on open ones.
 */

const nullableDate = z.preprocess(
  (v) => (v === "" ? null : v),
  z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date")
    .nullable()
    .optional(),
);

// --- Management (Electoral Committee) ---
export const ElectionCreateSchema = z.object({
  title: z.string().min(2).max(200),
  opensAt: nullableDate,
  closesAt: nullableDate,
});
export type ElectionCreateInput = z.infer<typeof ElectionCreateSchema>;

// isOpen is how the committee opens/closes voting.
export const ElectionUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  isOpen: z.boolean().optional(),
  resultsPublished: z.boolean().optional(),
  opensAt: nullableDate,
  closesAt: nullableDate,
});
export type ElectionUpdateInput = z.infer<typeof ElectionUpdateSchema>;

export const PositionCreateSchema = z.object({
  title: z.string().min(2).max(120),
});
export type PositionCreateInput = z.infer<typeof PositionCreateSchema>;

export const CandidateCreateSchema = z.object({
  name: z.string().min(2).max(120),
  manifesto: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().max(2000).nullable().optional(),
  ),
  photoUrl: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().url().nullable().optional(),
  ),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;

// --- Voting (members) ---
// A member submits one candidate per position, in a single ballot.
export const VoteSchema = z.object({
  selections: z
    .array(
      z.object({
        positionId: z.string().min(1),
        candidateId: z.string().min(1),
      }),
    )
    .min(1),
});
export type VoteInput = z.infer<typeof VoteSchema>;

// --- Views ---
export interface CandidateView {
  id: string;
  name: string;
  manifesto: string | null;
  photoUrl: string | null;
}

export interface PositionView {
  id: string;
  title: string;
  candidates: CandidateView[];
}

/** Lightweight list item (no positions). `hasVoted` is for the requesting member. */
export interface ElectionSummary {
  id: string;
  title: string;
  isOpen: boolean;
  resultsPublished: boolean;
  opensAt: string | null;
  closesAt: string | null;
  positionCount: number;
  hasVoted: boolean;
}

/** Full election with positions + candidates, for the ballot. */
export interface ElectionDetail {
  id: string;
  title: string;
  isOpen: boolean;
  resultsPublished: boolean;
  opensAt: string | null;
  closesAt: string | null;
  positions: PositionView[];
  hasVoted: boolean;
}

// --- Results / tally ---
export interface CandidateResult {
  candidateId: string;
  name: string;
  votes: number;
}
export interface PositionResult {
  positionId: string;
  title: string;
  totalVotes: number;
  candidates: CandidateResult[]; // sorted desc by votes
}
export interface ElectionResults {
  id: string;
  title: string;
  isOpen: boolean;
  positions: PositionResult[];
}
