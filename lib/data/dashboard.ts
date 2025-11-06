import {
  ConsentScope,
  InvoiceStatus,
  SessionStatus,
  TaskPriority,
  TaskStatus,
  WatchlistPin,
} from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type DashboardSession = {
  id: string;
  dogId: string;
  startTime: string;
  dogName: string;
  clientName: string;
  location: string;
  status: "scheduled" | "in_progress" | "done";
};

export type DashboardTask = {
  id: string;
  title: string;
  due: string | null;
  status: "inbox" | "doing" | "waiting" | "done";
  priority: "low" | "medium" | "high";
  relatedType: "dog" | "session" | "client";
  relatedId: string;
  dogName: string | null;
};

export type DashboardPackage = {
  clientId: string;
  clientName: string;
  packageType: string;
  creditsLeft: number;
};

export type DashboardDog = {
  dogId: string;
  dogName: string;
  updatedAt: string | null;
};

export type DashboardFocusTag = {
  tag: string;
  dogCount: number;
  percentage: number;
};

export type DashboardPlanInsight = {
  planId: string;
  dogId: string;
  dogName: string;
  templateName: string;
  completedMilestones: number;
  totalMilestones: number;
  progressPercent: number;
  nextMilestoneTitle: string | null;
  nextMilestoneCriteria: string | null;
  lastCompletedAt: string | null;
};

export type DashboardTravel = {
  totalTravelMinutes: number;
  totalBufferMinutes: number;
  leaveBy: string | null;
};

export type DashboardStats = {
  totalDogs: number;
  activePlans: number;
  sessionsToday: number;
  bookedMinutesThisWeek: number;
  capacityMinutesThisWeek: number;
  cancellationsThisWeek: number;
  revenueMonthToDate: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesTotal: number;
  primaryCurrency: string;
};

export type DashboardActionQueueItem = {
  id: string;
  type: "invoice" | "document" | "task" | "media" | "booking";
  title: string;
  detail: string;
  due: string | null;
  severity: "low" | "medium" | "high";
};

export type DashboardRecentActivityItem = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string | null;
};

export type DashboardWatchlistItem = {
  id: string;
  entityType: "dog" | "client";
  name: string;
  tags: string[];
  reason: string;
  lastInteractionAt: string | null;
};

export type DashboardObjective = {
  dogId: string;
  dogName: string;
  skill: string;
  status: "planned" | "in_progress" | "mastered";
  id: string;
};

export type DashboardData = {
  sessions: DashboardSession[];
  travel: DashboardTravel;
  tasksDue: DashboardTask[];
  lowPackages: DashboardPackage[];
  recentDogs: DashboardDog[];
  stats: DashboardStats;
  focusTags: DashboardFocusTag[];
  planInsights: DashboardPlanInsight[];
  actionQueue: DashboardActionQueueItem[];
  recentActivity: DashboardRecentActivityItem[];
  watchlist: DashboardWatchlistItem[];
  objectives: DashboardObjective[];
};

const SESSION_STATUS_MAP: Record<SessionStatus, DashboardSession["status"]> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

const TASK_STATUS_MAP: Record<TaskStatus, DashboardTask["status"]> = {
  INBOX: "inbox",
  DOING: "doing",
  WAITING: "waiting",
  DONE: "done",
};

const TASK_PRIORITY_MAP: Record<TaskPriority, DashboardTask["priority"]> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const CONSENT_SCOPE_MAP: Record<ConsentScope, "internal" | "share_later"> = {
  INTERNAL: "internal",
  SHARE_LATER: "share_later",
};

