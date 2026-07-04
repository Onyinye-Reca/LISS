import { Response } from "express";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { inject } from "inversify";
import {
  PaymentInitSchema,
  PaymentView,
  AdminPaymentView,
  Role,
} from "@liss11/shared";
import { Payment } from "@prisma/client";
import { TYPES } from "../types";
import { PaymentService } from "../services/payment.service";
import { PaymentWithMember } from "../repositories/payment.repository";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { captureError } from "../instrument";

function toView(p: Payment): PaymentView {
  return {
    id: p.id,
    type: p.type,
    amount: p.amount / 100, // kobo -> naira
    reference: p.reference,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

function toAdminView(p: PaymentWithMember): AdminPaymentView {
  return {
    ...toView(p),
    memberName: `${p.member.firstName} ${p.member.lastName}`,
    memberEmail: p.member.email,
  };
}

// Financial data is admin-only (never editors).
const financeGuards = [requireAuth, requireRole(Role.ADMIN, Role.SUPER_ADMIN)] as const;

@controller("/payments")
export class PaymentController {
  constructor(@inject(TYPES.PaymentService) private service: PaymentService) {}

  // Any logged-in member can start a dues/donation payment.
  @httpPost("/initialize", requireAuth, validateBody(PaymentInitSchema))
  async initialize(req: AuthedRequest, res: Response) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res
        .status(503)
        .json({ error: "Payments are not available right now." });
    }
    try {
      const { authorizationUrl, reference } = await this.service.initiate(
        req.auth!.memberId,
        req.body.type,
        req.body.amount,
      );
      res.json({ authorizationUrl, reference });
    } catch (err) {
      captureError(err);
      res.status(502).json({ error: "Could not start payment. Please try again." });
    }
  }

  // Paystack -> our server. No session; authenticated by the signature. This
  // route is CSRF-exempt (see EXEMPT_PREFIXES in middleware/csrf.ts) and reads
  // the raw request body captured in server.ts.
  @httpPost("/webhook")
  async webhook(req: AuthedRequest, res: Response) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) return res.sendStatus(400);
    try {
      await this.service.handleWebhook(rawBody, req.get("x-paystack-signature"));
      res.sendStatus(200);
    } catch (err) {
      captureError(err);
      res.sendStatus(400);
    }
  }

  // A member's own payment history.
  @httpGet("/me", requireAuth)
  async mine(req: AuthedRequest, res: Response) {
    const payments = await this.service.listForMember(req.auth!.memberId);
    res.json({ payments: payments.map(toView) });
  }

  // All payments, for the admin finance view.
  @httpGet("/", ...financeGuards)
  async all(_req: AuthedRequest, res: Response) {
    const payments = await this.service.listAll();
    res.json({ payments: payments.map(toAdminView) });
  }
}
