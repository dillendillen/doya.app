import type {
  AuditLog,
  Client,
  Dog,
  Invoice,
  Media,
  Package,
  Plan,
  Session,
  Task,
  User,
} from "./types";

export type DogLog = {
  dogId: string;
  updatedAt: string;
};

export type DogTimelineEntry = {
  id: string;
  dogId: string;
  type: "session" | "note" | "task";
  occurredAt: string;
  title: string;
  summary: string;
};

export type ClientDocument = {
  id: string;
  clientId: string;
  name: string;
  uploadedAt: string;
};

export type ClientNote = {
  id: string;
  clientId: string;
  body: string;
  createdAt: string;
};

export type SettingsSnapshot = {
  travelBufferMinutes: number;
  availability: Array<{ day: string; from: string; to: string }>;
};

const now = new Date();

const addDays = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const subtractDays = (days: number) => addDays(-days);

export const users: User[] = [
  {
    id: "user-owner",
    name: "Maya Ortiz",
    email: "maya@doya.training",
    role: "owner",
    locale: "en",
    workingHours: "Mon-Fri 09:00-17:00",
  },
  {
    id: "user-trainer-1",
    name: "Noah Vermeulen",
    email: "noah@doya.training",
    role: "trainer",
    locale: "nl",
    workingHours: "Tue-Sat 08:00-16:00",
  },
  {
    id: "user-assistant-1",
    name: "Ava Singh",
    email: "ava@doya.training",
    role: "assistant",
    locale: "en",
    workingHours: "Mon-Fri 10:00-18:00",
  },
];

export const clients: Client[] = [
  {
    id: "client-hart",
    name: "Emma Hart",
    phone: "+31 6 1234 5678",
    email: "emma.hart@example.com",
    address: "Herengracht 12, Amsterdam",
    language: "EN",
    referral: "Instagram",
    vatId: null,
    notes: "Prefers weekday morning sessions.",
  },
  {
    id: "client-van-dijk",
    name: "Jeroen van Dijk",
    phone: "+31 6 8765 4321",
    email: "jeroen.vandijk@example.com",
    address: "Zeedijk 54, Haarlem",
    language: "NL",
    referral: "Trainer referral",
    vatId: "NL123456789B01",
    notes: "Follow-up invoices Friday.",
  },
];

export const dogs: Dog[] = [
  {
    id: "dog-luna",
    clientId: "client-hart",
    name: "Luna",
    photoUrl: null,
    breed: "Border Collie",
    sex: "F",
    dob: "2022-04-01",
    medicalFlags: ["fish allergy"],
    triggers: ["bikes", "sudden noises"],
    tags: ["puppy", "reactive"],
    consentInternal: true,
    consentShareLater: true,
    activePlanId: "plan-luna-reactivity",
    lastSessionDate: now.toISOString(),
  },
  {
    id: "dog-max",
    clientId: "client-hart",
    name: "Max",
    photoUrl: null,
    breed: "Vizsla",
    sex: "M",
    dob: "2021-08-12",
    medicalFlags: [],
    triggers: ["doorbell"],
    tags: ["recall"],
    consentInternal: true,
    consentShareLater: false,
    activePlanId: "plan-max-recall",
    lastSessionDate: subtractDays(3),
  },
  {
    id: "dog-rio",
    clientId: "client-van-dijk",
    name: "Rio",
    photoUrl: null,
    breed: "Malinois",
    sex: "M",
    dob: "2020-02-20",
    medicalFlags: ["NSAID sensitive"],
    triggers: ["strangers approaching fast"],
    tags: ["bite-work"],
    consentInternal: true,
    consentShareLater: false,
    activePlanId: "plan-rio-bite",
    lastSessionDate: subtractDays(5),
  },
];

