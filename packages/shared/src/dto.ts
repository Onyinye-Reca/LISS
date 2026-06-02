import { z } from "zod";

/**
 * Request DTOs defined with Zod so the API can validate at runtime
 * and both halves can share the inferred TypeScript types.
 */
export const RegisterSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** Shape returned to the client for the current member (never includes the password hash). */
export interface MemberView {
  id: string;
  fullName: string;
  email: string;
  role: string;
  verified: boolean;
}
