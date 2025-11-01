import { dogs, sessions, users } from "../mock-data";
import type { Session } from "../types";

export type SessionListItem = Pick<
  Session,
  "id" | "datetime" | "location" | "durationMin" | "status"
> & {
  dogName: string;
  trainerName: string;
};

export function listSessionsForRange(
  startIso: string,
  endIso: string,
): SessionListItem[] {
  return sessions
    .filter(
      (session) =>
        session.datetime >= startIso && session.datetime <= endIso,
    )
    .map<SessionListItem>((session) => {
      const dog = dogs.find((d) => d.id === session.dogId);
      const trainer = users.find((user) => user.id === session.trainerId);
      return {
        id: session.id,
        datetime: session.datetime,
        location: session.location,
        durationMin: session.durationMin,
        status: session.status,
        dogName: dog?.name ?? "Unknown",
        trainerName: trainer?.name ?? "Unknown",
      };
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export type SessionDetail = Session & {
  dogName: string;
  trainerName: string;
};

export function getSessionById(id: string): SessionDetail | null {
  const session = sessions.find((entry) => entry.id === id);
  if (!session) return null;

  const dog = dogs.find((d) => d.id === session.dogId);
  const trainer = users.find((user) => user.id === session.trainerId);

  return {
    ...session,
    dogName: dog?.name ?? "Unknown",
    trainerName: trainer?.name ?? "Unknown",
  };
}