export const plans: Plan[] = [
  {
    id: "plan-luna-reactivity",
    dogId: "dog-luna",
    templateName: "Reactivity Starter",
    status: "active",
    assignedOn: subtractDays(14),
    milestones: [
      {
        id: "ms1",
        title: "Threshold Discovery",
        criteria: "Baseline calm at 15m distance",
        done: true,
        completedAt: subtractDays(7),
      },
      {
        id: "ms2",
        title: "LAT at Distance",
        criteria: "3 calm reps with jogger trigger",
        done: false,
        completedAt: null,
      },
      {
        id: "ms3",
        title: "Emergency U-turn",
        criteria: "Auto cue with recovery < 10s",
        done: false,
        completedAt: null,
      },
    ],
  },
  {
    id: "plan-max-recall",
    dogId: "dog-max",
    templateName: "Recall Accelerator",
    status: "active",
    assignedOn: subtractDays(21),
    milestones: [
      {
        id: "recall-1",
        title: "Indoor reliability",
        criteria: "5m, 100% success",
        done: true,
        completedAt: subtractDays(14),
      },
      {
        id: "recall-2",
        title: "Outdoor 10m",
        criteria: "80% success low distraction",
        done: true,
        completedAt: subtractDays(7),
      },
      {
        id: "recall-3",
        title: "Long line 20m",
        criteria: "Variable reinforcement",
        done: false,
        completedAt: null,
      },
    ],
  },
  {
    id: "plan-rio-bite",
    dogId: "dog-rio",
    templateName: "Bite-work Foundations",
    status: "paused",
    assignedOn: subtractDays(35),
    milestones: [
      {
        id: "bite-1",
        title: "Clean grip",
        criteria: "3s hold on sleeve",
        done: true,
        completedAt: subtractDays(28),
      },
      {
        id: "bite-2",
        title: "Out on cue",
        criteria: "Release and re-engage x3",
        done: false,
        completedAt: null,
      },
      {
        id: "bite-3",
        title: "Targeting consistency",
        criteria: "Forearm target 90%",
        done: false,
        completedAt: null,
      },
    ],
  },
];

export const sessions: Session[] = [
  {
    id: "session-luna-1",
    dogId: "dog-luna",
    trainerId: "user-trainer-1",
    datetime: now.toISOString(),
    location: "Vondelpark",
    durationMin: 60,
    status: "scheduled",
    objectives: ["LAT warm-up", "Emergency U-turn reps", "Neutral dog pass-bys"],
    scorecards: [
      { skill: "Focus", score: 3 },
      { skill: "Recovery", score: 4 },
    ],
    notes: "Plan to use distance of 20m from joggers. Bring high value treats.",
    mediaIds: ["media-luna-clip"],
    nextSteps: [
      {
        text: "Share recap with Emma",
        due: addDays(2),
        status: "open",
      },
    ],
    packageId: "package-hart-10pack",
    travelMinutes: 25,
    bufferMinutes: 10,
  },
  {
    id: "session-max-1",
    dogId: "dog-max",
    trainerId: "user-trainer-1",
    datetime: subtractDays(3),
    location: "Sloterpark",
    durationMin: 55,
    status: "done",
    objectives: ["Long line recall 20m", "Distraction ladder with toys"],
    scorecards: [
      { skill: "Recall", score: 4 },
      { skill: "Impulse control", score: 3 },
    ],
    notes:
      "Great response with toy distraction. Needs work on recall while sniffing.",
    mediaIds: [],
    nextSteps: [
      {
        text: "Assign homework video",
        due: subtractDays(2),
        status: "done",
      },
    ],
    packageId: "package-hart-10pack",
    travelMinutes: 20,
    bufferMinutes: 10,
  },
  {
    id: "session-rio-1",
    dogId: "dog-rio",
    trainerId: "user-owner",
    datetime: subtractDays(5),
    location: "Training field Westpoort",
    durationMin: 70,
    status: "done",
    objectives: ["Sleeve engagement warm-up", "Out and re-engage drills"],
    scorecards: [
      { skill: "Grip", score: 5 },
      { skill: "Out cue", score: 2 },
    ],
    notes: "Rio needs more structure before re-engaging to avoid spinning.",
    mediaIds: ["media-rio-photo"],
    nextSteps: [
      {
        text: "Schedule bite suit session",
        due: addDays(4),
        status: "open",
      },
    ],
    packageId: "package-vandijk-5pack",
    travelMinutes: 30,
    bufferMinutes: 15,
  },
];

export const tasks: Task[] = [
  {
    id: "task-luna-checkin",
    title: "Check owner progress: Luna",
    due: addDays(2),
    assigneeId: "user-trainer-1",
    relatedType: "dog",
    relatedId: "dog-luna",
    status: "inbox",
    priority: "medium",
    notes: "Ask about jogger recovery homework.",
  },
  {
    id: "task-max-progress",
    title: "Progress review: Max",
    due: now.toISOString(),
    assigneeId: "user-owner",
    relatedType: "dog",
    relatedId: "dog-max",
    status: "doing",
    priority: "high",
    notes: null,
  },
  {
    id: "task-rio-followup",
    title: "Send bite-work footage to Jeroen",
    due: subtractDays(1),
    assigneeId: "user-assistant-1",
    relatedType: "client",
    relatedId: "client-van-dijk",
    status: "waiting",
    priority: "medium",
    notes: "Include timestamp notes.",
  },
];

