import { z } from "zod";

/**
 * Request DTOs defined with Zod so the API can validate at runtime
 * and both halves can share the inferred TypeScript types.
 */
export const RegisterSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
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

export const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
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
