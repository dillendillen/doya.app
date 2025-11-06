import { TaskPriority, TaskStatus } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type TaskStatusLabel = "inbox" | "doing" | "waiting" | "done";
export type TaskPriorityLabel = "low" | "medium" | "high";

export type TaskBoardItem = {
  id: string;
  title: string;
  due: string | null;
  assigneeId: string;
  relatedType: "dog" | "session" | "client";
  relatedId: string;
  status: TaskStatusLabel;
  priority: TaskPriorityLabel;
  notes: string | null;
};

export type TaskBoardColumn = {
  status: TaskStatusLabel;
  items: TaskBoardItem[];
};

const STATUS_ORDER: TaskStatusLabel[] = ["inbox", "doing", "waiting", "done"];

const STATUS_MAP: Record<TaskStatus, TaskStatusLabel> = {
  INBOX: "inbox",
  DOING: "doing",
  WAITING: "waiting",
  DONE: "done",
};

const PRIORITY_MAP: Record<TaskPriority, TaskPriorityLabel> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export async function getTaskBoard(): Promise<TaskBoardColumn[]> {
  if (!isDatabaseConfigured()) {
    return STATUS_ORDER.map((status) => ({ status, items: [] }));
  }

  const rows = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { due: "asc" }, { title: "asc" }],
  });

  const grouped: Record<TaskStatusLabel, TaskBoardItem[]> = {
    inbox: [],
    doing: [],
    waiting: [],
    done: [],
  };

  for (const task of rows) {
    const status = STATUS_MAP[task.status];
    let relatedType: "dog" | "session" | "client" = "dog";
    let relatedId =
      task.relatedDogId ?? task.relatedSessionId ?? task.relatedClientId ?? task.id;

    if (task.relatedSessionId) {
      relatedType = "session";
    } else if (task.relatedClientId) {
      relatedType = "client";
    }

    grouped[status].push({
      id: task.id,
      title: task.title,
      due: task.due?.toISOString() ?? null,
      assigneeId: task.assigneeId,
      relatedType,
      relatedId,
      status,
      priority: PRIORITY_MAP[task.priority],
      notes: task.notes,
    });
  }

  for (const status of STATUS_ORDER) {
    grouped[status].sort((a, b) => {
      const dueA = a.due ?? "9999-12-31";
      const dueB = b.due ?? "9999-12-31";
      if (dueA === dueB) {
        return a.title.localeCompare(b.title);
      }
      return dueA.localeCompare(dueB);
    });
  }

  return STATUS_ORDER.map((status) => ({
    status,
    items: grouped[status],
  }));
}
