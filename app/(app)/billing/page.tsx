import { listPackages, listInvoices } from "@/lib/data/billing";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  const packages = listPackages();
  const invoices = listInvoices();

  return (
    <div className="space-y-6">
      <TopBar
        title="Packages & Billing"
        actions={[
          { label: "New Package" },
          { label: "Export CSV" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Packages">
          <div className="space-y-4 text-sm text-neutral-600">
            {packages.map((pkg) => {
              const creditsLeft = pkg.totalCredits - pkg.usedCredits;
              return (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-secondary">
                      {pkg.type}
                    </p>
                    <Badge
                      variant={creditsLeft <= 1 ? "warning" : "muted"}
                    >
                      {creditsLeft} credits left
                    </Badge>
                  </div>
                  <p className="text-xs uppercase text-neutral-500">
                    Total {pkg.totalCredits} · Used {pkg.usedCredits}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {pkg.expiresOn
                      ? `Expires ${new Date(pkg.expiresOn).toLocaleDateString()}`
                      : "No expiry"}
                  </p>
                </div>
              );
            })}
            {packages.length === 0 && (
              <p className="text-sm text-neutral-500">No packages yet.</p>
            )}
          </div>
        </Card>

        <Card title="Invoices">
          <div className="space-y-4 text-sm text-neutral-600">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
              >
                <div>
                  <p className="font-semibold text-brand-secondary">
                    #{invoice.id.slice(0, 6).toUpperCase()}
                  </p>
                  <p className="text-xs uppercase text-neutral-500">
                    {invoice.status} ·{" "}
                    {invoice.issuedOn
                      ? new Date(invoice.issuedOn).toLocaleDateString()
                      : "Draft"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-brand-secondary">
                  {(invoice.total / 100).toFixed(2)} {invoice.currency}
                </p>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-sm text-neutral-500">No invoices issued yet.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
