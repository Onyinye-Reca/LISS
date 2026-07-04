import { useEffect, useState } from "react";
import { AdminPaymentView, PaymentType } from "@liss11/shared";
import { getAllPayments } from "../../lib/payments-api";
import { Alert } from "../../components/ui";

const TYPE_LABELS: Record<PaymentType, string> = {
  DUES: "Dues",
  DONATION: "Donation",
};

const STATUS_CLASS: Record<string, string> = {
  SUCCESS: "text-success",
  PENDING: "text-gold",
  FAILED: "text-danger",
};

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<AdminPaymentView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllPayments()
      .then(setPayments)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load payments"));
  }, []);

  const totalReceived = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-maroon">Payments</h1>
        <span className="text-sm text-ink/60">
          Total received:{" "}
          <strong className="text-maroon">₦{totalReceived.toLocaleString()}</strong>
        </span>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-gold/20 bg-white">
        {payments.length === 0 ? (
          <p className="p-6 text-sm text-ink/50">No payments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Member</th>
                <th className="px-4 py-2">Purpose</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-gold/10">
                  <td className="px-4 py-2 text-ink/70">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-nearblack">{p.memberName}</div>
                    <div className="text-xs text-ink/50">{p.memberEmail}</div>
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
        )}
      </div>
    </div>
  );
}
