"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeletePaymentButtonProps = {
  paymentId: string;
  amount: number;
  currency: string;
};

export function DeletePaymentButton({ paymentId, amount, currency }: DeletePaymentButtonProps) {
  const amountFormatted = (amount / 100).toLocaleString("en-US", { style: "currency", currency });
  return (
    <DeleteButton
      endpoint={`/api/payments/${paymentId}`}
      confirmMessage={`Delete payment of ${amountFormatted}? This action cannot be undone.`}
      title="Delete payment"
    />
  );
}

