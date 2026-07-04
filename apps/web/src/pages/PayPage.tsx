import { FormEvent, useEffect, useState } from "react";
import { PaymentView, PaymentType, PAYMENT_TYPES } from "@liss11/shared";
import { initializePayment, getMyPayments } from "../lib/payments-api";
import { Button, TextField, SelectField, Alert } from "../components/ui";

const TYPE_LABELS: Record<PaymentType, string> = {
  DUES: "Membership dues",
  DONATION: "Donation",
};

const STATUS_CLASS: Record<string, string> = {
  SUCCESS: "text-success",
  PENDING: "text-gold",
  FAILED: "text-danger",
};

export default function PayPage() {
  const [type, setType] = useState<PaymentType>("DUES");
  const [amount, setAmount] = useState("5000");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<PaymentView[]>([]);

  useEffect(() => {
    getMyPayments()
      .then(setHistory)
      .catch(() => {
        /* history is best-effort */
      });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const naira = Number(amount);
    if (!Number.isInteger(naira) || naira < 100) {
      setError("Enter a whole amount of at least ₦100.");
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await initializePayment({ type, amount: naira });
      // Hand off to Paystack's hosted checkout.
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-maroon">Dues &amp; Donations</h1>
      <p className="mt-2 text-ink/60">
        Pay your membership dues or make a donation to the association. Payments
        are processed securely by Paystack.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-xl border border-gold/30 bg-white p-6"
      >
        {error && <Alert>{error}</Alert>}
        <SelectField
          label="Purpose"
          value={type}
          onChange={(e) => setType(e.target.value as PaymentType)}
        >
          {PAYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Amount (₦)"
          type="number"
          min={100}
          step={1}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Starting payment…" : "Continue to payment"}
        </Button>
      </form>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-maroon">Your payments</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gold/20 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-card text-left text-xs uppercase text-ink/60">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Purpose</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-t border-gold/10">
                    <td className="px-4 py-2 text-ink/70">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-2">₦{p.amount.toLocaleString()}</td>
                    <td className={`px-4 py-2 font-medium ${STATUS_CLASS[p.status] ?? ""}`}>
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
