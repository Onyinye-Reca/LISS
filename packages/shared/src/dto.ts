import { z } from "zod";
import { Role } from "./roles";

/**
 * Request DTOs defined with Zod so the API can validate at runtime
 * and both halves can share the inferred TypeScript types.
 */
export const RegisterSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // Uploaded via POST /uploads/avatar first; the resulting URL is submitted
  // here. Required for new sign-ups (existing members are grandfathered).
  photoUrl: z.string().url(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email(),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/** Role update payload for admin role management */
export const RoleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
});
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;

/** Contact form subjects. The API routes the notification email by subject. */
export const CONTACT_SUBJECTS = [
  "General",
  "Membership",
  "Elections",
  "Financials",
  "Events",
  "Other",
] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  // Optional for backward compatibility with older clients; defaults to General.
  subject: z.enum(CONTACT_SUBJECTS).optional().default("General"),
  message: z.string().min(10).max(5000),
});
export type ContactInput = z.infer<typeof ContactSchema>;

/** Shape returned to the client for the current member (never includes the password hash). */
export interface MemberView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  verified: boolean;
  photoUrl: string | null;
}

// --- Payments (dues + donations via Paystack) ---
export const PAYMENT_TYPES = ["DUES", "DONATION"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Amount is whole naira; the server converts to kobo for Paystack. */
export const PaymentInitSchema = z.object({
  type: z.enum(PAYMENT_TYPES),
  amount: z.number().int().min(100).max(10_000_000),
});
export type PaymentInitInput = z.infer<typeof PaymentInitSchema>;

export interface PaymentView {
  id: string;
  type: PaymentType;
  amount: number; // naira (kobo / 100)
  reference: string;
  status: PaymentStatus;
  createdAt: string; // ISO string
}

/** Admin-only view: includes who made the payment. */
export interface AdminPaymentView extends PaymentView {
  memberName: string;
  memberEmail: string;
}

/** A member's dues status for a given year (PRD 4.9 / US-010). */
export interface DuesStatusView {
  year: number;
  paid: boolean;
  amountNaira: number | null; // what they paid, if paid
  duesAmountNaira: number | null; // configured annual dues (for pre-fill)
}
