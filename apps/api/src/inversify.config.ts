import { Container } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "./types";
import { MemberRepository } from "./repositories/member.repository";
import { AuthService } from "./services/auth.service";
import { ConsoleEmailService } from "./services/email.service";

export function buildContainer(): Container {
  const container = new Container();

  // One shared PrismaClient for the whole app — never a new pool per resolution.
  container.bind(TYPES.PrismaClient).toConstantValue(new PrismaClient());

  container.bind(TYPES.MemberRepository).to(MemberRepository);
  container.bind(TYPES.AuthService).to(AuthService);
  container.bind(TYPES.EmailService).to(ConsoleEmailService);

  return container;
}
