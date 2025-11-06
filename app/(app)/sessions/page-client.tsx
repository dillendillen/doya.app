"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { NewSessionButton } from "@/components/dashboard/new-session-button";
import { AddSessionObjectiveButton } from "@/components/sessions/add-session-objective-button";
import { EditSessionButton } from "@/components/sessions/edit-session-button";
import { DeleteSessionButton } from "@/components/sessions/delete-session-button";
import type { SessionListItem } from "@/lib/data/sessions";
import type { DogQuickPick } from "@/lib/data/dogs";
import type { ClientQuickPick } from "@/lib/data/clients";
import type { TrainerQuickPick } from "@/lib/data/settings";

type SessionsPageProps = {
  initialSessions: SessionListItem[];
  dogOptions: DogQuickPick[];
  clientOptions: ClientQuickPick[];
  trainerOptions: TrainerQuickPick[];
};

export default function SessionsPage({
  initialSessions,
  dogOptions,
  clientOptions,
  trainerOptions,
}: SessionsPageProps) {
  const [showArchived, setShowArchived] = useState(false);
  const today = new Date();

  const { activeSessions, archivedSessions } = useMemo(() => {
    const active: SessionListItem[] = [];
    const archived: SessionListItem[] = [];

    initialSessions.forEach((session) => {
      const sessionDate = new Date(session.datetime);
      if (sessionDate < today && session.status === "done") {
        archived.push(session);
      } else {
        active.push(session);
      }
    });

    return { activeSessions: active, archivedSessions: archived };
  }, [initialSessions, today]);

  const displayedSessions = showArchived ? archivedSessions : activeSessions;
  const objectiveSessions = displayedSessions.map((session) => ({
    id: session.id,
    title: session.title,
    dogName: session.dogName,
    datetime: session.datetime,
  }));

  return (
    <div className="space-y-6">
      <TopBar
        title="Sessions"
        actions={[
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
        ]}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowArchived(false)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            !showArchived
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
              : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          Active Sessions ({activeSessions.length})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            showArchived
              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105"
              : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          Archived Sessions ({archivedSessions.length})
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displayedSessions.map((session) => (
          <div
            key={session.id}
            className={`card-modern p-4 ${
              showArchived ? "opacity-75" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-secondary">
                {session.title ?? session.dogName}
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
            <p className="text-xs text-slate-500">
              Dog · {session.dogName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {format(new Date(session.datetime), "MMM d, yyyy HH:mm")} · {session.location}
            </p>
            {session.packageName && (
              <p className="mt-1 text-xs font-medium text-amber-600">
                Package: {session.packageName}
                {session.packageSessionsRemaining !== null && (
                  <span className="ml-1 text-amber-500">
                    ({session.packageSessionsRemaining} sessions left)
                  </span>
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Trainer {session.trainerName} · Travel {session.travelMinutes} min · Buffer {session.bufferMinutes} min
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Link
                href={`/sessions/${session.id}`}
                className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                Open session →
              </Link>
              <div className="flex items-center gap-2">
                {!showArchived && (
                  <EditSessionButton session={session} trainers={trainerOptions} />
                )}
                <DeleteSessionButton
                  sessionId={session.id}
                  sessionTitle={session.title ?? session.dogName}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayedSessions.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            {showArchived ? "No archived sessions yet." : "No active sessions in this period."}
          </p>
        </div>
      )}
    </div>
  );
}
