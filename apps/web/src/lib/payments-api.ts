import {
  PaymentInitInput,
  PaymentView,
  AdminPaymentView,
  DuesStatusView,
} from "@liss11/shared";
import { apiFetch } from "./api";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const d = (await res.json()) as { error?: string };
    return d.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** Starts a payment; returns the Paystack checkout URL to redirect to. */
export async function initializePayment(
  input: PaymentInitInput,
): Promise<{ authorizationUrl: string; reference: string }> {
  const res = await apiFetch("/payments/initialize", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Could not start payment"));
  return (await res.json()) as { authorizationUrl: string; reference: string };
}

/** The logged-in member's own payment history. */
export async function getMyPayments(): Promise<PaymentView[]> {
  const res = await apiFetch("/payments/me");
  if (!res.ok) throw new Error(await errorMessage(res, "Failed to load payments"));
  return ((await res.json()) as { payments: PaymentView[] }).payments;
}

/** All payments (admin finance view). */
export async function getAllPayments(): Promise<AdminPaymentView[]> {
  const res = await apiFetch("/payments");
  if (!res.ok) throw new Error(await errorMessage(res, "Failed to load payments"));
  return ((await res.json()) as { payments: AdminPaymentView[] }).payments;
}

/** The logged-in member's dues status for the current year. */
export async function getDuesStatus(): Promise<DuesStatusView> {
  const res = await apiFetch("/payments/dues-status");
  if (!res.ok) throw new Error(await errorMessage(res, "Failed to load dues status"));
  return ((await res.json()) as { status: DuesStatusView }).status;
}
