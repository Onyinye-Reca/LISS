/** Inversify binding identifiers. Symbols avoid string-key collisions. */
export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  MemberRepository: Symbol.for("MemberRepository"),
  VerificationTokenRepository: Symbol.for("VerificationTokenRepository"),
  PasswordResetTokenRepository: Symbol.for("PasswordResetTokenRepository"),
  ContactMessageRepository: Symbol.for("ContactMessageRepository"),
  AuthService: Symbol.for("AuthService"),
  ContactService: Symbol.for("ContactService"),
  EmailService: Symbol.for("EmailService"),
} as const;
