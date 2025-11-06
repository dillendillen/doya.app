import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO, isSameDay, startOfDay } from "date-fns";
import { getDogById } from "@/lib/data/dogs";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EditDogButton } from "@/components/dogs/edit-dog-button";
import { AddDogNoteButton } from "@/components/dogs/add-dog-note-button";
import { UploadDogMediaButton } from "@/components/dogs/upload-dog-media-button";
import { EditDogNoteButton } from "@/components/dogs/edit-dog-note-button";
import { DeleteNoteButton } from "@/components/dogs/delete-note-button";
import { MediaGallery } from "@/components/dogs/media-gallery";
import { DogProgressTimeline } from "@/components/dogs/dog-progress-timeline";
import { TrainingObjectivesMatrix } from "@/components/dogs/training-objectives-matrix";
import { BehaviorJournal } from "@/components/dogs/behavior-journal";
import { getDogProgress } from "@/lib/data/dog-progress";

type DogDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DogDetailPage({ params }: DogDetailPageProps) {
  const { id } = await params;
  const [dog, clientOptions, progressData] = await Promise.all([
    getDogById(id),
    listClientsForQuickCreate(),
    getDogProgress(id),
  ]);

  if (!dog) {
    notFound();
  }

  const enhancedClientOptions = clientOptions.some((client) => client.id === dog.clientId)
    ? clientOptions
    : [...clientOptions, { id: dog.clientId, name: dog.clientName }];

  const editDog = {
    id: dog.id,
    name: dog.name,
    clientId: dog.clientId,
    breed: dog.breed ?? "",
    sex: dog.sex,
    dob: dog.dob ? dog.dob.slice(0, 10) : "",
    weightKg: dog.weightKg !== null ? String(dog.weightKg) : "",
    tagsInput: dog.tags.join(", "),
    medicalFlagsInput: dog.medicalFlags.join(", "),
    triggersInput: dog.triggers.join(", "),
    consentInternal: dog.consentInternal,
    consentShareLater: dog.consentShareLater,
    photoData: dog.photoUrl ?? "",
    note: "",
  };

  return (
    <div className="space-y-6">
      <TopBar
        title={dog.name}
        actions={[
          {
            key: "edit-dog",
            node: <EditDogButton dog={editDog} clients={enhancedClientOptions} />,
          },
          {
            key: "add-note",
            node: <AddDogNoteButton dogId={dog.id} />,
          },
          {
            key: "upload-media",
            node: <UploadDogMediaButton dogId={dog.id} />,
          },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <Card className="border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-white to-emerald-50/30">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-brand-primary/20 via-brand-accent/20 to-emerald-400/20 blur-lg"></div>
              <Avatar label={dog.name} src={dog.photoUrl} className="relative h-28 w-28 ring-4 ring-white shadow-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {dog.name}
              </h2>
              <p className="text-sm font-medium text-neutral-600 mt-1">{dog.breed ?? "—"}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {dog.tags.map((tag) => (
                <Badge key={tag} variant="muted" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="w-full rounded-xl bg-gradient-to-br from-white via-slate-50 to-white p-4 border border-slate-200/60 shadow-sm">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">Client</span>
                  <Link
                    href={`/clients/${dog.clientId}`}
                    className="font-bold text-brand-secondary hover:text-brand-primary transition-colors"
                  >
                    {dog.clientName}
                  </Link>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="font-semibold text-neutral-700">Sex</span>
                  <span className="text-neutral-600">{dog.sex === "M" ? "Male" : "Female"}</span>
                </div>
                {dog.dob && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                    <span className="font-semibold text-neutral-700">DOB</span>
                    <span className="text-neutral-600">{format(parseISO(dog.dob), "MMM d, yyyy")}</span>
                  </div>
                )}
                {dog.weightKg !== null && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                    <span className="font-semibold text-neutral-700">Weight</span>
                    <span className="text-neutral-600">{dog.weightKg} kg</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Bio" className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 via-white to-white">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-rose-700 mb-1.5">
                  Medical Flags
                </dt>
                <dd className="text-neutral-700 font-medium">
                  {dog.medicalFlags.length > 0
                    ? dog.medicalFlags.join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div className="rounded-lg border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1.5">
                  Triggers
                </dt>
                <dd className="text-neutral-700 font-medium">
                  {dog.triggers.length > 0
                    ? dog.triggers.join(", ")
                    : "None recorded"}
                </dd>
              </div>
              <div className="rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1.5">
                  Weight
                </dt>
                <dd className="text-neutral-700 font-medium">
                  {dog.weightKg !== null ? `${dog.weightKg} kg` : "Not recorded"}
                </dd>
              </div>
              <div className="rounded-lg border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-1.5">
                  Consents
                </dt>
                <dd className="text-neutral-700 font-medium">
                  <span className={dog.consentInternal ? "text-emerald-600" : "text-neutral-500"}>Internal: {dog.consentInternal ? "Yes" : "No"}</span> · <span className={dog.consentShareLater ? "text-emerald-600" : "text-neutral-500"}>Share: {dog.consentShareLater ? "Yes" : "No"}</span>
                </dd>
              </div>
              <div className="rounded-lg border border-cyan-200/60 bg-gradient-to-br from-cyan-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-cyan-700 mb-1.5">
                  Last Session
                </dt>
                <dd className="text-neutral-700 font-medium">
                  {dog.lastSessionDate
                    ? format(parseISO(dog.lastSessionDate), "PPP")
                    : "Not yet"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Internal Notes" className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/30 via-white to-white">
            {dog.notes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-6 text-center">
                <p className="text-sm font-medium text-indigo-700">
                  No internal notes yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {dog.notes.map((note) => (
                  <li key={note.id} className="group rounded-xl border-2 border-indigo-200/60 bg-gradient-to-r from-indigo-50/50 via-white to-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:scale-[1.01]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">
                          {format(parseISO(note.createdAt), "MMM d, HH:mm")}
                        </p>
                        <p className="text-neutral-700 leading-relaxed">{note.body}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <EditDogNoteButton noteId={note.id} initialBody={note.body} />
                        <DeleteNoteButton noteId={note.id} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Active Plan & Milestones" className="border-violet-200/60 bg-gradient-to-br from-violet-50/30 via-white to-white">
            {dog.plans.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
                <p className="text-sm font-medium text-violet-700">No plans assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dog.plans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50/50 via-white to-white p-5 shadow-sm transition-all hover:shadow-md hover:border-violet-300">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                          {plan.templateName}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mt-1">
                          {plan.status} · Assigned{" "}
                          {format(parseISO(plan.assignedOn), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        View plan →
                      </Link>
                    </div>
                    <ul className="space-y-2.5">
                      {plan.milestones.slice(0, 4).map((milestone) => (
                        <li
                          key={milestone.id}
                          className="flex items-start gap-3 rounded-lg border border-violet-100 bg-white/80 p-2.5 text-sm"
                        >
                          <Badge
                            variant={milestone.done ? "success" : "muted"}
                            className={`mt-0.5 ${milestone.done ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-violet-100 text-violet-700 border-violet-200"}`}
                          >
                            {milestone.done ? "✓ Done" : "○ Open"}
                          </Badge>
                          <span className="text-neutral-700">
                            <span className="font-semibold text-violet-700">
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

          <Card title="Recent Sessions" className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/30 via-white to-white">
            {dog.sessions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-cyan-200 bg-cyan-50/30 p-6 text-center">
                <p className="text-sm font-medium text-cyan-700">
                  No sessions logged yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {dog.sessions.slice(0, 5).map((session) => (
                  <li
                    key={session.id}
                    className="rounded-xl border-2 border-cyan-200/60 bg-gradient-to-r from-cyan-50/50 via-white to-white p-4 transition-all hover:border-cyan-300 hover:shadow-md cursor-pointer"
                  >
                    <Link href={`/sessions/${session.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-cyan-700">
                          {format(parseISO(session.datetime), "MMM d, HH:mm")} ·{" "}
                          <span className="text-brand-secondary">{session.location}</span>
                        </p>
                        <Badge
                          variant={
                            session.status === "done"
                              ? "success"
                              : session.status === "in_progress"
                                ? "warning"
                                : "muted"
                          }
                          className={session.status === "done" ? "bg-emerald-100 text-emerald-700" : session.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"}
                        >
                          {session.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 mb-1">
                        Objectives
                      </p>
                      <p className="text-neutral-700">{session.objectives.join(", ") || "No objectives"}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Media" className="border-pink-200/60 bg-gradient-to-br from-pink-50/30 via-white to-white">
            <MediaGallery media={dog.media} />
          </Card>

          {/* Dog Progress Timeline */}
          <DogProgressTimeline
            milestones={progressData.milestones}
            progressScores={progressData.progressScores}
          />

          {/* Training Objectives Matrix */}
          <TrainingObjectivesMatrix objectives={progressData.trainingObjectives} dogId={dog.id} />

          {/* Behavior Journal */}
          <BehaviorJournal logs={progressData.behaviorLogs} dogId={dog.id} />

          <Card title="Activity Timeline" className="border-slate-200/60 bg-gradient-to-br from-slate-50/30 via-white to-white">
            {dog.timeline.length === 0 && dog.notes.length === 0 && dog.sessions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Timeline updates will appear here.
                </p>
              </div>
            ) : (
              (() => {
                // Combine timeline entries, notes, and sessions
                const allEntries: Array<{
                  id: string;
                  date: Date;
                  type: string;
                  title: string;
                  summary: string | null;
                }> = [
                  ...dog.timeline.map((item) => ({
                    id: item.id,
                    date: parseISO(item.occurredAt),
                    type: item.type,
                    title: item.title,
                    summary: item.summary,
                  })),
                  ...dog.notes.map((note) => ({
                    id: note.id,
                    date: parseISO(note.createdAt),
                    type: "note",
                    title: "Note added",
                    summary: note.body,
                  })),
                  ...dog.sessions.map((session) => ({
                    id: session.id,
                    date: parseISO(session.datetime),
                    type: "session",
                    title: `Session ${session.status === "done" ? "completed" : session.status === "in_progress" ? "in progress" : "scheduled"}`,
                    summary: session.objectives.join(", "),
                  })),
                ].sort((a, b) => b.date.getTime() - a.date.getTime());

                // Group by date
                const grouped = new Map<string, typeof allEntries>();
                allEntries.forEach((entry) => {
                  const dateKey = format(startOfDay(entry.date), "yyyy-MM-dd");
                  if (!grouped.has(dateKey)) {
                    grouped.set(dateKey, []);
                  }
                  grouped.get(dateKey)!.push(entry);
                });

                const sortedDates = Array.from(grouped.keys()).sort(
                  (a, b) => new Date(b).getTime() - new Date(a).getTime(),
                );

                return (
                  <div className="space-y-6">
                    {sortedDates.map((dateKey) => {
                      const entries = grouped.get(dateKey)!;
                      const date = new Date(dateKey);
                      return (
                        <div key={dateKey}>
                          <h3 className="mb-4 text-base font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                            {format(date, "EEEE, MMMM d, yyyy")}
                          </h3>
                          <ul className="space-y-3">
                            {entries.map((item) => (
                              <li key={item.id} className="relative rounded-lg border-l-4 border-brand-primary bg-gradient-to-r from-brand-primary/5 via-white to-white pl-4 pr-3 py-2.5 transition-all hover:shadow-md">
                                <p className="text-xs font-bold uppercase tracking-wide text-brand-primary mb-1">
                                  {item.type} · {format(item.date, "HH:mm")}
                                </p>
                                <p className="font-semibold text-brand-secondary mb-1">
                                  {item.title}
                                </p>
                                {item.summary && <p className="text-sm text-neutral-600 leading-relaxed">{item.summary}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
