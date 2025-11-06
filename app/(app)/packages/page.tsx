import { listPackages, listPackageTemplates } from "@/lib/data/billing";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewPackageButton } from "@/components/billing/new-package-button";
import { EditPackageTemplateButton } from "@/components/billing/edit-package-template-button";
import { DeletePackageTemplateButton } from "@/components/billing/delete-package-template-button";
import { format } from "date-fns";

export default async function PackagesPage() {
  const [packages, clients, templates] = await Promise.all([
    listPackages(),
    listClientsForQuickCreate(),
    listPackageTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Package Management"
        actions={[
          {
            key: "new-package-template",
            node: <NewPackageButton clients={clients} isTemplate={true} />,
          },
          {
            key: "new-package",
            node: <NewPackageButton clients={clients} />,
          },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Package Templates">
          <div className="space-y-3 text-sm text-neutral-600 mb-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-brand-secondary dark:text-slate-200">
                      {template.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-slate-400">
                      {template.sessionCount} sessions · {(template.priceCents / 100).toLocaleString('en-US', { style: 'currency', currency: template.currency })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditPackageTemplateButton template={template} />
                    <DeletePackageTemplateButton templateId={template.id} templateName={template.name} />
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-slate-400">No package templates created yet.</p>
            )}
          </div>
        </Card>

        <Card title="Client Packages">
          <div className="space-y-4 text-sm text-neutral-600 dark:text-slate-300">
            {packages.map((pkg) => {
              const isExpired = pkg.expiresOn && new Date(pkg.expiresOn) < new Date();
              const isLow = pkg.sessionsRemaining <= 1 && !isExpired;
              const status = isExpired ? "expired" : isLow ? "low" : pkg.sessionsRemaining === 0 ? "empty" : "active";
              
              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl border p-4 ${
                    isExpired
                      ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      : isLow
                        ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                        : "border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-brand-secondary dark:text-slate-200">
                        {pkg.templateName}
                      </p>
                      <p className="text-xs uppercase text-neutral-500 dark:text-slate-400">
                        {pkg.clientName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        status === "expired"
                          ? "danger"
                          : status === "low"
                            ? "warning"
                            : status === "empty"
                              ? "muted"
                              : "success"
                      }
                    >
                      {status === "expired"
                        ? "Expired"
                        : status === "empty"
                          ? "Empty"
                          : status === "low"
                            ? "Low"
                            : "Active"}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs space-y-1">
                    <p className="dark:text-slate-300">
                      <span className="font-semibold">{pkg.sessionsRemaining}</span> session{pkg.sessionsRemaining !== 1 ? "s" : ""} remaining
                    </p>
                    <p className="text-neutral-500 dark:text-slate-400">
                      Balance: {(pkg.priceRemaining / 100).toLocaleString('en-US', { style: 'currency', currency: pkg.currency })}
                      {" "}of {(pkg.pricePaid / 100).toLocaleString('en-US', { style: 'currency', currency: pkg.currency })}
                    </p>
                    {pkg.expiresOn && (
                      <p className="text-neutral-500 dark:text-slate-400">
                        Expires {format(new Date(pkg.expiresOn), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  {isLow && !isExpired && (
                    <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                      ⚠️ Renewal reminder: Package running low
                    </p>
                  )}
                </div>
              );
            })}
            {packages.length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-slate-400">No packages assigned to clients yet.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

