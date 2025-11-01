import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getDogById } from "@/lib/data/dogs";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

type DogDetailPageProps = {
  params: { id: string };
};

export default function DogDetailPage({ params }: DogDetailPageProps) {
  const dog = getDogById(params.id);

  if (!dog) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopBar
        title={dog.name}
        actions={[
          { label: "Add Note" },
          { label: "Upload Media" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card>
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar label={dog.name} src={dog.photoUrl} className="h-24 w-24" />
            <div>
              <h2 className="text-lg font-semibold text-brand-secondary">
                {dog.name}
              </h2>
              <p className="text-sm text-neutral-600">{dog.breed}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {dog.tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="w-full rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
              <p>
                <span className="font-medium text-neutral-800">Client:</span>{" "}
                <Link
                  href={`/clients/${dog.clientId}`}
                  className="text-brand-secondary"
                >
                  {dog.clientName}
                </Link>
              </p>
              <p>
                <span className="font-medium text-neutral-800">Sex:</span>{" "}
                {dog.sex === "M" ? "Male" : "Female"}
              </p>
              {dog.dob && (
                <p>
                  <span className="font-medium text-neutral-800">DOB:</span>{" "}
                  {format(parseISO(dog.dob), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Bio">
            <dl className="grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-neutral-500">
                  Medical Flags
                </dt>
                <dd>
                  {dog.medicalFlags.length > 0
                    ? dog.medicalFlags.join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">
                  Triggers
                </dt>
                <dd>
                  {dog.triggers.length > 0
                    ? dog.triggers.join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">
                  Consents
                </dt>
                <dd>
                  Media internal: {dog.consentInternal ? "Yes" : "No"} · Share
                  later: {dog.consentShareLater ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">
                  Last Session
                </dt>
                <dd>
                  {dog.lastSessionDate
                    ? format(parseISO(dog.lastSessionDate), "PPP")
                    : "Not yet"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Active Plan & Milestones">
            {dog.plans.length === 0 ? (
              <p className="text-sm text-neutral-500">No plans assigned.</p>
            ) : (
              <div className="space-y-4">
                {dog.plans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-secondary">
                          {plan.templateName}
                        </p>
                        <p className="text-xs uppercase text-neutral-500">
                          {plan.status} · Assigned{" "}
                          {format(parseISO(plan.assignedOn), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-xs font-medium text-brand-secondary"
                      >
                        View plan →
                      </Link>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {plan.milestones.slice(0, 4).map((milestone) => (
                        <li
                          key={milestone.id}
                          className="flex items-start gap-2 text-sm text-neutral-600"
                        >
                          <Badge
                            variant={milestone.done ? "success" : "muted"}
                            className="mt-0.5"
                          >
                            {milestone.done ? "Done" : "Open"}
                          </Badge>
                          <span>
                            <span className="font-medium text-brand-secondary">
                              {milestone.title}
                            </span>
                            : {milestone.criteria}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Recent Sessions">
            {dog.sessions.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No sessions logged yet.
              </p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {dog.sessions.slice(0, 5).map((session) => (
                  <li
                    key={session.id}
                    className="rounded-lg border border-neutral-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-brand-secondary">
                        {format(parseISO(session.datetime), "MMM d, HH:mm")} ·{" "}
                        {session.location}
                      </p>
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
                    </div>
                    <p className="mt-2 text-xs uppercase text-neutral-500">
                      Objectives
                    </p>
                    <p>{session.objectives.join(", ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Timeline">
            {dog.timeline.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Timeline updates will appear here.
              </p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {dog.timeline.map((item) => (
                  <li key={item.id} className="border-l-2 border-brand-primary pl-3">
                    <p className="text-xs uppercase text-neutral-500">
                      {item.type} ·{" "}
                      {format(parseISO(item.occurredAt), "MMM d, HH:mm")}
                    </p>
                    <p className="font-medium text-brand-secondary">
                      {item.title}
                    </p>
                    <p>{item.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