export const mediaLibrary: Media[] = [
  {
    id: "media-luna-clip",
    url: "https://placehold.co/600x400/orange/white?text=Luna+Session",
    thumbUrl: "https://placehold.co/300x200/orange/white?text=Luna",
    dogId: "dog-luna",
    sessionId: "session-luna-1",
    tags: ["reactivity", "lat"],
    consentScope: "share_later",
    uploadedAt: now.toISOString(),
  },
  {
    id: "media-rio-photo",
    url: "https://placehold.co/600x400/222/fff?text=Rio+Bitework",
    thumbUrl: "https://placehold.co/300x200/222/fff?text=Rio",
    dogId: "dog-rio",
    sessionId: "session-rio-1",
    tags: ["bite-work"],
    consentScope: "internal",
    uploadedAt: subtractDays(2),
  },
];

export const packages: Package[] = [
  {
    id: "package-hart-10pack",
    clientId: "client-hart",
    type: "10-pack",
    totalCredits: 10,
    usedCredits: 8,
    price: 95000,
    currency: "EUR",
    expiresOn: addDays(60),
  },
  {
    id: "package-vandijk-5pack",
    clientId: "client-van-dijk",
    type: "5-pack",
    totalCredits: 5,
    usedCredits: 4,
    price: 52500,
    currency: "EUR",
    expiresOn: addDays(30),
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv-2024-001",
    clientId: "client-hart",
    status: "issued",
    total: 47500,
    currency: "EUR",
    issuedOn: subtractDays(5),
    paidOn: null,
  },
  {
    id: "inv-2024-002",
    clientId: "client-van-dijk",
    status: "paid",
    total: 52500,
    currency: "EUR",
    issuedOn: subtractDays(10),
    paidOn: subtractDays(8),
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    actorId: "user-owner",
    action: "session.completed",
    entityType: "session",
    entityId: "session-max-1",
    summary: "Completed session & decremented package.",
    beforeSnapshot: null,
    afterSnapshot: JSON.stringify({ status: "done" }),
    createdAt: subtractDays(3),
  },
  {
    id: "audit-2",
    actorId: "user-trainer-1",
    action: "task.created",
    entityType: "task",
    entityId: "task-luna-checkin",
    summary: "Automation created 48h check-in.",
    beforeSnapshot: null,
    afterSnapshot: JSON.stringify({ status: "inbox" }),
    createdAt: now.toISOString(),
  },
];

export const dogLogs: DogLog[] = [
  {
    dogId: "dog-luna",
    updatedAt: now.toISOString(),
  },
  {
    dogId: "dog-max",
    updatedAt: subtractDays(2),
  },
  {
    dogId: "dog-rio",
    updatedAt: subtractDays(1),
  },
];

export const dogTimeline: DogTimelineEntry[] = [
  {
    id: "timeline-luna-1",
    dogId: "dog-luna",
    type: "session",
    occurredAt: sessions[0].datetime,
    title: "Session scheduled",
    summary: "LAT focus with joggers, emergency U-turn practice.",
  },
  {
    id: "timeline-max-1",
    dogId: "dog-max",
    type: "task",
    occurredAt: tasks[1].due!,
    title: "Progress review scheduled",
    summary: "Check in after long line reps.",
  },
  {
    id: "timeline-rio-1",
    dogId: "dog-rio",
    type: "note",
    occurredAt: sessions[2].datetime,
    title: "Trainer note",
    summary: "Needs calmer transition before re-engaging.",
  },
];

export const clientDocuments: ClientDocument[] = [
  {
    id: "doc-hart-waiver",
    clientId: "client-hart",
    name: "Service agreement.pdf",
    uploadedAt: subtractDays(25),
  },
];

export const clientNotes: ClientNote[] = [
  {
    id: "note-hart-1",
    clientId: "client-hart",
    body: "Confirmed availability for Tuesday mornings; prefers WhatsApp updates.",
    createdAt: subtractDays(3),
  },
  {
    id: "note-vandijk-1",
    clientId: "client-van-dijk",
    body: "Requested invoice breakdown per session last month.",
    createdAt: subtractDays(8),
  },
];

export const settingsSnapshot: SettingsSnapshot = {
  travelBufferMinutes: 15,
  availability: [
    { day: "Monday", from: "08:00", to: "16:00" },
    { day: "Tuesday", from: "08:00", to: "18:00" },
    { day: "Thursday", from: "09:00", to: "17:00" },
  ],
};
