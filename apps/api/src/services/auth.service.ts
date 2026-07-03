import { inject, injectable } from "inversify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { RegisterInput, LoginInput, MemberView } from "@liss11/shared";
import { TYPES } from "../types";
import { MemberRepository } from "../repositories/member.repository";
import { VerificationTokenRepository } from "../repositories/verification-token.repository";
import { PasswordResetTokenRepository } from "../repositories/password-reset-token.repository";
import type { EmailService } from "./email.service";

const BCRYPT_COST = 12; // PRD 7.2
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h JWT, PRD 3.3
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h verification link
const RESET_TTL_MS = 1000 * 60 * 60; // 1h password-reset link

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.MemberRepository) private members: MemberRepository,
    @inject(TYPES.VerificationTokenRepository)
    private tokens: VerificationTokenRepository,
    @inject(TYPES.PasswordResetTokenRepository)
    private resetTokens: PasswordResetTokenRepository,
    @inject(TYPES.EmailService) private email: EmailService,
  ) {}

  private toView(m: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    verified: boolean;
  }): MemberView {
    return {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      role: m.role,
      verified: m.verified,
    };
  }

  private sign(memberId: string, role: string, tokenVersion: number): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    return jwt.sign({ sub: memberId, role, ver: tokenVersion }, secret, {
      expiresIn: TOKEN_TTL_SECONDS,
    });
  }

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  /** Issues a fresh verification token (invalidating prior ones) and emails the link. */
  private async issueVerification(memberId: string, email: string): Promise<void> {
    await this.tokens.deleteForMember(memberId);

    const raw = randomBytes(32).toString("hex");
    await this.tokens.create({
      memberId,
      tokenHash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    const apiBase = process.env.API_BASE_URL ?? "http://localhost:4000";
    const verifyUrl = `${apiBase}/auth/verify?token=${raw}`;
    await this.email.sendVerification(email, verifyUrl);
  }

  async register(input: RegisterInput): Promise<MemberView> {
    const existing = await this.members.findByEmail(input.email);
    if (existing) throw new AuthError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const member = await this.members.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });

    await this.issueVerification(member.id, member.email);
    return this.toView(member);
  }

  /** Consumes a verification token and marks the member verified. */
  async verify(rawToken: string): Promise<void> {
    if (!rawToken) throw new AuthError("Missing verification token", 400);

    const record = await this.tokens.findByHash(this.hashToken(rawToken));
    if (!record) throw new AuthError("Invalid or already-used token", 400);

    if (record.expiresAt.getTime() < Date.now()) {
      await this.tokens.deleteById(record.id);
      throw new AuthError("Verification link has expired", 400);
    }

    await this.members.markVerified(record.memberId);
    await this.tokens.deleteById(record.id); // single-use
  }

  /**
   * Re-sends a verification link. Always resolves regardless of whether the
   * email exists or is already verified, to avoid account enumeration.
   */
  async resendVerification(email: string): Promise<void> {
    const member = await this.members.findByEmail(email);
    if (member && !member.verified) {
      await this.issueVerification(member.id, member.email);
    }
  }

  async login(input: LoginInput): Promise<{ token: string; member: MemberView }> {
    const member = await this.members.findByEmail(input.email);
    if (!member) throw new AuthError("Invalid credentials", 401);

    const ok = await bcrypt.compare(input.password, member.passwordHash);
    if (!ok) throw new AuthError("Invalid credentials", 401);

    // Gate login on the email-verification state (PRD 3.3 / s.11).
    if (!member.verified) {
      throw new AuthError("Please verify your email before logging in", 403);
    }

    const token = this.sign(member.id, member.role, member.tokenVersion);
    return { token, member: this.toView(member) };
  }

  /**
   * Issues a password-reset link. Always resolves regardless of whether the
   * email exists, to avoid account enumeration (PRD 7.2).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const member = await this.members.findByEmail(email);
    if (!member) return;

    await this.resetTokens.deleteForMember(member.id);
    const raw = randomBytes(32).toString("hex");
    await this.resetTokens.create({
      memberId: member.id,
      tokenHash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });

    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
    const resetUrl = `${webOrigin}/reset-password?token=${raw}`;
    await this.email.sendPasswordReset(member.email, resetUrl);
  }

  /**
   * Consumes a reset token, sets a new password, and bumps tokenVersion so
   * any existing sessions are invalidated.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (!rawToken) throw new AuthError("Missing reset token", 400);

    const record = await this.resetTokens.findByHash(this.hashToken(rawToken));
    if (!record) throw new AuthError("Invalid or already-used token", 400);

    if (record.expiresAt.getTime() < Date.now()) {
      await this.resetTokens.deleteById(record.id);
      throw new AuthError("Reset link has expired", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await this.members.setPassword(record.memberId, passwordHash);
    await this.resetTokens.deleteById(record.id); // single-use
  }

  async getMember(id: string): Promise<MemberView | null> {
    const member = await this.members.findById(id);
    return member ? this.toView(member) : null;
  }

  get tokenTtlMs(): number {
    return TOKEN_TTL_SECONDS * 1000;
  }
}
