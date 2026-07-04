import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyPayments } from "../lib/payments-api";
import { Alert } from "../components/ui";

type State = "checking" | "success" | "pending";

/**
 * Landing page Paystack redirects to after checkout. The webhook is the source
 * of truth for settlement, so we poll the member's payments a few times to see
 * the reference flip to SUCCESS, then fall back to a "confirming shortly" note.
 */
export default function PayCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (!reference) {
      setState("pending");
      return;
    }
    let active = true;
    let tries = 0;
    const check = async () => {
      try {
        const payments = await getMyPayments();
        const p = payments.find((x) => x.reference === reference);
        if (p?.status === "SUCCESS") {
          if (active) setState("success");
          return;
        }
      } catch {
        /* ignore and retry */
      }
      tries += 1;
      if (active && tries < 5) setTimeout(check, 2000);
      else if (active) setState("pending");
    };
    void check();
    return () => {
      active = false;
    };
  }, [reference]);

  const heading =
    state === "success"
      ? "Payment confirmed"
      : state === "checking"
        ? "Confirming your payment…"
        : "Payment received";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-maroon">{heading}</h1>
      <div className="mt-6 text-left">
        <Alert kind={state === "success" ? "success" : "error"}>
          {state === "success"
            ? "Thank you! Your payment has been confirmed and a receipt is on its way to your email."
            : state === "checking"
              ? "Please wait a moment while we confirm your payment with Paystack."
              : "Thanks — we've received your payment and will confirm it shortly. Your receipt will arrive by email once it settles."}
        </Alert>
      </div>
      <Link
        to="/pay"
        className="mt-8 inline-block font-semibold text-maroon underline"
      >
        Back to Dues &amp; Donations
      </Link>
    </div>
  );
}
