import { format, parseISO } from "date-fns";
import { getDashboardData } from "@/lib/data/dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardPage() {
  const todayIso = new Date().toISOString();
  const dashboard = getDashboardData(todayIso);

  return (
    <div className="space-y-6">
      <TopBar
        title="Dashboard"
        actions={[
          { label: "New Session" },
          { label: "New Dog" },
          { label: "Add Note" },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Dogs in Training
          </div>
          <div className="mt-2 text-3xl font-semibold text-brand-secondary">
            {dashboard.stats.totalDogs}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Active across all trainers.
          </p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Active Plans
          </div>
          <div className="mt-2 text-3xl font-semibold text-brand-secondary">
            {dashboard.stats.activePlans}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Track milestone progress weekly.
          </p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Sessions Today
          </div>
          <div className="mt-2 text-3xl font-semibold text-brand-secondary">
            {dashboard.stats.sessionsToday}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Stay on time with travel buffers.
          </p>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Travel & Buffers
          </div>
          <div className="mt-2 text-xl font-semibold text-brand-secondary">
            {dashboard.travel.totalTravelMinutes} min travel
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Buffers {dashboard.travel.totalBufferMinutes} min · Leave by{" "}
            {dashboard.travel.leaveBy ?? "—"}
          </p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card title="Today’s Sessions" className="xl:col-span-2">
          <ul className="space-y-4">
            {dashboard.sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200/80 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="muted">
                    {format(parseISO(session.startTime), "HH:mm")}
                  </Badge>
                  <div>
                    <p className="font-medium text-brand-secondary">
                      {session.dogName}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {session.clientName} · {session.location}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    session.status === "done"
                      ? "success"
                      : session.status === "in_progress"
                        ? "warning"
                        : "default"
                  }
                >
                  {session.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
            {dashboard.sessions.length === 0 && (
              <p className="text-sm text-neutral-500">No sessions scheduled.</p>
            )}
          </ul>
        </Card>

        <Card title="Tasks Due">
          <ul className="space-y-4">
            {dashboard.tasksDue.map((task) => (
              <li key={task.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-brand-secondary">
                    {task.title}
                  </p>
                  <Badge variant="warning">
                    {task.due ? format(parseISO(task.due), "MMM d") : "No due"}
                  </Badge>
                </div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  {task.dogName ?? "General"} · {task.status}
                </p>
              </li>
            ))}
            {dashboard.tasksDue.length === 0 && (
              <p className="text-sm text-neutral-500">No tasks due today.</p>
            )}
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-secondary"
            >
              View all tasks →
            </button>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Packages Low">
          <ul className="space-y-3">
            {dashboard.lowPackages.map((pkg) => (
              <li
                key={`${pkg.clientId}-${pkg.packageType}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-secondary">
                    {pkg.clientName}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {pkg.packageType} · {pkg.creditsLeft} credit(s) left
                  </p>
                </div>
                <Badge variant="warning">Reach out</Badge>
              </li>
            ))}
            {dashboard.lowPackages.length === 0 && (
              <p className="text-sm text-neutral-500">
                All packages have ample credits.
              </p>
            )}
          </ul>
        </Card>

        <Card title="Recent Dogs Updated" className="lg:col-span-2">
          <ul className="grid gap-3 md:grid-cols-2">
            {dashboard.recentDogs.map((dog) => {
              const updatedLabel = dog.updatedAt
                ? `Updated ${format(parseISO(dog.updatedAt), "MMM d, HH:mm")}`
                : "No recent activity";
              return (
                <li
                  key={dog.dogId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar label={dog.dogName} />
                    <div>
                      <p className="text-sm font-semibold text-brand-secondary">
                        {dog.dogName}
                      </p>
                      <p className="text-xs text-neutral-500">{updatedLabel}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-secondary"
                  >
                    Continue notes
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
