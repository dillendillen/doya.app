import { dogs, plans } from "../mock-data";
import type { Plan } from "../types";

export type PlanListItem = {
  id: string;
  dogName: string;
  templateName: string;
  status: Plan["status"];
  progress: number;
};

export function listPlans(): PlanListItem[] {
  return plans
    .slice()
    .sort((a, b) => b.assignedOn.localeCompare(a.assignedOn))
    .map<PlanListItem>((plan) => {
      const dog = dogs.find((d) => d.id === plan.dogId);
      const total = plan.milestones.length;
      const completed = plan.milestones.filter((m) => m.done).length;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      return {
        id: plan.id,
        dogName: dog?.name ?? "Unknown",
        templateName: plan.templateName,
        status: plan.status,
        progress,
      };
    });
}

export function getPlanById(id: string): Plan | null {
  const plan = plans.find((entry) => entry.id === id);
  return plan ?? null;
}
