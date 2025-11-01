import { addDays } from "date-fns";
import Link from "next/link";
import { listSessionsForRange } from "@/lib/data/sessions";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";

export default function SessionsPage() {
  const start = new Date();
  const end = addDays(start, 7);
  const sessions = listSessionsForRange(start.toISOString(), end.toISOString());

  return (
    <div className="space-y-6">
      <TopBar
        title="Sessions"
        actions={[
          { label: "New Session" },
          { label: "Add Objective" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-secondary">
                {session.dogName}
              </p>
              <Badge variant="muted">{session.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {new Date(session.datetime).toLocaleString()} · {session.location}
            </p>
            <p className="mt-2 text-xs uppercase text-neutral-500">
              Trainer
            </p>
            <p className="text-sm text-neutral-600">{session.trainerName}</p>
            <Link
              href={`/sessions/${session.id}`}
              className="mt-3 inline-flex text-sm font-medium text-brand-secondary"
            >
              Open session →
            </Link>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Showing sessions between {start.toDateString()} and {end.toDateString()}
        . Adjust filters in upcoming iterations for calendar views.
      </p>
    </div>
  );
}
