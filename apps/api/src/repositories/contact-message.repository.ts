import { inject, injectable } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "../types";

type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};

type ContactMessageDelegate = {
  create(args: {
    data: { name: string; email: string; message: string };
  }): Promise<ContactMessageRecord>;
};

/** Data access for contact-form submissions. */
@injectable()
export class ContactMessageRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  private get store(): ContactMessageDelegate {
    return (this.prisma as unknown as { contactMessage: ContactMessageDelegate })
      .contactMessage;
  }

  create(data: {
    name: string;
    email: string;
    message: string;
  }): Promise<ContactMessageRecord> {
    return this.store.create({ data });
  }
}
