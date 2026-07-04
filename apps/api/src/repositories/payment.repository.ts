import { inject, injectable } from "inversify";
import {
  PrismaClient,
  Payment,
  PaymentType,
  PaymentStatus,
  Member,
} from "@prisma/client";
import { TYPES } from "../types";

export type PaymentWithMember = Payment & { member: Member };

@injectable()
export class PaymentRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  create(data: {
    memberId: string;
    type: PaymentType;
    amount: number; // kobo
    reference: string;
  }): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  findByReference(reference: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { reference } });
  }

  markStatus(reference: string, status: PaymentStatus): Promise<Payment> {
    return this.prisma.payment.update({ where: { reference }, data: { status } });
  }

  listForMember(memberId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    });
  }

  listAll(): Promise<PaymentWithMember[]> {
    return this.prisma.payment.findMany({
      include: { member: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
