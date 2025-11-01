import { clients, dogTimeline, dogs, mediaLibrary, plans, sessions } from "../mock-data";
import type { Dog, Plan, Session } from "../types";

export type DogListItem = Pick<
  Dog,
  | "id"
  | "name"
  | "photoUrl"
  | "breed"
  | "sex"
  | "tags"
  | "lastSessionDate"
> & {
  clientName: string;
  activePlanName: string | null;
};

export type DogDetail = Dog & {
  clientName: string;
  clientId: string;
  plans: Array<
    Pick<Plan, "id" | "templateName" | "status" | "assignedOn" | "milestones">
  >;
  sessions: Array<
    Pick<
      Session,
      | "id"
      | "datetime"
      | "status"
      | "location"
      | "durationMin"
      | "trainerId"
      | "objectives"
      | "scorecards"
      | "notes"
    >
  >;
  media: Array<{
    id: string;
    url: string;
    thumbUrl: string | null;
    consentScope: "internal" | "share_later";
    uploadedAt: string;
  }>;
  timeline: Array<{
    id: string;
    type: "session" | "note" | "task";
    occurredAt: string;
    title: string;
    summary: string;
  }>;
};

export function listDogs(): DogListItem[] {
  return dogs
    .map<DogListItem>((dog) => {
      const client = clients.find((clientItem) => clientItem.id === dog.clientId);
      const activePlan = plans.find((plan) => plan.id === dog.activePlanId);
      return {
        id: dog.id,
        name: dog.name,
        photoUrl: dog.photoUrl,
        breed: dog.breed,
        sex: dog.sex,
        tags: dog.tags,
        lastSessionDate: dog.lastSessionDate,
        clientName: client?.name ?? "Unknown",
        activePlanName: activePlan?.templateName ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDogById(id: string): DogDetail | null {
  const dog = dogs.find((item) => item.id === id);
  if (!dog) return null;

  const client = clients.find((c) => c.id === dog.clientId);

  const dogPlans = plans
    .filter((plan) => plan.dogId === id)
    .map((plan) => ({
      id: plan.id,
      templateName: plan.templateName,
      status: plan.status,
      assignedOn: plan.assignedOn,
      milestones: plan.milestones,
    }));

  const dogSessions = sessions
    .filter((session) => session.dogId === id)
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 15)
    .map((session) => ({
      id: session.id,
      dogId: session.dogId,
      trainerId: session.trainerId,
      datetime: session.datetime,
      location: session.location,
      durationMin: session.durationMin,
      status: session.status,
      objectives: session.objectives,
      scorecards: session.scorecards,
      notes: session.notes,
    }));

  const dogMedia = mediaLibrary
    .filter((media) => media.dogId === id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 12)
    .map((media) => ({
      id: media.id,
      url: media.url,
      thumbUrl: media.thumbUrl,
      consentScope: media.consentScope,
      uploadedAt: media.uploadedAt,
    }));

  const timeline = dogTimeline
    .filter((entry) => entry.dogId === id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 20);

  return {
    ...dog,
    clientId: dog.clientId,
    clientName: client?.name ?? "Unknown",
    plans: dogPlans,
    sessions: dogSessions,
    media: dogMedia,
    timeline,
  };
}
