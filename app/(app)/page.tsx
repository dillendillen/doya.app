import { clsx } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link";
import { getDashboardData } from "@/lib/data/dashboard";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { listDogsForQuickCreate } from "@/lib/data/dogs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { TopBar } from "@/components/layout/top-bar";
import { NewDogButton } from "@/components/dashboard/new-dog-button";
import { NewClientButton } from "@/components/dashboard/new-client-button";
import { NewSessionButton } from "@/components/dashboard/new-session-button";
import { StartSessionButton } from "@/components/dashboard/start-session-button";

const actionSeverityVariant: Record<
  "low" | "medium" | "high",
  "muted" | "warning" | "danger"
> = {
  low: "muted",
  medium: "warning",
  high: "danger",
};

const actionTypeLabel: Record<
  "invoice" | "document" | "task" | "media" | "booking",
  string
> = {
  invoice: "Billing",
  document: "Docs",
  task: "Follow-up",
  media: "Media",
  booking: "Booking",
};

const actionHighlightClass: Record<
  "invoice" | "document" | "task" | "media" | "booking",
  string
> = {
  invoice:
    "bg-gradient-to-r from-brand-primary/10 via-amber-100/40 to-transparent border-brand-primary/40",
  document:
    "bg-gradient-to-r from-brand-accent/10 via-white to-transparent border-brand-accent/50",
  task:
    "bg-gradient-to-r from-rose-100/70 via-white to-transparent border-rose-200/80",
  media:
    "bg-gradient-to-r from-sky-100/70 via-white to-transparent border-sky-200/70",
  booking:
    "bg-gradient-to-r from-emerald-100/70 via-white to-transparent border-emerald-200/80",
};

const sessionHighlightClass: Record<
  "scheduled" | "in_progress" | "done",
  string
> = {
  scheduled:
    "border-brand-primary/40 bg-gradient-to-r from-brand-primary/10 to-white hover:border-brand-primary hover:shadow-md",
  in_progress:
    "border-brand-accent/60 bg-gradient-to-r from-brand-accent/20 to-white hover:border-brand-accent hover:shadow-md",
  done:
    "border-emerald-200 bg-gradient-to-r from-emerald-100/60 to-white hover:border-emerald-300 hover:shadow-md",
};

type QuickCaptureAction =
  | {
      key: string;
      label: string;
      description: string;
      type: "default";
    }
  | {
      key: string;
      label: string;
      description: string;
      type: "new-dog";
    }
  | {
      key: string;
      label: string;
      description: string;
      type: "new-client";
    }
  | {
      key: string;
      label: string;
      description: string;
      type: "new-session";
    };

const quickCaptureActions: QuickCaptureAction[] = [
  {
    key: "session",
    label: "New Session",
    description: "Schedule or jump into Live Mode.",
    type: "new-session",
  },
  {
    key: "dog",
    label: "Add Dog",
    description: "Create profile, flags, and plan scaffold.",
    type: "new-dog",
  },
  {
    key: "client",
    label: "Add Client",
    description: "Convert a lead and link dogs.",
    type: "new-client",
  },
  {
    key: "booking",
    label: "New Booking",
    description: "Place on calendar with buffers.",
    type: "default",
  },
  {
    key: "media",
    label: "Upload Media",
    description: "Tag clips before sharing later.",
    type: "default",
  },
  {
    key: "invoice",
    label: "Create Invoice",
    description: "Bill sessions or products on the fly.",
    type: "default",
  },
];

