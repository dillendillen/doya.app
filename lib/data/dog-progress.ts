import { isDatabaseConfigured, prisma } from "../prisma";

export type DogMilestone = {
  id: string;
  title: string;
  description: string | null;
  achievedAt: string;
  mediaIds: string[];
  score?: number; // Optional score out of 10
};

export type DogProgressScore = {
  date: string;
  obedience: number; // 0-10
  focus: number; // 0-10
  socialTolerance: number; // 0-10
};

export type DogBehaviorLog = {
  id: string;
  sessionId: string | null;
  mood: "anxious" | "excited" | "calm" | "distracted" | "focused" | "reactive";
  environment: string | null; // e.g., "windy", "park", "indoor"
  notes: string;
  createdAt: string;
  weather?: string | null;
  distractions?: string | null;
};

export type DogTrainingObjective = {
  id: string;
  skill: string; // e.g., "Sit", "Stay", "Recall", "Off-leash confidence"
  status: "planned" | "in_progress" | "mastered";
  notes: string | null;
  mediaIds: string[];
  startedAt: string | null;
  masteredAt: string | null;
  sessionIds: string[]; // Sessions where this skill was worked on
};

export type DogProgressData = {
  milestones: DogMilestone[];
  progressScores: DogProgressScore[];
  behaviorLogs: DogBehaviorLog[];
  trainingObjectives: DogTrainingObjective[];
};

export async function getDogProgress(dogId: string): Promise<DogProgressData> {
  if (!isDatabaseConfigured()) {
    return {
      milestones: [],
      progressScores: [],
      behaviorLogs: [],
      trainingObjectives: [],
    };
  }

  // Get milestones from timeline entries marked as milestones
  const timelineEntries = await prisma.dogTimelineEntry.findMany({
    where: {
      dogId,
      entryType: "milestone",
    },
    orderBy: { occurredAt: "desc" },
  });

  const milestones: DogMilestone[] = timelineEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.summary,
    achievedAt: entry.occurredAt.toISOString(),
    mediaIds: [], // TODO: Link media to milestones
    score: undefined,
  }));

  // Get progress scores from session scorecards
  const sessions = await prisma.session.findMany({
    where: {
      dogId,
      status: "DONE",
      scorecards: {
        not: null,
      },
    },
    select: {
      id: true,
      startTime: true,
      scorecards: true,
    },
    orderBy: { startTime: "asc" },
  });

  const progressScores: DogProgressScore[] = sessions
    .map((session) => {
      const scorecards = session.scorecards as Record<string, unknown> | null;
      if (!scorecards || typeof scorecards !== "object") return null;

      const obedience = typeof scorecards.obedience === "number" ? scorecards.obedience : null;
      const focus = typeof scorecards.focus === "number" ? scorecards.focus : null;
      const socialTolerance = typeof scorecards.socialTolerance === "number" ? scorecards.socialTolerance : null;

      if (obedience === null && focus === null && socialTolerance === null) return null;

      return {
        date: session.startTime.toISOString(),
        obedience: obedience ?? 0,
        focus: focus ?? 0,
        socialTolerance: socialTolerance ?? 0,
      };
    })
    .filter((score): score is DogProgressScore => score !== null);

  // Get behavior logs (stored in dog notes with special format)
  const behaviorNotes = await prisma.dogLog.findMany({
    where: {
      dogId,
      summary: {
        startsWith: "[BEHAVIOR]",
      },
    },
    select: {
      id: true,
      summary: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const behaviorLogs: DogBehaviorLog[] = behaviorNotes.map((note) => {
    // Parse behavior log format: [BEHAVIOR] mood:excited, env:park, weather:windy\nnotes here
    const lines = note.summary.split("\n");
    const header = lines[0] ?? "";
    const notes = lines.slice(1).join("\n");

    const moodMatch = header.match(/mood:(\w+)/);
    const envMatch = header.match(/env:([^,]+)/);
    const weatherMatch = header.match(/weather:([^,]+)/);
    const distractionsMatch = header.match(/distractions:([^,\n]+)/);
    const sessionMatch = header.match(/sessionId:([^,\n]+)/);

    return {
      id: note.id,
      sessionId: sessionMatch?.[1] ?? null,
      mood: (moodMatch?.[1] as DogBehaviorLog["mood"]) ?? "calm",
      environment: envMatch?.[1] ?? null,
      notes: notes.trim() || "No additional notes",
      createdAt: note.createdAt.toISOString(),
      weather: weatherMatch?.[1] ?? null,
      distractions: distractionsMatch?.[1] ?? null,
    };
  });

  // Get training objectives from stored objective logs and sessions
  const objectiveLogs = await prisma.dogLog.findMany({
    where: {
      dogId,
      summary: {
        startsWith: "[OBJECTIVE]",
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse stored objectives
  const storedObjectiveMap = new Map<string, DogTrainingObjective>();
  
  objectiveLogs.forEach((log) => {
    const lines = log.summary.split("\n");
    const header = lines[0] ?? "";
    
    const idMatch = header.match(/id:([^,]+)/);
    const skillMatch = header.match(/skill:([^,]+)/);
    const statusMatch = header.match(/status:([^,]+)/);
    const notesMatch = header.match(/notes:([^\n]+)/);
    
    const id = idMatch?.[1]?.trim() || `obj-${log.id}`;
    const skill = skillMatch?.[1]?.trim() || "";
    const status = (statusMatch?.[1]?.trim() as DogTrainingObjective["status"]) || "planned";
    const notes = notesMatch?.[1]?.trim() || (lines.length > 1 ? lines.slice(1).join("\n").trim() : null);
    
    if (id && skill) {
      storedObjectiveMap.set(id, {
        id,
        skill,
        status,
        notes: notes || null,
        mediaIds: [],
        startedAt: log.createdAt.toISOString(),
        masteredAt: status === "mastered" ? log.createdAt.toISOString() : null,
        sessionIds: [],
      });
    }
  });

  // Also get objectives from sessions to merge with stored ones
  const allSessions = await prisma.session.findMany({
    where: { dogId },
    select: {
      id: true,
      objectives: true,
      startTime: true,
      status: true,
      notes: true,
    },
    orderBy: { startTime: "desc" },
  });

  // Merge session objectives with stored ones
  allSessions.forEach((session) => {
    session.objectives.forEach((objective) => {
      const existingId = `obj-${objective.toLowerCase().replace(/\s+/g, "-")}`;
      if (!storedObjectiveMap.has(existingId)) {
        storedObjectiveMap.set(existingId, {
          id: existingId,
          skill: objective,
          status: session.status === "DONE" ? "mastered" : "in_progress",
          notes: null,
          mediaIds: [],
          startedAt: session.startTime.toISOString(),
          masteredAt: session.status === "DONE" ? session.startTime.toISOString() : null,
          sessionIds: [session.id],
        });
      } else {
        const existing = storedObjectiveMap.get(existingId)!;
        if (!existing.sessionIds.includes(session.id)) {
          existing.sessionIds.push(session.id);
        }
        // Update status if session is done and objective isn't already mastered
        if (session.status === "DONE" && existing.status !== "mastered") {
          existing.status = "mastered";
          if (!existing.masteredAt) {
            existing.masteredAt = session.startTime.toISOString();
          }
        }
      }
    });
  });

  const trainingObjectives = Array.from(storedObjectiveMap.values());

  return {
    milestones,
    progressScores,
    behaviorLogs,
    trainingObjectives,
  };
}

