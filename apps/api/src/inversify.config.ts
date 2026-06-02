import { Container } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "./types";
import { MemberRepository } from "./repositories/member.repository";
import { VerificationTokenRepository } from "./repositories/verification-token.repository";
import { PasswordResetTokenRepository } from "./repositories/password-reset-token.repository";
import { AuthService } from "./services/auth.service";
import { ConsoleEmailService } from "./services/email.service";
import { ResendEmailService } from "./services/resend-email.service";

export function buildContainer(): Container {
  const container = new Container();

  // One shared PrismaClient for the whole app — never a new pool per resolution.
  container.bind(TYPES.PrismaClient).toConstantValue(new PrismaClient());

  container.bind(TYPES.MemberRepository).to(MemberRepository);
  container
    .bind(TYPES.VerificationTokenRepository)
    .to(VerificationTokenRepository);
  container
    .bind(TYPES.PasswordResetTokenRepository)
    .to(PasswordResetTokenRepository);
  container.bind(TYPES.AuthService).to(AuthService);

  // Use real email when configured; otherwise log links to the console so
  // local dev needs no credentials (PRD section 8 + Group C plan).
  if (process.env.RESEND_API_KEY) {
    container.bind(TYPES.EmailService).to(ResendEmailService);
    // eslint-disable-next-line no-console
    console.log("[email] using Resend");
  } else {
    container.bind(TYPES.EmailService).to(ConsoleEmailService);
    // eslint-disable-next-line no-console
    console.log("[email] RESEND_API_KEY not set — logging links to console");
  }

  return container;
}
