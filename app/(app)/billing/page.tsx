import { listPaymentLogs } from "@/lib/data/billing";
import { getRevenueByPeriod, getRevenueSummary } from "@/lib/data/revenue";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { NewPaymentButton } from "@/components/billing/new-payment-button";
import { EditPaymentButton } from "@/components/billing/edit-payment-button";
import { DeletePaymentButton } from "@/components/billing/delete-payment-button";
import { RevenueOverview } from "@/components/billing/revenue-overview";
import { format } from "date-fns";

export default async function BillingPage() {
  const [paymentLogs, revenueByPeriod, revenueSummary, clients] = await Promise.all([
    listPaymentLogs(),
    getRevenueByPeriod(),
    getRevenueSummary(),
    listClientsForQuickCreate(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Revenue & Billing"
        actions={[
          {
            key: "new-payment",
            node: <NewPaymentButton clients={clients} />,
          },
        ]}
      />

      {/* Revenue Overview with Charts */}
      <RevenueOverview
        weeklyData={revenueByPeriod.weekly}
        monthlyData={revenueByPeriod.monthly}
        summary={revenueSummary}
      />

      {/* Payment Log */}
      <Card title="Recent Payments">
        <div className="space-y-4 text-sm text-neutral-600 dark:text-slate-300">
          {paymentLogs.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-brand-secondary dark:text-slate-200">
                  {payment.clientName}
                </p>
                <p className="text-xs uppercase text-neutral-500 dark:text-slate-400">
                  {payment.method} · {format(new Date(payment.date), "MMM d, yyyy")}
                </p>
                {payment.notes && (
                  <p className="mt-1 text-xs text-neutral-600 dark:text-slate-400">{payment.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-brand-secondary dark:text-slate-200">
                  {(payment.amount / 100).toLocaleString('en-US', { style: 'currency', currency: payment.currency })}
                </p>
                <EditPaymentButton payment={payment} />
                <DeletePaymentButton paymentId={payment.id} amount={payment.amount} currency={payment.currency} />
              </div>
            </div>
          ))}
          {paymentLogs.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-slate-400">No payments recorded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
