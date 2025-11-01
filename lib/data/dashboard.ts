import {
  clients,
  dogLogs,
  dogs,
  packages,
  plans,
  sessions,
  tasks,
} from "../mock-data";
import type { Task } from "../types";

export type DashboardSession = {
  id: string;
  startTime: string;
  dogName: string;
  clientName: string;
  location: string;
  status: "scheduled" | "in_progress" | "done";
};

export type DashboardTask = Pick<
  Task,
  "id" | "title" | "due" | "status" | "priority" | "relatedType" | "relatedId"
> & {
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

export type DashboardTravel = {
  totalTravelMinutes: number;
  totalBufferMinutes: number;
  leaveBy: string | null;
};

export type DashboardStats = {
  totalDogs: number;
  activePlans: number;
  sessionsToday: number;
};

export type DashboardData = {
  sessions: DashboardSession[];
  travel: DashboardTravel;
  tasksDue: DashboardTask[];
  lowPackages: DashboardPackage[];
  recentDogs: DashboardDog[];
  stats: DashboardStats;
};

function toDateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function getDashboardData(
  dateIso: string,
  trainerId?: string,
): DashboardData {
  const dateKey = toDateKey(dateIso);

  const sessionsForDay = sessions
    .filter((session) => {
      if (trainerId && session.trainerId !== trainerId) return false;
      return toDateKey(session.datetime) === dateKey;
    })
    .map<DashboardSession>((session) => {
      const dog = dogs.find((d) => d.id === session.dogId);
      const client = clients.find((c) => c.id === dog?.clientId);
      return {
        id: session.id,
        startTime: session.datetime,
        dogName: dog?.name ?? "Unknown",
        clientName: client?.name ?? "Unknown",
        location: session.location,
        status: session.status,
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalTravelMinutes = sessionsForDay.reduce((sum, session) => {
    const original = sessions.find((s) => s.id === session.id);
    return sum + (original?.travelMinutes ?? 0);
  }, 0);
  const totalBufferMinutes = sessionsForDay.reduce((sum, session) => {
    const original = sessions.find((s) => s.id === session.id);
    return sum + (original?.bufferMinutes ?? 0);
  }, 0);

  const leaveBy = (() => {
    if (sessionsForDay.length === 0) return null;
    const firstSession = sessionsForDay[0];
    const original = sessions.find((s) => s.id === firstSession.id);
    if (!original) return null;
    const date = new Date(original.datetime);
    const minutesToSubtract = (original.travelMinutes ?? 0) + (original.bufferMinutes ?? 0);
    const leaveDate = new Date(date.getTime() - minutesToSubtract * 60_000);
    return leaveDate.toISOString().slice(11, 16);
  })();

  const tasksDue = tasks
    .filter((task) => {
      if (!task.due) return false;
      return toDateKey(task.due) <= dateKey && task.status !== "done";
    })
    .sort((a, b) => {
      if (!a.due || !b.due) return 0;
      return a.due.localeCompare(b.due);
    })
    .slice(0, 5)
    .map<DashboardTask>((task) => {
      const dog =
        task.relatedType === "dog"
          ? dogs.find((d) => d.id === task.relatedId)
          : null;
      return {
        ...task,
        dogName: dog?.name ?? null,
      };
    });

  const lowPackages = packages
    .map<DashboardPackage>((pkg) => {
      const client = clients.find((c) => c.id === pkg.clientId);
      return {
        clientId: pkg.clientId,
        clientName: client?.name ?? "Unknown",
        packageType: pkg.type,
        creditsLeft: pkg.totalCredits - pkg.usedCredits,
      };
    })
    .filter((pkg) => pkg.creditsLeft <= 1)
    .sort((a, b) => a.creditsLeft - b.creditsLeft);

  const recentDogs = dogs
    .map<DashboardDog>((dog) => {
      const lastSession = sessions
        .filter((session) => session.dogId === dog.id)
        .map((session) => session.datetime)
        .sort((a, b) => b.localeCompare(a))[0];

      const lastLog = dogLogs
        .filter((log) => log.dogId === dog.id)
        .map((log) => log.updatedAt)
        .sort((a, b) => b.localeCompare(a))[0];

      return {
        dogId: dog.id,
        dogName: dog.name,
        updatedAt: lastLog ?? lastSession ?? null,
      };
    })
    .filter((dog) => dog.updatedAt !== null)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 5);

  const stats: DashboardStats = {
    totalDogs: dogs.length,
    activePlans: plans.filter((plan) => plan.status === "active").length,
    sessionsToday: sessionsForDay.length,
  };

  return {
    sessions: sessionsForDay,
    travel: {
      totalTravelMinutes,
      totalBufferMinutes,
      leaveBy,
    },
    tasksDue,
    lowPackages,
    recentDogs,
    stats,
  };
}
