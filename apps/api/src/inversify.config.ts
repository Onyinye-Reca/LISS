import { Container } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "./types";
import { MemberRepository } from "./repositories/member.repository";
import { VerificationTokenRepository } from "./repositories/verification-token.repository";
import { PasswordResetTokenRepository } from "./repositories/password-reset-token.repository";
import { ContactMessageRepository } from "./repositories/contact-message.repository";
import { OfficerRepository } from "./repositories/officer.repository";
import { BotMemberRepository } from "./repositories/bot-member.repository";
import { RegionRepository } from "./repositories/region.repository";
import { AnnouncementRepository } from "./repositories/announcement.repository";
import { AlbumRepository } from "./repositories/album.repository";
import { AuthService } from "./services/auth.service";
import { ContactService } from "./services/contact.service";
import { ConsoleEmailService } from "./services/email.service";
import { ResendEmailService } from "./services/resend-email.service";
import {
  CloudinaryStorageService,
  LocalStorageService,
} from "./services/storage.service";

export function buildContainer(): Container {
  const container = new Container();

  // One shared PrismaClient for the whole app. Never a new pool per resolution.
  container.bind(TYPES.PrismaClient).toConstantValue(new PrismaClient());

  container.bind(TYPES.MemberRepository).to(MemberRepository);
  container
    .bind(TYPES.VerificationTokenRepository)
    .to(VerificationTokenRepository);
  container
    .bind(TYPES.PasswordResetTokenRepository)
    .to(PasswordResetTokenRepository);
  container
    .bind(TYPES.ContactMessageRepository)
    .to(ContactMessageRepository);
  container.bind(TYPES.OfficerRepository).to(OfficerRepository);
  container.bind(TYPES.BotMemberRepository).to(BotMemberRepository);
  container.bind(TYPES.RegionRepository).to(RegionRepository);
  container.bind(TYPES.AnnouncementRepository).to(AnnouncementRepository);
  container.bind(TYPES.AlbumRepository).to(AlbumRepository);
  container.bind(TYPES.AuthService).to(AuthService);
  container.bind(TYPES.ContactService).to(ContactService);

  // Use real email when configured; otherwise log links to the console so
  // local dev needs no credentials (PRD section 8 + Group C plan).
  if (process.env.RESEND_API_KEY) {
    container.bind(TYPES.EmailService).to(ResendEmailService);
    // eslint-disable-next-line no-console
    console.log("[email] using Resend");
  } else {
    container.bind(TYPES.EmailService).to(ConsoleEmailService);
    // eslint-disable-next-line no-console
    console.log("[email] RESEND_API_KEY not set - logging links to console");
  }

  // Real media uploads via Cloudinary when configured; otherwise local disk.
  if (process.env.CLOUDINARY_URL) {
    container.bind(TYPES.StorageService).to(CloudinaryStorageService);
    // eslint-disable-next-line no-console
    console.log("[storage] using Cloudinary");
  } else {
    container.bind(TYPES.StorageService).to(LocalStorageService);
    // eslint-disable-next-line no-console
    console.log("[storage] CLOUDINARY_URL not set - storing uploads on local disk");
  }

  return container;
}
