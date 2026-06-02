/** Inversify binding identifiers. Symbols avoid string-key collisions. */
export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  MemberRepository: Symbol.for("MemberRepository"),
  VerificationTokenRepository: Symbol.for("VerificationTokenRepository"),
  PasswordResetTokenRepository: Symbol.for("PasswordResetTokenRepository"),
  AuthService: Symbol.for("AuthService"),
  EmailService: Symbol.for("EmailService"),
} as const;
