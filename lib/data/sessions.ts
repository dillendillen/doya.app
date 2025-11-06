import { FollowUpStatus, SessionStatus } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type SessionListItem = {
  id: string;
  title: string | null;
  datetime: string;
  location: string;
  durationMin: number;
  status: "scheduled" | "in_progress" | "done";
  dogId: string;
  dogName: string;
  trainerId: string | null;
  trainerName: string;
  travelMinutes: number;
  bufferMinutes: number;
  objectives: string[];
  sessionNote: string | null;
  clientId: string | null;
  packageId: string | null;
  packageName: string | null;
  packageSessionsRemaining: number | null;
};

// Extract title from notes if it exists (format: "Title\n\nrest of notes")
function extractTitleFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const lines = notes.split("\n");
  // Check if first line exists and second line is blank (indicating title format)
  if (lines.length > 1 && lines[0]?.trim() && lines[1]?.trim() === "") {
    return lines[0].trim();
  }
  return null;
}

// Extract title from notes (same as extractTitleFromNotes, but separate function for clarity)
function extractTitleFromNotesDetail(notes: string | null): string | null {
  return extractTitleFromNotes(notes);
}

// Remove title from notes, return just the body
function removeTitleFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const lines = notes.split("\n");
  // Check if first line exists and second line is blank (indicating title format)
  if (lines.length > 1 && lines[0]?.trim() && lines[1]?.trim() === "") {
    // Remove first line (title) and blank line, return rest
    const body = lines.slice(2).join("\n").trim();
    return body || null;
  }
  return notes;
}

export type SessionDetailNextStep = {
  text: string;
  due: string | null;
  status: "open" | "done";
};

export type SessionDogNote = {
  id: string;
  body: string;
  createdAt: string;
};

export type SessionDetailBehaviorLog = {
  id: string;
  mood: "anxious" | "excited" | "calm" | "distracted" | "focused" | "reactive";
  environment: string | null;
  weather: string | null;
  distractions: string | null;
  notes: string;
  createdAt: string;
};

export type SessionDetailTrainingObjective = {
  id: string;
  skill: string;
  status: "planned" | "in_progress" | "mastered";
  notes: string | null;
};

export type SessionDetail = {
  id: string;
  title: string | null;
  dogId: string;
  trainerId: string;
  clientId: string | null;
  datetime: string;
  location: string;
  durationMin: number;
  status: "scheduled" | "in_progress" | "done";
  objectives: string[];
  scorecards: Array<{ skill: string; score: number }>;
  notes: string | null;
  mediaIds: string[];
  packageId: string | null;
  packageInfo: {
    type: string;
    sessionsRemaining: number;
    totalSessions: number;
  } | null;
  nextSteps: SessionDetailNextStep[];
  travelMinutes: number;
  bufferMinutes: number;
  dogName: string;
  trainerName: string;
  dogNotes: SessionDogNote[];
  behaviorLogs: SessionDetailBehaviorLog[];
  trainingObjectives: SessionDetailTrainingObjective[];
};

const SESSION_STATUS_MAP: Record<SessionStatus, SessionListItem["status"]> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

const FOLLOW_UP_STATUS_MAP: Record<FollowUpStatus, SessionDetailNextStep["status"]> = {
  OPEN: "open",
  DONE: "done",
};

function parseIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listSessionsForRange(
  startIso: string,
  endIso: string,
): Promise<SessionListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const start = parseIso(startIso);
  const end = parseIso(endIso);

  if (!start || !end) {
    return [];
  }

  const sessions = await prisma.session.findMany({
    where: {
      startTime: {
        gte: start,
        lte: end,
      },
    },
    include: {
      dog: { select: { id: true, name: true } },
      trainer: { select: { id: true, name: true } },
      package: {
        select: {
          id: true,
          type: true,
          totalCredits: true,
          usedCredits: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return sessions.map((session) => {
    const extractedTitle = extractTitleFromNotes(session.notes);
    return {
      id: session.id,
      title: extractedTitle,
      datetime: session.startTime.toISOString(),
      location: session.location,
      durationMin: session.durationMinutes,
      status: SESSION_STATUS_MAP[session.status],
      dogId: session.dogId,
      dogName: session.dog?.name ?? "Unknown",
      trainerId: session.trainer?.id ?? session.trainerId ?? null,
      trainerName: session.trainer?.name ?? "Unknown",
      travelMinutes: session.travelMinutes ?? 0,
      bufferMinutes: session.bufferMinutes ?? 0,
      objectives: Array.isArray(session.objectives) ? session.objectives : [],
      sessionNote: session.notes ?? null,
      clientId: session.clientId,
      packageId: session.packageId,
      packageName: session.package?.type ?? null,
      packageSessionsRemaining: session.package 
        ? session.package.totalCredits - session.package.usedCredits 
        : null,
    };
  });
}

export async function getSessionById(id: string): Promise<SessionDetail | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      dog: { select: { id: true, name: true, clientId: true } },
      trainer: { select: { id: true, name: true } },
      followUps: {
        orderBy: { createdAt: "asc" },
      },
      media: {
        select: { id: true },
      },
    },
  });

  if (!session) {
    return null;
  }

  const nextSteps: SessionDetailNextStep[] = session.followUps.map((followUp) => ({
    text: followUp.text,
    due: followUp.due?.toISOString() ?? null,
    status: FOLLOW_UP_STATUS_MAP[followUp.status],
  }));

  const scorecardsRaw = Array.isArray(session.scorecards)
    ? session.scorecards
    : session.scorecards
      ? [session.scorecards]
      : [];

  const scorecards = scorecardsRaw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const maybe = entry as Record<string, unknown>;
      const skill = typeof maybe.skill === "string" ? maybe.skill : null;
      const score =
        typeof maybe.score === "number"
          ? maybe.score
          : typeof maybe.value === "number"
            ? maybe.value
            : null;
      if (!skill) return null;
      return {
        skill,
        score: score ?? 0,
      };
    })
    .filter(Boolean) as Array<{ skill: string; score: number }>;

  // Get dog notes (excluding behavior logs and objectives)
  const dogNotesRaw = await prisma.dogLog.findMany({
    where: { 
      dogId: session.dogId,
      NOT: {
        OR: [
          { summary: { startsWith: "[BEHAVIOR]" } },
          { summary: { startsWith: "[OBJECTIVE]" } },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get behavior logs
  const behaviorLogsRaw = await prisma.dogLog.findMany({
    where: {
      dogId: session.dogId,
      summary: { startsWith: "[BEHAVIOR]" },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get training objectives
  const objectiveLogsRaw = await prisma.dogLog.findMany({
    where: {
      dogId: session.dogId,
      summary: { startsWith: "[OBJECTIVE]" },
    },
    orderBy: { createdAt: "desc" },
  });

  const extractedTitle = extractTitleFromNotesDetail(session.notes);
  const notesWithoutTitle = removeTitleFromNotes(session.notes);

  // Get package info if session has a package
  let packageInfo = null;
  if (session.packageId) {
    const pkg = await prisma.package.findUnique({
      where: { id: session.packageId },
      select: {
        type: true,
        totalCredits: true,
        usedCredits: true,
      },
    });

    if (pkg) {
      packageInfo = {
        type: pkg.type,
        sessionsRemaining: pkg.totalCredits - pkg.usedCredits, // Allow negative
        totalSessions: pkg.totalCredits,
      };
    }
  }

  // Parse behavior logs
  const behaviorLogs: SessionDetailBehaviorLog[] = behaviorLogsRaw.map((log) => {
    const lines = log.summary.split("\n");
    const header = lines[0] ?? "";
    const notes = lines.slice(1).join("\n");

    const moodMatch = header.match(/mood:(\w+)/);
    const envMatch = header.match(/env:([^,]+)/);
    const weatherMatch = header.match(/weather:([^,]+)/);
    const distractionsMatch = header.match(/distractions:([^,\n]+)/);

    return {
      id: log.id,
      mood: (moodMatch?.[1] as SessionDetailBehaviorLog["mood"]) ?? "calm",
      environment: envMatch?.[1] ?? null,
      weather: weatherMatch?.[1] ?? null,
      distractions: distractionsMatch?.[1] ?? null,
      notes: notes.trim() || "No additional notes",
      createdAt: log.createdAt.toISOString(),
    };
  });

  // Parse training objectives
  const trainingObjectives: SessionDetailTrainingObjective[] = objectiveLogsRaw.map((log) => {
    const lines = log.summary.split("\n");
    const header = lines[0] ?? "";
    
    const skillMatch = header.match(/skill:([^,]+)/);
    const statusMatch = header.match(/status:([^,]+)/);
    const notesMatch = header.match(/notes:([^\n]+)/);
    
    const skill = skillMatch?.[1]?.trim() || "";
    const status = (statusMatch?.[1]?.trim() as SessionDetailTrainingObjective["status"]) || "planned";
    const notes = notesMatch?.[1]?.trim() || (lines.length > 1 ? lines.slice(1).join("\n").trim() : null);

    return {
      id: log.id,
      skill,
      status,
      notes: notes || null,
    };
  });

  return {
    id: session.id,
    title: extractedTitle,
    dogId: session.dogId,
    trainerId: session.trainerId,
    clientId: session.clientId,
    datetime: session.startTime.toISOString(),
    location: session.location,
    durationMin: session.durationMinutes,
    status: SESSION_STATUS_MAP[session.status],
    objectives: session.objectives,
    scorecards,
    notes: notesWithoutTitle,
    mediaIds: session.media.map((asset) => asset.id),
    packageId: session.packageId,
    packageInfo,
    nextSteps,
    travelMinutes: session.travelMinutes,
    bufferMinutes: session.bufferMinutes,
    dogName: session.dog?.name ?? "Unknown",
    trainerName: session.trainer?.name ?? "Unknown",
    dogNotes: dogNotesRaw.map((note) => ({
      id: note.id,
      body: note.summary,
      createdAt: note.createdAt.toISOString(),
    })),
    behaviorLogs,
    trainingObjectives,
  };
}
