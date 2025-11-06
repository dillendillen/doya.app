import { SessionStatus, DogStatus } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type DogListItem = {
  id: string;
  name: string;
  photoUrl: string | null;
  breed: string | null;
  sex: "M" | "F";
  status: "in_training" | "hold" | "prospect" | "done";
  tags: string[];
  dob: string | null;
  lastSessionDate: string | null;
  clientName: string;
  activePlanName: string | null;
};

export type DogDetailPlanMilestone = {
  id: string;
  title: string;
  criteria: string;
  done: boolean;
  completedAt: string | null;
};

export type DogDetailPlan = {
  id: string;
  templateName: string;
  status: "active" | "paused" | "completed";
  assignedOn: string;
  milestones: DogDetailPlanMilestone[];
};

export type DogDetailSession = {
  id: string;
  datetime: string;
  status: "scheduled" | "in_progress" | "done";
  location: string;
  durationMin: number;
  trainerId: string;
  trainerName: string;
  objectives: string[];
  scorecards: Array<Record<string, unknown>>;
  notes: string | null;
};

export type DogDetailMedia = {
  id: string;
  url: string;
  thumbUrl: string | null;
  consentScope: "internal" | "share_later";
  uploadedAt: string;
};

export type DogDetailTimelineEntry = {
  id: string;
  type: string;
  occurredAt: string;
  title: string;
  summary: string | null;
};

export type DogDetailNote = {
  id: string;
  body: string;
  createdAt: string;
};

export type DogDetail = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  photoUrl: string | null;
  breed: string | null;
  sex: "M" | "F";
  dob: string | null;
  weightKg: number | null;
  medicalFlags: string[];
  triggers: string[];
  tags: string[];
  consentInternal: boolean;
  consentShareLater: boolean;
  activePlanId: string | null;
  lastSessionDate: string | null;
  plans: DogDetailPlan[];
  sessions: DogDetailSession[];
  media: DogDetailMedia[];
  timeline: DogDetailTimelineEntry[];
  notes: DogDetailNote[];
};

export type DogQuickPick = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
};

const SESSION_STATUS_MAP: Record<SessionStatus, DogDetailSession["status"]> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

const DOG_STATUS_MAP: Record<DogStatus, DogListItem["status"]> = {
  IN_TRAINING: "in_training",
  HOLD: "hold",
  PROSPECT: "prospect",
  DONE: "done",
};

function planStatusToLabel(status: string): DogDetailPlan["status"] {
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

export async function listDogs(): Promise<DogListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.dog.findMany({
    include: {
      client: { select: { name: true } },
      activePlan: { select: { templateName: true } },
      sessions: {
        select: { startTime: true },
        orderBy: { startTime: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((dog) => ({
    id: dog.id,
    name: dog.name,
    photoUrl: dog.photoUrl,
    breed: dog.breed,
    sex: dog.sex,
    dob: dog.dob?.toISOString() ?? null,
    status: DOG_STATUS_MAP[dog.status],
    tags: dog.tags,
    lastSessionDate: dog.sessions[0]?.startTime?.toISOString() ?? null,
    clientName: dog.client?.name ?? "Unknown",
    activePlanName: dog.activePlan?.templateName ?? null,
  }));
}

export async function listDogsForQuickCreate(): Promise<DogQuickPick[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.dog.findMany({
    select: {
      id: true,
      name: true,
      client: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((dog) => ({
    id: dog.id,
    name: dog.name,
    clientId: dog.client?.id ?? null,
    clientName: dog.client?.name ?? "Unassigned",
  }));
}

export async function getDogById(id: string): Promise<DogDetail | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const dog = await prisma.dog.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      plans: {
        orderBy: { assignedOn: "desc" },
        include: {
          milestones: {
            orderBy: { order: "asc" },
          },
        },
      },
      sessions: {
        orderBy: { startTime: "desc" },
        take: 15,
        include: {
          trainer: { select: { id: true, name: true } },
        },
      },
      media: {
        orderBy: { uploadedAt: "desc" },
        take: 12,
      },
      timeline: {
        orderBy: { occurredAt: "desc" },
        take: 20,
      },
    },
  });

  if (!dog) {
    return null;
  }

  const plans: DogDetailPlan[] = dog.plans.map((plan) => ({
    id: plan.id,
    templateName: plan.templateName,
    status: planStatusToLabel(plan.status),
    assignedOn: plan.assignedOn.toISOString(),
    milestones: plan.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      criteria: milestone.criteria,
      done: milestone.done,
      completedAt: milestone.completedAt?.toISOString() ?? null,
    })),
  }));

  const sessions: DogDetailSession[] = dog.sessions.map((session) => ({
    id: session.id,
    datetime: session.startTime.toISOString(),
    status: SESSION_STATUS_MAP[session.status],
    location: session.location,
    durationMin: session.durationMinutes,
    trainerId: session.trainerId,
    trainerName: session.trainer?.name ?? "Unknown",
    objectives: session.objectives,
    scorecards: Array.isArray(session.scorecards)
      ? (session.scorecards as Array<Record<string, unknown>>)
      : session.scorecards
        ? [session.scorecards as Record<string, unknown>]
        : [],
    notes: session.notes,
  }));

  const media: DogDetailMedia[] = dog.media.map((asset) => ({
    id: asset.id,
    url: asset.url,
    thumbUrl: asset.thumbUrl,
    consentScope:
      asset.consentScope === "SHARE_LATER" ? "share_later" : "internal",
    uploadedAt: asset.uploadedAt.toISOString(),
  }));

  const timeline: DogDetailTimelineEntry[] = dog.timeline.map((entry) => ({
    id: entry.id,
    type: entry.entryType,
    occurredAt: entry.occurredAt.toISOString(),
    title: entry.title,
    summary: entry.summary,
  }));

  // Filter out behavior logs (they start with [BEHAVIOR]) and objective logs (they start with [OBJECTIVE])
  // These are handled separately in the BehaviorJournal and TrainingObjectivesMatrix components
  const notes: DogDetailNote[] = dog.logs
    .filter((entry) => !entry.summary.startsWith("[BEHAVIOR]") && !entry.summary.startsWith("[OBJECTIVE]"))
    .map((entry) => ({
      id: entry.id,
      body: entry.summary,
      createdAt: entry.createdAt.toISOString(),
    }));

  return {
    id: dog.id,
    name: dog.name,
    clientId: dog.clientId,
    clientName: dog.client?.name ?? "Unknown",
    photoUrl: dog.photoUrl,
    breed: dog.breed,
    sex: dog.sex,
    dob: dog.dob?.toISOString() ?? null,
    weightKg: dog.weightKg,
    medicalFlags: dog.medicalFlags,
    triggers: dog.triggers,
    tags: dog.tags,
    consentInternal: dog.consentInternal,
    consentShareLater: dog.consentShareLater,
    activePlanId: dog.activePlanId,
    lastSessionDate: dog.sessions[0]?.startTime?.toISOString() ?? null,
    plans,
    sessions,
    media,
    timeline,
    notes,
  };
}


