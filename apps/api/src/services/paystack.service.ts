import { injectable } from "inversify";
import { createHmac, timingSafeEqual } from "crypto";

export interface PaystackInitParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}

/**
 * Thin wrapper over the Paystack REST API. The secret key is read lazily so the
 * app still boots when payments aren't configured; the methods then throw and
 * the controller surfaces a 503. The webhook signature is the sole authenticator
 * for incoming Paystack events (they carry no session).
 */
@injectable()
export class PaystackService {
  private secretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
    return key;
  }

  /** Starts a transaction and returns the hosted checkout URL to redirect to. */
  async initializeTransaction(
    p: PaystackInitParams,
  ): Promise<{ authorizationUrl: string }> {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: p.email,
        amount: p.amountKobo, // Paystack expects the smallest unit (kobo)
        reference: p.reference,
        callback_url: p.callbackUrl,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };
    if (!res.ok || !body.status || !body.data?.authorization_url) {
      throw new Error(`Paystack init failed: ${body.message ?? res.status}`);
    }
    return { authorizationUrl: body.data.authorization_url };
  }

  /**
   * Verifies the `x-paystack-signature` header: HMAC-SHA512 of the raw request
   * body keyed by the secret key. Timing-safe. Returns false if unconfigured.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature) return false;
    let expected: string;
    try {
      expected = createHmac("sha512", this.secretKey()).update(rawBody).digest("hex");
    } catch {
      return false; // not configured
    }
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
