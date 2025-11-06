import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionById } from "@/lib/data/sessions";
import { serializeSessionData } from "@/lib/utils/session-serialization";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DeleteSessionButton } from "@/components/sessions/delete-session-button";
import { AssignPackageButton } from "@/components/sessions/assign-package-button";
import dynamic from "next/dynamic";

const SessionDetailClient = dynamic(() => import("./session-detail-client").then((mod) => mod.SessionDetailClient), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6">
      <p className="text-sm text-neutral-500">Loading session details...</p>
    </div>
  ),
});

type SessionDetailPageProps = {
  params: { id: string };
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params;
  const session = await getSessionById(id);

  if (!session) {
    notFound();
  }

  // Serialize session data for client-side rendering
  const serializedSession = serializeSessionData(session);

  return (
    <div className="space-y-6">
      <TopBar
        title={serializedSession.title || `Session with ${serializedSession.dogName}`}
        actions={[
          { label: "Back to Sessions", href: "/sessions" },
          {
            key: "delete-session",
            node: (
              <DeleteSessionButton
                sessionId={serializedSession.id}
                sessionTitle={serializedSession.title || `Session with ${serializedSession.dogName}`}
              />
            ),
          },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card title="Session Info">
          <dl className="space-y-3 text-sm text-neutral-600">
            <div>
              <dt className="text-xs uppercase text-neutral-500">Dog</dt>
              <dd>
                <Link
                  href={`/dogs/${serializedSession.dogId}`}
                  className="font-semibold text-brand-secondary hover:underline"
                >
                  {serializedSession.dogName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Date & Time</dt>
              <dd>{format(parseISO(serializedSession.datetime), "MMM d, yyyy 'at' HH:mm")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Location</dt>
              <dd>{serializedSession.location}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Duration</dt>
              <dd>{serializedSession.durationMin} minutes</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Status</dt>
              <dd>
                <Badge
                  variant={
                    serializedSession.status === "done"
                      ? "success"
                      : serializedSession.status === "in_progress"
                        ? "warning"
                        : "muted"
                  }
                >
                  {serializedSession.status.replace("_", " ")}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Trainer</dt>
              <dd>{serializedSession.trainerName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Package</dt>
              <dd>
                {serializedSession.packageInfo ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-secondary">
                        {serializedSession.packageInfo.type}
                      </p>
                      <AssignPackageButton
                        sessionId={serializedSession.id}
                        clientId={serializedSession.clientId}
                        currentPackageId={serializedSession.packageId}
                        currentPackageInfo={serializedSession.packageInfo}
                      />
                    </div>
                    <p className="text-xs text-neutral-600">
                      <span className={serializedSession.packageInfo.sessionsRemaining <= 1 ? "font-bold text-rose-600" : "text-neutral-600"}>
                        {serializedSession.packageInfo.sessionsRemaining} session{serializedSession.packageInfo.sessionsRemaining !== 1 ? "s" : ""} remaining
                      </span>
                      {" "}/ {serializedSession.packageInfo.totalSessions} total
                    </p>
                    {serializedSession.status === "done" && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ 1 session deducted from package
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 italic">No package assigned</span>
                    <AssignPackageButton
                      sessionId={serializedSession.id}
                      clientId={serializedSession.clientId}
                      currentPackageId={null}
                      currentPackageInfo={null}
                    />
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <SessionDetailClient session={serializedSession} />
        </div>
      </section>
    </div>
  );
}
