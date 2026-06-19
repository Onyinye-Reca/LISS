import { inject, injectable } from "inversify";
import { PrismaClient, ContactMessage } from "@prisma/client";
import { TYPES } from "../types";

/** Data access for contact-form submissions. */
@injectable()
export class ContactMessageRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  create(data: {
    name: string;
    email: string;
    message: string;
  }): Promise<ContactMessage> {
    return this.prisma.contactMessage.create({ data });
  }

  // Newest first, for the admin inbox.
  list(): Promise<ContactMessage[]> {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  delete(id: string): Promise<ContactMessage> {
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}