const ACTION_SEVERITY_WEIGHT: Record<DashboardActionQueueItem["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const EMPTY_DASHBOARD: DashboardData = {
  sessions: [],
  travel: {
    totalTravelMinutes: 0,
    totalBufferMinutes: 0,
    leaveBy: null,
  },
  tasksDue: [],
  lowPackages: [],
  recentDogs: [],
  stats: {
    totalDogs: 0,
    activePlans: 0,
    sessionsToday: 0,
    bookedMinutesThisWeek: 0,
    capacityMinutesThisWeek: 0,
    cancellationsThisWeek: 0,
    revenueMonthToDate: 0,
    outstandingInvoicesCount: 0,
    outstandingInvoicesTotal: 0,
    primaryCurrency: "EUR",
  },
  focusTags: [],
  planInsights: [],
  actionQueue: [],
  recentActivity: [],
  watchlist: [],
  objectives: [],
};

function parseIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const diff = (start.getDay() + 6) % 7;
  return addDays(start, -diff);
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setUTCDate(1);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function parseTimeToMinutes(value: string) {
  if (!value.includes(":")) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function formatCurrency(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getDashboardData(
  dateIso: string,
  trainerId?: string,
): Promise<DashboardData> {
  if (!isDatabaseConfigured()) {
    return EMPTY_DASHBOARD;
  }

  const referenceDate = parseIso(dateIso) ?? new Date();
  const dayStart = startOfDay(referenceDate);
  const dayEndExclusive = addDays(dayStart, 1);
  const weekStart = startOfWeek(referenceDate);
  const weekEndExclusive = addDays(weekStart, 7);
  const monthStart = startOfMonth(referenceDate);
  const monthEndExclusive = addMonths(monthStart, 1);

  try {
    const [
      sessionsTodayRaw,
      sessionsWeekRaw,
      tasksRaw,
      packagesRaw,
      dogsRaw,
      plansRaw,
      invoicesRaw,
      mediaRaw,
      documentsRaw,
      auditRaw,
      watchPinsRaw,
      availabilityRaw,
      latestSessionsRaw,
      clientsRaw,
      objectiveLogsRaw,
    ] = await Promise.all([
      prisma.session.findMany({
        where: {
          startTime: {
            gte: dayStart,
            lt: dayEndExclusive,
          },
          ...(trainerId ? { trainerId } : {}),
        },
        include: {
          dog: {
            select: {
              id: true,
              name: true,
              client: { select: { id: true, name: true } },
            },
          },
          client: { select: { id: true, name: true } },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.session.findMany({
        where: {
          startTime: {
            gte: weekStart,
            lt: weekEndExclusive,
          },
          ...(trainerId ? { trainerId } : {}),
        },
        include: {
          dog: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.task.findMany({
        include: {
          relatedDog: { select: { id: true, name: true } },
          relatedSession: {
            select: {
              id: true,
              dogId: true,
              dog: { select: { id: true, name: true } },
            },
          },
          relatedClient: { select: { id: true, name: true } },
        },
      }),
      prisma.package.findMany({
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.dog.findMany({
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.trainingPlan.findMany({
        include: {
          dog: { select: { id: true, name: true } },
          milestones: { orderBy: { order: "asc" } },
        },
      }),
      prisma.invoice.findMany({
        include: {
          client: { select: { id: true, name: true } },
          payments: true,
        },
      }),
      prisma.mediaAsset.findMany({
        include: {
          dog: { select: { id: true, name: true } },
        },
      }),
      prisma.clientDocument.findMany({
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { actor: { select: { id: true, name: true } } },
      }),
      prisma.watchlistPin.findMany({
        include: {
          dog: { select: { id: true, name: true, tags: true, medicalFlags: true, updatedAt: true } },
          client: { select: { id: true, name: true, updatedAt: true } },
        },
      }),
      prisma.availabilitySlot.findMany(),
      prisma.session.findMany({
        select: { dogId: true, startTime: true },
        orderBy: { startTime: "desc" },
        take: 500,
      }),
      prisma.client.findMany({ select: { id: true, name: true } }),
      prisma.dogLog.findMany({
        where: {
          summary: {
            startsWith: "[OBJECTIVE]",
          },
        },
        include: {
          dog: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 100,
      }),
    ]);

    const dogNameById = new Map<string, string>();
    dogsRaw.forEach((dog) => {
      dogNameById.set(dog.id, dog.name);
    });

    const clientNameById = new Map<string, string>();
    clientsRaw.forEach((client) => {
      clientNameById.set(client.id, client.name);
    });

    const latestSessionByDog = new Map<string, string>();
    for (const session of latestSessionsRaw) {
      if (!session.dogId) continue;
      if (!latestSessionByDog.has(session.dogId)) {
        latestSessionByDog.set(session.dogId, session.startTime.toISOString());
      }
    }

    const sessions: DashboardSession[] = sessionsTodayRaw.map((session) => ({
      id: session.id,
      dogId: session.dogId,
      startTime: session.startTime.toISOString(),
      dogName: session.dog?.name ?? "Unknown",
      clientName:
        session.client?.name ?? session.dog?.client?.name ?? "Unknown",
      location: session.location,
      status: SESSION_STATUS_MAP[session.status],
    }));

    const totalTravelMinutes = sessionsTodayRaw.reduce(
      (sum, session) => sum + (session.travelMinutes ?? 0),
      0,
    );

    const totalBufferMinutes = sessionsTodayRaw.reduce(
      (sum, session) => sum + (session.bufferMinutes ?? 0),
      0,
    );

    const leaveBy = (() => {
      if (sessionsTodayRaw.length === 0) return null;
      const first = sessionsTodayRaw[0];
      const minutesToSubtract = (first.travelMinutes ?? 0) + (first.bufferMinutes ?? 0);
      const departure = new Date(first.startTime.getTime() - minutesToSubtract * 60_000);
      return departure.toISOString().slice(11, 16);
    })();

    const endOfDay = new Date(dayEndExclusive.getTime() - 1);

    const tasksDue: DashboardTask[] = tasksRaw
      .filter((task) => task.due && task.due <= endOfDay && task.status !== "DONE")
      .sort((a, b) => {
        if (!a.due || !b.due) return 0;
        return a.due.getTime() - b.due.getTime();
      })
      .slice(0, 5)
      .map((task) => {
        const relatedType: DashboardTask["relatedType"] =
          task.relatedSessionId
            ? "session"
            : task.relatedClientId
              ? "client"
              : "dog";
        const relatedId =
          task.relatedSessionId ?? task.relatedClientId ?? task.relatedDogId ?? task.id;
        const dogName =
          task.relatedDog?.name ??
          task.relatedSession?.dog?.name ??
          (task.relatedSession?.dogId ? dogNameById.get(task.relatedSession.dogId) ?? null : null);
        return {
          id: task.id,
          title: task.title,
          due: task.due?.toISOString() ?? null,
          status: TASK_STATUS_MAP[task.status],
          priority: TASK_PRIORITY_MAP[task.priority as TaskPriority],
          relatedType,
          relatedId,
          dogName,
        };
      });

    const lowPackages: DashboardPackage[] = packagesRaw
      .map((pkg) => ({
        clientId: pkg.clientId,
        clientName: pkg.client?.name ?? clientNameById.get(pkg.clientId) ?? "Unknown client",
        packageType: pkg.type,
        creditsLeft: pkg.totalCredits - pkg.usedCredits,
      }))
      .filter((pkg) => pkg.creditsLeft <= 1)
      .sort((a, b) => a.creditsLeft - b.creditsLeft);

    const recentDogs: DashboardDog[] = dogsRaw
      .map((dog) => {
        const sessionIso = latestSessionByDog.get(dog.id) ?? null;
        const latest = dog.updatedAt?.toISOString() ?? sessionIso;
        return {
          dogId: dog.id,
          dogName: dog.name,
          updatedAt: latest,
        };
      })
      .filter((dog) => dog.updatedAt !== null)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
      .slice(0, 5);

    const bookedMinutesThisWeek = sessionsWeekRaw.reduce(
      (sum, session) => sum + (session.durationMinutes ?? 0),
      0,
    );

    const capacityMinutesThisWeek = availabilityRaw.reduce((sum, slot) => {
      const from = parseTimeToMinutes(slot.startTime);
      const to = parseTimeToMinutes(slot.endTime);
      return sum + Math.max(to - from, 0);
    }, 0);

    const cancellationsThisWeek = sessionsWeekRaw.filter(
      (session) =>
        session.status === "SCHEDULED" &&
        session.startTime < referenceDate,
    ).length;

    const revenueMonthToDate = invoicesRaw.reduce((outer, invoice) => {
      const payments = invoice.payments.filter(
        (payment) =>
          payment.receivedOn >= monthStart && payment.receivedOn < monthEndExclusive,
      );
      const total = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
      return outer + total;
    }, 0);

    const outstandingInvoices = invoicesRaw.filter(
      (invoice) => invoice.status !== InvoiceStatus.PAID,
    );

    const outstandingInvoicesTotal = outstandingInvoices.reduce(
      (sum, invoice) => sum + invoice.totalCents,
      0,
    );

    const primaryCurrency =
      invoicesRaw[0]?.currency ??
      packagesRaw[0]?.currency ??
      "EUR";

    const stats: DashboardStats = {
      totalDogs: dogsRaw.length,
      activePlans: plansRaw.filter((plan) => plan.status === "ACTIVE").length,
      sessionsToday: sessions.length,
      bookedMinutesThisWeek,
      capacityMinutesThisWeek,
      cancellationsThisWeek,
      revenueMonthToDate,
      outstandingInvoicesCount: outstandingInvoices.length,
      outstandingInvoicesTotal,
      primaryCurrency,
    };

    const focusTags: DashboardFocusTag[] = (() => {
      const counts = new Map<string, number>();
      dogsRaw.forEach((dog) => {
        dog.tags.forEach((tag) => {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        });
      });
      const totalDogsConsidered = dogsRaw.length || 1;
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([tag, count]) => ({
          tag,
          dogCount: count,
          percentage: Math.round((count / totalDogsConsidered) * 100),
        }));
    })();

    const planInsights: DashboardPlanInsight[] = plansRaw
      .filter((plan) => plan.status === "ACTIVE")
      .map((plan) => {
        const totalMilestones = plan.milestones.length;
        const completedMilestones = plan.milestones.filter((milestone) => milestone.done).length;
        const nextMilestone = plan.milestones.find((milestone) => !milestone.done) ?? null;
        const lastCompletedAt =
          plan.milestones
            .filter((milestone) => milestone.done && milestone.completedAt)
            .map((milestone) => milestone.completedAt as Date)
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

        const progressPercent =
          totalMilestones === 0
            ? 0
            : Math.round((completedMilestones / totalMilestones) * 100);

        return {
          planId: plan.id,
          dogId: plan.dogId,
          dogName: plan.dog?.name ?? dogNameById.get(plan.dogId) ?? "Unknown",
          templateName: plan.templateName,
          completedMilestones,
          totalMilestones,
          progressPercent,
          nextMilestoneTitle: nextMilestone?.title ?? null,
          nextMilestoneCriteria: nextMilestone?.criteria ?? null,
          lastCompletedAt: toIso(lastCompletedAt),
        };
      })
      .sort((a, b) => a.progressPercent - b.progressPercent);

    const documentsByClient = new Set(documentsRaw.map((doc) => doc.clientId));

    const actionQueue: DashboardActionQueueItem[] = [];
    const seen = new Set<string>();

    const pushAction = (item: DashboardActionQueueItem) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      actionQueue.push(item);
    };

    outstandingInvoices.forEach((invoice) => {
      pushAction({
        id: `invoice-${invoice.id}`,
        type: "invoice",
        title: `Send invoice ${invoice.id.slice(0, 6).toUpperCase()}`,
        detail: `${invoice.client?.name ?? "Unknown client"} · ${formatCurrency(
          invoice.totalCents,
          invoice.currency,
        )}`,
        due: invoice.issuedOn?.toISOString() ?? null,
        severity: invoice.status === InvoiceStatus.ISSUED ? "high" : "medium",
      });
    });

    clientsRaw
      .filter((client) => !documentsByClient.has(client.id))
      .forEach((client) => {
        pushAction({
          id: `document-${client.id}`,
          type: "document",
          title: `Request documents for ${client.name}`,
          detail: "Upload signed waiver or intake paperwork.",
          due: null,
          severity: "medium",
        });
      });

    tasksRaw
      .filter((task) => task.status === "WAITING")
      .forEach((task) => {
        pushAction({
          id: `booking-${task.id}`,
          type: "booking",
          title: task.title,
          detail: "Waiting for client confirmation.",
          due: task.due?.toISOString() ?? null,
          severity: "medium",
        });
      });

    mediaRaw
      .filter((asset) => CONSENT_SCOPE_MAP[asset.consentScope] === "share_later")
      .forEach((asset) => {
        pushAction({
          id: `media-${asset.id}`,
          type: "media",
          title: `Review media for ${asset.dog?.name ?? "Unknown dog"}`,
          detail: "Prep for sharing with client.",
          due: asset.uploadedAt.toISOString(),
          severity: "low",
        });
      });

    tasksRaw
      .filter((task) => task.status !== "DONE" && task.due && task.due <= endOfDay)
      .forEach((task) => {
        pushAction({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          detail: "Due today",
          due: task.due?.toISOString() ?? null,
          severity: "high",
        });
      });

    actionQueue.sort((a, b) => {
      const severityDiff = ACTION_SEVERITY_WEIGHT[b.severity] - ACTION_SEVERITY_WEIGHT[a.severity];
      if (severityDiff !== 0) return severityDiff;
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

    const recentActivity: DashboardRecentActivityItem[] = [];

    auditRaw.forEach((log) => {
      recentActivity.push({
        id: `audit-${log.id}`,
        timestamp: log.createdAt.toISOString(),
        title: log.summary ?? log.action,
        description: log.action,
        actor: log.actor?.name ?? log.actorId ?? null,
      });
    });

    sessionsWeekRaw
      .filter((session) => session.status === SessionStatus.DONE)
      .forEach((session) => {
        recentActivity.push({
          id: `session-${session.id}`,
          timestamp: session.startTime.toISOString(),
          title: `Session completed for ${session.dog?.name ?? "Unknown dog"}`,
          description: session.location,
          actor: null,
        });
      });

    invoicesRaw
      .filter((invoice) => invoice.status === InvoiceStatus.PAID && invoice.paidOn)
      .forEach((invoice) => {
        recentActivity.push({
          id: `invoice-${invoice.id}`,
          timestamp: invoice.paidOn!.toISOString(),
          title: `Payment received`,
          description: `${invoice.client?.name ?? "Unknown client"} · ${formatCurrency(
            invoice.totalCents,
            invoice.currency,
          )}`,
          actor: invoice.client?.name ?? null,
        });
      });

    documentsRaw.forEach((doc) => {
      recentActivity.push({
        id: `document-${doc.id}`,
        timestamp: doc.uploadedAt.toISOString(),
        title: `Document uploaded · ${doc.name}`,
        description: doc.client?.name ?? "Unknown client",
        actor: null,
      });
    });

    recentActivity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const watchlistSeed = new Map<string, DashboardWatchlistItem>();

    watchPinsRaw.forEach((pin) => {
      const item = mapWatchPin(pin);
      if (item) {
        watchlistSeed.set(item.id, item);
      }
    });

    dogsRaw
      .filter(
        (dog) => dog.medicalFlags.length > 0 || dog.tags.some((tag) => tag.toLowerCase().includes("reactive")),
      )
      .forEach((dog) => {
        const id = `dog-${dog.id}`;
        if (watchlistSeed.has(id)) return;
        watchlistSeed.set(id, {
          id,
          entityType: "dog",
          name: dog.name,
          tags: dog.tags,
          reason:
            dog.medicalFlags.length > 0
              ? `Medical: ${dog.medicalFlags.join(", ")}`
              : "Reactive focus",
          lastInteractionAt: latestSessionByDog.get(dog.id) ?? dog.updatedAt?.toISOString() ?? null,
        });
      });

    outstandingInvoices.forEach((invoice) => {
      const id = `client-${invoice.clientId}`;
      if (watchlistSeed.has(id)) return;
      watchlistSeed.set(id, {
        id,
        entityType: "client",
        name: invoice.client?.name ?? clientNameById.get(invoice.clientId) ?? "Unknown client",
        tags: ["billing"],
        reason: `Outstanding balance ${formatCurrency(invoice.totalCents, invoice.currency)}`,
        lastInteractionAt: invoice.issuedOn?.toISOString() ?? null,
      });
    });

    const watchlist = Array.from(watchlistSeed.values())
      .sort((a, b) => {
        if (!a.lastInteractionAt && !b.lastInteractionAt) return 0;
        if (!a.lastInteractionAt) return 1;
        if (!b.lastInteractionAt) return -1;
        return (
          new Date(b.lastInteractionAt).getTime() -
          new Date(a.lastInteractionAt).getTime()
        );
      })
      .slice(0, 6);

    // Process objectives
    const objectives: DashboardObjective[] = [];
    objectiveLogsRaw.forEach((log) => {
      if (!log.dog) return;
      
      const lines = log.summary.split("\n");
      const header = lines[0] ?? "";
      
      const idMatch = header.match(/id:([^,]+)/);
      const skillMatch = header.match(/skill:([^,]+)/);
      const statusMatch = header.match(/status:([^,]+)/);
      
      const id = idMatch?.[1]?.trim() || `obj-${log.id}`;
      const skill = skillMatch?.[1]?.trim() || "";
      const status = (statusMatch?.[1]?.trim() as DashboardObjective["status"]) || "planned";
      
      if (id && skill && log.dog) {
        objectives.push({
          id,
          dogId: log.dog.id,
          dogName: log.dog.name,
          skill,
          status,
        });
      }
    });

    return {
      sessions,
      travel: {
        totalTravelMinutes,
        totalBufferMinutes,
        leaveBy,
      },
      tasksDue,
      lowPackages,
      recentDogs,
      stats,
      focusTags,
      planInsights,
      actionQueue: actionQueue.slice(0, 8),
      recentActivity: recentActivity.slice(0, 10),
      watchlist,
      objectives: objectives.slice(0, 20), // Limit to 20 most recent
    };
  } catch (error) {
    console.error("Failed to build dashboard data from database.", error);
    return EMPTY_DASHBOARD;
  }
}

function mapWatchPin(pin: WatchlistPin & { dog: { id: string; name: string; tags: string[]; medicalFlags: string[]; updatedAt: Date | null } | null; client: { id: string; name: string; updatedAt: Date | null } | null }): DashboardWatchlistItem | null {
  if (pin.dog) {
    return {
      id: `dog-${pin.dog.id}`,
      entityType: "dog",
      name: pin.dog.name,
      tags: pin.dog.tags,
      reason: pin.reason,
      lastInteractionAt: pin.dog.updatedAt?.toISOString() ?? null,
    };
  }
  if (pin.client) {
    return {
      id: `client-${pin.client.id}`,
      entityType: "client",
      name: pin.client.name,
      tags: ["follow-up"],
      reason: pin.reason,
      lastInteractionAt: pin.client.updatedAt?.toISOString() ?? null,
    };
  }
  return null;
}
