export type Role = "owner" | "trainer" | "assistant" | "finance";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locale: "en" | "nl";
  workingHours: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  language: "EN" | "NL";
  referral: string | null;
  vatId: string | null;
  notes: string | null;
};

export type Dog = {
  id: string;
  clientId: string;
  name: string;
  photoUrl: string | null;
  breed: string;
  sex: "M" | "F";
  dob: string | null;
  medicalFlags: string[];
  triggers: string[];
  tags: string[];
  consentInternal: boolean;
  consentShareLater: boolean;
  activePlanId: string | null;
  lastSessionDate: string | null;
};

export type PlanMilestone = {
  id: string;
  title: string;
  criteria: string;
  done: boolean;
  completedAt: string | null;
};

export type Plan = {
  id: string;
  dogId: string;
  templateName: string;
  status: "active" | "paused" | "completed";
  assignedOn: string;
  milestones: PlanMilestone[];
};

export type Session = {
  id: string;
  dogId: string;
  trainerId: string;
  datetime: string;
  location: string;
  durationMin: number;
  status: "scheduled" | "in_progress" | "done";
  objectives: string[];
  scorecards: Array<{ skill: string; score: number }>;
  notes: string;
  mediaIds: string[];
  packageId: string | null;
  nextSteps: Array<{ text: string; due: string | null; status: "open" | "done" }>;
  travelMinutes: number;
  bufferMinutes: number;
};

export type TaskStatus = "inbox" | "doing" | "waiting" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  due: string | null;
  assigneeId: string;
  relatedType: "dog" | "session" | "client";
  relatedId: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string | null;
};

export type Media = {
  id: string;
  url: string;
  thumbUrl: string | null;
  dogId: string;
  sessionId: string | null;
  tags: string[];
  consentScope: "internal" | "share_later";
  uploadedAt: string;
};

export type Package = {
  id: string;
  clientId: string;
  type: string;
  totalCredits: number;
  usedCredits: number;
  price: number;
  currency: string;
  expiresOn: string | null;
};

export type Invoice = {
  id: string;
  clientId: string;
  status: "draft" | "issued" | "paid";
  total: number;
  currency: string;
  issuedOn: string | null;
  paidOn: string | null;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  beforeSnapshot: string | null;
  afterSnapshot: string | null;
  createdAt: string;
};