function safeParseISO(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMoney(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}

export default async function DashboardPage() {
  const todayIso = new Date().toISOString();
  const [dashboard, clientOptions, dogOptions] = await Promise.all([
    getDashboardData(todayIso),
    listClientsForQuickCreate(),
    listDogsForQuickCreate(),
  ]);

  const bookedHours = dashboard.stats.bookedMinutesThisWeek / 60;
  const capacityHours = dashboard.stats.capacityMinutesThisWeek / 60;
  const utilization =
    capacityHours > 0
      ? Math.round((dashboard.stats.bookedMinutesThisWeek / dashboard.stats.capacityMinutesThisWeek) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <TopBar
        title="Dashboard"
        actions={[
          {
            key: "start-session",
            node: (
              <StartSessionButton
                sessions={dashboard.sessions.map((s) => ({
                  id: s.id,
                  startTime: s.startTime,
                  dogName: s.dogName,
                  location: s.location,
                  dogId: s.dogId,
                }))}
              />
            ),
          },
          {
            key: "new-session",
            node: (
              <NewSessionButton
                variant="topbar"
                dogs={dogOptions}
                clients={clientOptions}
              />
            ),
          },
          { key: "add-client", node: <NewClientButton variant="topbar" /> },
          {
            key: "add-dog",
            node: <NewDogButton variant="topbar" clients={clientOptions} />,
          },
          { label: "New Booking" },
          { label: "Upload Media" },
          { label: "Create Invoice" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <Card
          title="Today at a Glance"
          className="xl:col-span-2 border-brand-primary/30 bg-gradient-to-br from-white via-white to-brand-primary/10"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Sessions today
                </p>
                <p className="text-2xl font-semibold text-brand-secondary">
                  {dashboard.sessions.length}
                </p>
              </div>
              <div className="text-sm text-neutral-500">
                <p>
                  Travel {dashboard.travel.totalTravelMinutes} min · Buffers{" "}
                  {dashboard.travel.totalBufferMinutes} min
                </p>
                <p>Leave by {dashboard.travel.leaveBy ?? "—"}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {dashboard.sessions.map((session) => {
                const startTime = safeParseISO(session.startTime);
                const actionLabel =
                  session.status === "scheduled"
                    ? "Start session"
                    : session.status === "in_progress"
                      ? "Resume"
                      : "Review notes";
                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className={clsx(
                      "flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-lg",
                      sessionHighlightClass[session.status],
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-secondary">
                        {session.dogName}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {startTime ? format(startTime, "HH:mm") : "—"} ·{" "}
                        {session.location}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-neutral-400">
                        {session.clientName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          session.status === "done"
                            ? "success"
                            : session.status === "in_progress"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {session.status.replace("_", " ")}
                      </Badge>
                      <span className="rounded-lg border border-transparent bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-secondary shadow-sm">
                        {actionLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {dashboard.sessions.length === 0 && (
                <li className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-sm text-neutral-500">
                  No sessions scheduled — add one from the calendar or Quick Capture.
                </li>
              )}
            </ul>
          </div>
        </Card>

        <Card
          title="Action Queue"
          className="border-brand-secondary/20 bg-gradient-to-br from-brand-surface via-white to-white"
        >
          <ul className="space-y-3">
            {dashboard.actionQueue.map((item) => {
              const dueDate = safeParseISO(item.due);
              return (
                <li
                  key={item.id}
                  className={clsx(
                    "rounded-xl border px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                    actionHighlightClass[item.type],
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-secondary">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-500">{item.detail}</p>
                    </div>
                    <Badge variant={actionSeverityVariant[item.severity]}>
                      {actionTypeLabel[item.type]}
                    </Badge>
                  </div>
                  {dueDate && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Due {format(dueDate, "MMM d")} ·{" "}
                      {formatDistanceToNow(dueDate, { addSuffix: true })}
                    </p>
                  )}
                </li>
              );
            })}
            {dashboard.actionQueue.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-200 px-3 py-6 text-sm text-neutral-500">
                Nothing queued — you’re fully caught up.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Quick Capture"
          className="bg-gradient-to-br from-white via-white to-brand-surface"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {quickCaptureActions.map((action, index) => {
              switch (action.type) {
                case "new-dog":
                  return (
                    <NewDogButton
                      key={action.key}
                      variant="quickCapture"
                      clients={clientOptions}
                    />
                  );
                case "new-client":
                  return (
                    <NewClientButton key={action.key} variant="quickCapture" />
                  );
                case "new-session":
                  return (
                    <NewSessionButton
                      key={action.key}
                      variant="quickCapture"
                      dogs={dogOptions}
                      clients={clientOptions}
                    />
                  );
                default:
                  return (
                    <button
                      type="button"
                      key={action.key}
                      className={clsx(
                        "group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl px-4 py-4 text-left text-sm font-medium text-white shadow-sm ring-brand-primary/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        index % 2 === 0
                          ? "bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-secondary"
                          : "bg-gradient-to-br from-brand-secondary via-brand-secondary/90 to-brand-primary",
                        "hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5",
                      )}
                    >
                      <span className="text-base font-semibold">
                        {action.label}
                      </span>
                      <span className="text-xs font-normal text-white/80">
                        {action.description}
                      </span>
                    </button>
                  );
              }
            })}
          </div>
        </Card>

        <Card
          title="KPI Tiles"
          className="lg:col-span-2 border-brand-secondary/20 bg-gradient-to-br from-white via-brand-surface/40 to-white"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-white to-white px-4 py-3 text-brand-secondary shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-primary hover:shadow-lg">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Booked vs Capacity
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {bookedHours.toFixed(1)}h / {capacityHours.toFixed(1)}h
              </p>
              <p className="text-xs text-neutral-500">{utilization}% utilized</p>
            </div>
            <div className="rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-100/60 via-white to-white px-4 py-3 text-brand-secondary shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Cancellations / No-shows
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {dashboard.stats.cancellationsThisWeek}
              </p>
              <p className="text-xs text-neutral-500">This week</p>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-100/60 via-white to-white px-4 py-3 text-brand-secondary shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Revenue MTD
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {formatMoney(
                  dashboard.stats.revenueMonthToDate,
                  dashboard.stats.primaryCurrency,
                )}
              </p>
              <p className="text-xs text-neutral-500">Recognized payments</p>
            </div>
            <div className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-100/70 via-white to-white px-4 py-3 text-brand-secondary shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Outstanding Invoices
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-secondary">
                {formatMoney(
                  dashboard.stats.outstandingInvoicesTotal,
                  dashboard.stats.primaryCurrency,
                )}
              </p>
              <p className="text-xs text-neutral-500">
                {dashboard.stats.outstandingInvoicesCount} open
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent Activity">
          <ul className="space-y-3">
            {dashboard.recentActivity.map((event, index) => {
              const timestamp = safeParseISO(event.timestamp);
              return (
                <li
                  key={event.id}
                  className={clsx(
                    "rounded-xl border px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                    index % 2 === 0
                      ? "bg-gradient-to-r from-brand-accent/15 via-white to-white border-brand-accent/40"
                      : "bg-gradient-to-r from-brand-primary/12 via-white to-white border-brand-primary/35",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-secondary">
                        {event.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {event.description}
                      </p>
                      {event.actor && (
                        <p className="text-xs text-neutral-400">
                          {event.actor}
                        </p>
                      )}
                    </div>
                    {timestamp && (
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {dashboard.recentActivity.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-200 px-3 py-6 text-sm text-neutral-500">
                No recent activity tracked yet.
              </li>
            )}
          </ul>
        </Card>

        <Card title="Watchlist">
          <ul className="space-y-3">
            {dashboard.watchlist.map((item) => {
              const lastTouched = safeParseISO(item.lastInteractionAt);
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-brand-secondary">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500">{item.reason}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="muted">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant="danger">
                      {item.entityType === "dog" ? "Dog" : "Client"}
                    </Badge>
                  </div>
                  {lastTouched && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Last activity{" "}
                      {formatDistanceToNow(lastTouched, { addSuffix: true })}
                    </p>
                  )}
                </li>
              );
            })}
            {dashboard.watchlist.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-200 px-3 py-6 text-sm text-neutral-500">
                No pins yet — flag dogs or clients that need attention.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Training Focus Tags">
          <ul className="space-y-4">
            {dashboard.focusTags.map((tag) => (
              <li
                key={tag.tag}
                className="space-y-2 rounded-xl border border-neutral-200/70 p-3"
              >
                <div className="flex items-center justify-between text-sm font-medium text-brand-secondary">
                  <span className="uppercase tracking-wide text-neutral-500">
                    #{tag.tag}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-neutral-500">
                    {tag.dogCount} dog{tag.dogCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-200">
                  <div
                    className="h-2 rounded-full bg-brand-primary"
                    style={{ width: `${tag.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  {tag.percentage}% of active dogs focus here.
                </p>
              </li>
            ))}
            {dashboard.focusTags.length === 0 && (
              <p className="text-sm text-neutral-500">
                No focus tags have been recorded yet.
              </p>
            )}
          </ul>
        </Card>

        <Card title="Active Plan Insights">
          <ul className="space-y-4">
            {dashboard.planInsights.map((plan) => (
              <li
                key={plan.planId}
                className="rounded-xl border border-neutral-200/70 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-secondary">
                      {plan.dogName}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      {plan.templateName}
                    </p>
                  </div>
                  <Badge
                    variant={
                      plan.progressPercent >= 75
                        ? "success"
                        : plan.progressPercent >= 40
                          ? "warning"
                          : "muted"
                    }
                  >
                    {plan.progressPercent}% complete
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-neutral-200">
                    <div
                      className="h-2 rounded-full bg-brand-secondary"
                      style={{ width: `${plan.progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">
                    {plan.completedMilestones}/{plan.totalMilestones} milestones complete
                  </p>
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  {plan.nextMilestoneTitle ? (
                    <p>
                      Next:{" "}
                      <span className="font-medium text-brand-secondary">
                        {plan.nextMilestoneTitle}
                      </span>
                      {plan.nextMilestoneCriteria
                        ? ` — ${plan.nextMilestoneCriteria}`
                        : null}
                    </p>
                  ) : (
                    <p>All milestones completed.</p>
                  )}
                  {plan.lastCompletedAt ? (
                    <p>
                      Last milestone on{" "}
                      {format(parseISO(plan.lastCompletedAt), "MMM d, HH:mm")}
                    </p>
                  ) : (
                    <p>No milestone completed yet.</p>
                  )}
                </div>
              </li>
            ))}
            {dashboard.planInsights.length === 0 && (
              <p className="text-sm text-neutral-500">
                There are no active plans to review.
              </p>
            )}
          </ul>
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
            {dashboard.tasksDue.map((task) => {
              const dueDate = safeParseISO(task.due);
              return (
                <li key={task.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-brand-secondary">
                      {task.title}
                    </p>
                    <Badge variant="warning">
                      {dueDate ? format(dueDate, "MMM d") : "No due"}
                    </Badge>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    {task.dogName ?? "General"} · {task.status}
                  </p>
                </li>
              );
            })}
            {dashboard.tasksDue.length === 0 && (
              <p className="text-sm text-neutral-500">No tasks due today.</p>
            )}
            <Link
              href="/tasks"
              className="mt-3 text-sm font-medium text-brand-secondary hover:text-brand-primary transition"
            >
              View all tasks →
            </Link>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Training Objectives Overview">
          <div className="space-y-3">
            {dashboard.objectives.length === 0 ? (
              <p className="text-sm text-neutral-500">No training objectives tracked yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
                    <p className="text-lg font-bold text-slate-700">
                      {dashboard.objectives.filter((o) => o.status === "planned").length}
                    </p>
                    <p className="text-xs text-slate-600">Planned</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">
                      {dashboard.objectives.filter((o) => o.status === "in_progress").length}
                    </p>
                    <p className="text-xs text-blue-600">In Progress</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center">
                    <p className="text-lg font-bold text-emerald-700">
                      {dashboard.objectives.filter((o) => o.status === "mastered").length}
                    </p>
                    <p className="text-xs text-emerald-600">Mastered</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {dashboard.objectives.slice(0, 10).map((objective) => (
                    <li
                      key={objective.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-brand-secondary">
                          {objective.skill}
                        </p>
                        <p className="text-xs text-neutral-500">{objective.dogName}</p>
                      </div>
                      <Badge
                        variant={
                          objective.status === "mastered"
                            ? "success"
                            : objective.status === "in_progress"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {objective.status.replace("_", " ")}
                      </Badge>
                      <Link
                        href={`/dogs/${objective.dogId}`}
                        className="text-xs font-medium text-brand-secondary hover:text-brand-primary transition"
                      >
                        View →
                      </Link>
                    </li>
                  ))}
                </ul>
                {dashboard.objectives.length > 10 && (
                  <p className="text-xs text-neutral-500 text-center mt-2">
                    Showing 10 of {dashboard.objectives.length} objectives
                  </p>
                )}
              </>
            )}
          </div>
        </Card>

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

        <Card title="Recent Dogs Updated">
          <ul className="grid gap-3 md:grid-cols-2">
            {dashboard.recentDogs.map((dog) => {
              const updatedDate = safeParseISO(dog.updatedAt);
              const updatedLabel = updatedDate
                ? `Updated ${format(updatedDate, "MMM d, HH:mm")}`
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
                  <Link
                    href={`/dogs/${dog.dogId}`}
                    className="text-xs font-medium text-brand-secondary hover:text-brand-primary transition"
                  >
                    View profile →
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
