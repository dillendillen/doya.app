import { PlanStatus } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type PlanListItem = {
  id: string;
  dogName: string;
  templateName: string;
  status: "active" | "paused" | "completed";
  progress: number;
};

export type PlanMilestone = {
  id: string;
  title: string;
  criteria: string;
  done: boolean;
  completedAt: string | null;
};

export type PlanDetail = {
  id: string;
  dogId: string;
  templateName: string;
  status: "active" | "paused" | "completed";
  assignedOn: string;
  milestones: PlanMilestone[];
};

function mapStatus(status: PlanStatus): PlanListItem["status"] {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    case "COMPLETED":
      return "completed";
    default:
      return "active";
  }
}

export async function listPlans(): Promise<PlanListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.trainingPlan.findMany({
    include: {
      dog: { select: { name: true } },
      milestones: true,
    },
    orderBy: { assignedOn: "desc" },
  });

  return rows.map((plan) => {
    const total = plan.milestones.length;
    const completed = plan.milestones.filter((milestone) => milestone.done).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      id: plan.id,
      dogName: plan.dog?.name ?? "Unknown",
      templateName: plan.templateName,
      status: mapStatus(plan.status),
      progress,
    };
  });
}

export async function getPlanById(id: string): Promise<PlanDetail | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const plan = await prisma.trainingPlan.findUnique({
    where: { id },
    include: {
      milestones: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!plan) {
    return null;
  }

  return {
    id: plan.id,
    dogId: plan.dogId,
    templateName: plan.templateName,
    status: mapStatus(plan.status),
    assignedOn: plan.assignedOn.toISOString(),
    milestones: plan.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      criteria: milestone.criteria,
      done: milestone.done,
      completedAt: milestone.completedAt?.toISOString() ?? null,
    })),
  };
}
