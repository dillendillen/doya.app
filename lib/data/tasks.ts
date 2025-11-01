import { tasks } from "../mock-data";
import type { Task, TaskStatus } from "../types";

export type TaskBoardColumn = {
  status: TaskStatus;
  items: Task[];
};

const STATUS_ORDER: TaskStatus[] = ["inbox", "doing", "waiting", "done"];

export function getTaskBoard(): TaskBoardColumn[] {
  const grouped: Record<TaskStatus, Task[]> = {
    inbox: [],
    doing: [],
    waiting: [],
    done: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
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
