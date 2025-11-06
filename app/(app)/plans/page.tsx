import Link from "next/link";
import { listPlans } from "@/lib/data/plans";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <TopBar
        title="Plans"
        actions={[
          { label: "Assign Plan" },
          { label: "Manage Templates" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-secondary">
                  {plan.templateName}
                </p>
                <p className="text-xs uppercase text-neutral-500">
                  {plan.dogName}
                </p>
              </div>
              <Badge
                variant={
                  plan.status === "completed"
                    ? "success"
                    : plan.status === "paused"
                      ? "warning"
                      : "muted"
                }
              >
                {plan.status}
              </Badge>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-brand-primary"
                  style={{ width: `${plan.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs uppercase text-neutral-500">
                Progress {plan.progress}%
              </p>
            </div>
            <Link
              href={`/plans/${plan.id}`}
              className="mt-3 inline-flex text-sm font-medium text-brand-secondary"
            >
              View plan →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
