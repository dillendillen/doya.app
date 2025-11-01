import { getTaskBoard } from "@/lib/data/tasks";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";

export default function TasksPage() {
  const columns = getTaskBoard();

  return (
    <div className="space-y-6">
      <TopBar
        title="Tasks & Follow-ups"
        actions={[
          { label: "New Task" },
          { label: "Batch Complete" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.status}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {column.status}
              </h2>
              <Badge variant="muted">{column.items.length}</Badge>
            </div>
            <div className="space-y-3">
              {column.items.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-neutral-200 p-3 text-sm text-neutral-600"
                >
                  <p className="font-medium text-brand-secondary">{task.title}</p>
                  <p className="text-xs uppercase text-neutral-500">
                    {task.relatedType} ·{" "}
                    {task.due ? new Date(task.due).toLocaleDateString() : "Flexible"}
                  </p>
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "danger"
                        : task.priority === "medium"
                          ? "warning"
                          : "muted"
                    }
                    className="mt-2"
                  >
                    {task.priority}
                  </Badge>
                </article>
              ))}
              {column.items.length === 0 && (
                <p className="text-sm text-neutral-500">
                  No items in this stage yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
