import { inject, injectable } from "inversify";
import { randomUUID } from "crypto";
import { Payment, PaymentType } from "@prisma/client";
import { TYPES } from "../types";
import {
  PaymentRepository,
  PaymentWithMember,
} from "../repositories/payment.repository";
import { MemberRepository } from "../repositories/member.repository";
import { PaystackService } from "./paystack.service";
import type { EmailService } from "./email.service";
import { captureError } from "../instrument";

@injectable()
export class PaymentService {
  constructor(
    @inject(TYPES.PaymentRepository) private repo: PaymentRepository,
    @inject(TYPES.PaystackService) private paystack: PaystackService,
    @inject(TYPES.MemberRepository) private members: MemberRepository,
    @inject(TYPES.EmailService) private email: EmailService,
  ) {}

  private webOrigin(): string {
    return process.env.WEB_ORIGIN ?? "http://localhost:5173";
  }

  /** Creates a PENDING payment and returns the Paystack checkout URL. */
  async initiate(
    memberId: string,
    type: PaymentType,
    amountNaira: number,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const member = await this.members.findById(memberId);
    if (!member) throw new Error("Member not found");

    const amountKobo = amountNaira * 100;
    const reference = `liss11_${randomUUID()}`;
    await this.repo.create({ memberId, type, amount: amountKobo, reference });

    const { authorizationUrl } = await this.paystack.initializeTransaction({
      email: member.email,
      amountKobo,
      reference,
      callbackUrl: `${this.webOrigin()}/pay/callback`,
    });
    return { authorizationUrl, reference };
  }

  /**
   * Handles a Paystack webhook. Signature-verified first, then idempotent: a
   * `charge.success` for an already-SUCCESS payment is a no-op, so Paystack's
   * retries can't double-count. The DB record - not the redirect - is the
   * source of truth for whether a payment settled.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    if (!this.paystack.verifyWebhookSignature(rawBody, signature)) {
      throw new Error("Invalid Paystack signature");
    }
    const event = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      data?: { reference?: string };
    };
    if (event.event !== "charge.success") return; // only settle on success
    const reference = event.data?.reference;
    if (!reference) return;

    const payment = await this.repo.findByReference(reference);
    if (!payment) return; // a reference we didn't create
    if (payment.status === "SUCCESS") return; // already handled - idempotent

    const updated = await this.repo.markStatus(reference, "SUCCESS");
    await this.sendReceipt(updated);
  }

  private async sendReceipt(payment: Payment): Promise<void> {
    const member = await this.members.findById(payment.memberId);
    if (!member) return;
    try {
      await this.email.sendPaymentReceipt(member.email, {
        typeLabel: payment.type === "DUES" ? "Dues payment" : "Donation",
        amountNaira: payment.amount / 100,
        reference: payment.reference,
        dateLabel: new Date().toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        viewUrl: `${this.webOrigin()}/pay`,
      });
    } catch (err) {
      // Receipt is best-effort; the payment is already recorded.
      captureError(err);
    }
  }

  listForMember(memberId: string): Promise<Payment[]> {
    return this.repo.listForMember(memberId);
  }

  listAll(): Promise<PaymentWithMember[]> {
    return this.repo.listAll();
  }
}
