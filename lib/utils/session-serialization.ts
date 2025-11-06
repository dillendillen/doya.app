import type { SessionDetail } from "@/lib/data/sessions";

/**
 * Serializes session data for safe client-side rendering
 * Ensures all Date objects are converted to strings and arrays are properly initialized
 */
export function serializeSessionData(session: SessionDetail) {
  return {
    ...session,
    objectives: Array.isArray(session.objectives) ? session.objectives : [],
    scorecards: Array.isArray(session.scorecards) ? session.scorecards : [],
    nextSteps: Array.isArray(session.nextSteps) ? session.nextSteps : [],
    mediaIds: Array.isArray(session.mediaIds) ? session.mediaIds : [],
    packageInfo: session.packageInfo ?? null,
    dogNotes: Array.isArray(session.dogNotes)
      ? session.dogNotes.map((note) => ({
          id: note.id,
          body: note.body,
          createdAt:
            typeof note.createdAt === "string"
              ? note.createdAt
              : note.createdAt?.toISOString() || new Date().toISOString(),
        }))
      : [],
  };
}

