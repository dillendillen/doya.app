import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getPlanById } from "@/lib/data/plans";
import { getDogById } from "@/lib/data/dogs";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type PlanDetailPageProps = {
  params: { id: string };
};

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const plan = await getPlanById(params.id);

  if (!plan) {
    notFound();
  }

  const dog = await getDogById(plan.dogId);

  return (
    <div className="space-y-6">
      <TopBar
        title={`Plan · ${plan.templateName}`}
        actions={[
          { label: "Add Milestone" },
          { label: "Edit Plan" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card title="Dog">
          {dog ? (
            <div className="space-y-2 text-sm text-neutral-600">
              <p className="text-base font-semibold text-brand-secondary">
                {dog.name}
              </p>
              <p>{dog.breed ?? "—"}</p>
              <p className="text-xs uppercase text-neutral-500">
                Client{" "}
                <Link
                  href={`/clients/${dog.clientId}`}
                  className="text-brand-secondary"
                >
                  {dog.clientName}
                </Link>
              </p>
              <p className="text-xs uppercase text-neutral-500">
                Assigned {format(parseISO(plan.assignedOn), "MMM d, yyyy")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Dog record unavailable.</p>
          )}
        </Card>

        <Card title="Milestones">
          <ul className="space-y-3 text-sm text-neutral-600">
            {plan.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-brand-secondary">
                    {milestone.title}
                  </p>
                  <Badge variant={milestone.done ? "success" : "muted"}>
                    {milestone.done ? "Complete" : "Open"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  {milestone.criteria}
                </p>
                {milestone.completedAt && (
                  <p className="mt-2 text-xs uppercase text-neutral-500">
                    Completed {format(parseISO(milestone.completedAt), "MMM d, yyyy")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
