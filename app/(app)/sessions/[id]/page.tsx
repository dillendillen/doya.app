import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionById } from "@/lib/data/sessions";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SessionDetailPageProps = {
  params: { id: string };
};

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const session = getSessionById(params.id);

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopBar
        title={`Session · ${session.dogName}`}
        actions={[
          { label: "Start Timer" },
          { label: "Complete Session" },
        ]}
      />

      <Card>
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-neutral-500">When</p>
            <p className="text-sm font-medium text-brand-secondary">
              {format(parseISO(session.datetime), "PPP · HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">Location</p>
            <p className="text-sm text-neutral-600">{session.location}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-500">Trainer</p>
            <p className="text-sm text-neutral-600">{session.trainerName}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
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
          <span className="text-sm text-neutral-500">
            Duration {session.durationMin} min
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Objectives">
          <ul className="space-y-2 text-sm text-neutral-600">
            {session.objectives.map((objective, index) => (
              <li key={index} className="rounded-lg border border-neutral-200 p-3">
                {objective}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Scorecards">
          <ul className="space-y-2 text-sm text-neutral-600">
            {session.scorecards.map((item, index) => (
              <li
                key={`${item.skill}-${index}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
              >
                <span>{item.skill}</span>
                <Badge variant="muted">{item.score}/5</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Notes">
        <p className="whitespace-pre-line text-sm text-neutral-700">
          {session.notes || "Notes will be captured here."}
        </p>
      </Card>

      <Card title="Next Steps">
        <ul className="space-y-2 text-sm text-neutral-600">
          {session.nextSteps.map((step, index) => (
            <li
              key={`${step.text}-${index}`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
            >
              <div>
                <p className="font-medium text-brand-secondary">{step.text}</p>
                <p className="text-xs text-neutral-500">
                  Due {step.due ? format(parseISO(step.due), "MMM d") : "Flexible"}
                </p>
              </div>
              <Badge variant={step.status === "done" ? "success" : "warning"}>
                {step.status}
              </Badge>
            </li>
          ))}
          {session.nextSteps.length === 0 && (
            <p className="text-neutral-500">No follow-up steps captured.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}
