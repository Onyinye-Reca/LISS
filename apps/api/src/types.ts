/** Inversify binding identifiers. Symbols avoid string-key collisions. */
export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  MemberRepository: Symbol.for("MemberRepository"),
  AuthService: Symbol.for("AuthService"),
  EmailService: Symbol.for("EmailService"),
} as const;
