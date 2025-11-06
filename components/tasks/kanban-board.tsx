"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EditTaskButton } from "./edit-task-button";
import type { TaskBoardColumn, TaskBoardItem } from "@/lib/data/tasks";
import type { DogQuickPick } from "@/lib/data/dogs";
import type { ClientQuickPick } from "@/lib/data/clients";

type KanbanBoardProps = {
  initialColumns: TaskBoardColumn[];
  dogs: DogQuickPick[];
  clients: ClientQuickPick[];
};

const STATUS_COLORS: Record<string, string> = {
  inbox: "bg-gradient-to-br from-slate-100 to-slate-200",
  doing: "bg-gradient-to-br from-emerald-100 to-emerald-200",
  waiting: "bg-gradient-to-br from-amber-100 to-amber-200",
  done: "bg-gradient-to-br from-slate-200 to-slate-300",
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  inbox: "border-slate-300",
  doing: "border-emerald-300",
  waiting: "border-amber-300",
  done: "border-slate-400",
};

export function KanbanBoard({ initialColumns, dogs, clients }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [draggedItem, setDraggedItem] = useState<TaskBoardItem | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);

  const handleDragStart = (item: TaskBoardItem, fromStatus: string) => {
    setDraggedItem(item);
    setDraggedFrom(fromStatus);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (toStatus: string) => {
    if (!draggedItem || !draggedFrom || draggedFrom === toStatus) {
      setDraggedItem(null);
      setDraggedFrom(null);
      return;
    }

    // Optimistic update
    const newColumns = columns.map((col) => {
      if (col.status === draggedFrom) {
        return {
          ...col,
          items: col.items.filter((item) => item.id !== draggedItem.id),
        };
      }
      if (col.status === toStatus) {
        return {
          ...col,
          items: [...col.items, { ...draggedItem, status: toStatus as TaskBoardItem["status"] }],
        };
      }
      return col;
    });
    setColumns(newColumns);
    setDraggedItem(null);
    setDraggedFrom(null);

    // Update in database
    try {
      const statusMap: Record<string, string> = {
        inbox: "INBOX",
        doing: "DOING",
        waiting: "WAITING",
        done: "DONE",
      };

      await fetch(`/api/tasks/${draggedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusMap[toStatus],
        }),
      });

      router.refresh();
    } catch (error) {
      console.error("Failed to update task status", error);
      // Revert on error
      setColumns(initialColumns);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "muted";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div
          key={column.status}
          className={`group relative rounded-3xl border-2 ${STATUS_BORDER_COLORS[column.status]} ${STATUS_COLORS[column.status]} p-5 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.status)}
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-300/50 pb-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">
              {column.status.replace("_", " ")}
            </h2>
            <Badge variant="muted" className="text-xs font-semibold">
              {column.items.length}
            </Badge>
          </div>
          <div className="space-y-3 min-h-[200px]">
            {column.items.map((task) => (
              <article
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task, column.status)}
                className="group/task cursor-move rounded-2xl border-2 border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 text-sm shadow-lg transition-all duration-200 hover:border-brand-primary/50 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5"
              >
                <p className="font-semibold text-brand-secondary mb-1">{task.title}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
                  {task.relatedType} ·{" "}
                  {task.due ? new Date(task.due).toLocaleDateString() : "Flexible"}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                    {task.priority}
                  </Badge>
                  {column.status === "doing" && (
                    <Badge variant="success" className="text-xs">Active</Badge>
                  )}
                </div>
                {task.notes && (
                  <p className="mb-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {task.notes}
                  </p>
                )}
                <div className="flex justify-end opacity-0 transition-opacity group-hover/task:opacity-100">
                  <EditTaskButton task={task} dogs={dogs} clients={clients} />
                </div>
              </article>
            ))}
            {column.items.length === 0 && (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                <p className="text-sm font-medium text-slate-400">
                  Drop tasks here
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

