"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@/components/ui/icons";

type PaymentLogItem = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  notes?: string | null;
};

type EditPaymentButtonProps = {
  payment: PaymentLogItem;
};

export function EditPaymentButton({ payment }: EditPaymentButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState((payment.amount / 100).toFixed(2));
  const [currency, setCurrency] = useState(payment.currency);
  const [method, setMethod] = useState(payment.method);
  const [notes, setNotes] = useState(payment.notes || "");

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          method,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to update payment");
      }
    } catch (error) {
      console.error("Failed to update payment", error);
      alert("Failed to update payment");
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">Payment Method</label>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="rounded-lg border border-current bg-white/50 p-2 opacity-70 transition hover:opacity-100"
      title="Edit payment"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  );
}

