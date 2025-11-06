import { getTaskBoard } from "@/lib/data/tasks";
import { listDogsForQuickCreate } from "@/lib/data/dogs";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export default async function TasksPage() {
  const [columns, dogs, clients] = await Promise.all([
    getTaskBoard(),
    listDogsForQuickCreate(),
    listClientsForQuickCreate(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Tasks & Follow-ups"
        actions={[
          {
            key: "new-task",
            node: <NewTaskButton dogs={dogs} clients={clients} />,
          },
        ]}
      />

      <KanbanBoard initialColumns={columns} dogs={dogs} clients={clients} />
    </div>
  );
}

