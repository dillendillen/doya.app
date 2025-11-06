import { isDatabaseConfigured, prisma } from "../prisma";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  workingHours: string | null;
};

export type TrainerQuickPick = {
  id: string;
  name: string;
};

export type AvailabilitySettings = {
  travelBufferMinutes: number;
  availability: Array<{ day: string; from: string; to: string; location: string | null }>;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeRole(role: string) {
  return role.toLowerCase();
}

export async function listUsers(): Promise<UserListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  return rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    locale: user.locale,
    workingHours: user.workingHours,
  }));
}

export async function listTrainersForQuickCreate(): Promise<TrainerQuickPick[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.user.findMany({
    where: {
      role: {
        in: ["TRAINER", "OWNER"],
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return rows.map((user) => ({
    id: user.id,
    name: user.name,
  }));
}

export async function getAvailabilitySettings(): Promise<AvailabilitySettings> {
  if (!isDatabaseConfigured()) {
    return {
      travelBufferMinutes: 0,
      availability: [],
    };
  }

  const [slots, sessions] = await Promise.all([
    prisma.availabilitySlot.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.session.findMany({
      where: { bufferMinutes: { gt: 0 } },
      select: { bufferMinutes: true },
      take: 100,
      orderBy: { startTime: "desc" },
    }),
  ]);

  const totalBuffer = sessions.reduce((sum, session) => sum + session.bufferMinutes, 0);
  const travelBufferMinutes =
    sessions.length > 0 ? Math.round(totalBuffer / sessions.length) : 0;

  const availability = slots.map((slot) => ({
    day: DAY_NAMES[slot.dayOfWeek] ?? "Unknown",
    from: slot.startTime,
    to: slot.endTime,
    location: slot.location,
  }));

  return {
    travelBufferMinutes,
    availability,
  };
}
