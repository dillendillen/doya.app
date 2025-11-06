import { startOfMonth, endOfMonth } from "date-fns";
import { TopBar } from "@/components/layout/top-bar";
import { getTaskBoard } from "@/lib/data/tasks";
import { listSessionsForRange } from "@/lib/data/sessions";
import { listDogs } from "@/lib/data/dogs";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [tasks, sessions, dogs] = await Promise.all([
    getTaskBoard(),
    listSessionsForRange(monthStart.toISOString(), monthEnd.toISOString()),
    listDogs(),
  ]);

  // Extract birthdays from dogs (normalize to current year for display)
  const currentYear = new Date().getFullYear();
  const birthdays = dogs
    .map((dog) => {
      if (!dog.dob) return null;
      const dob = new Date(dog.dob);
      // Set to current year for calendar display
      const displayDate = new Date(currentYear, dob.getMonth(), dob.getDate());
      return {
        id: dog.id,
        name: dog.name,
        date: displayDate,
      };
    })
    .filter((b): b is { id: string; name: string; date: Date } => b !== null);

  return (
    <div className="space-y-6">
      <TopBar title="Calendar" actions={[]} />
      <CalendarClient initialTasks={tasks} initialSessions={sessions} birthdays={birthdays} />
    </div>
  );
}

