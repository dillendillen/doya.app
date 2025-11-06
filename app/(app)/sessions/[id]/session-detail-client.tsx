"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import type { SessionDetail } from "@/lib/data/sessions";

type SessionDetailClientProps = {
  session: SessionDetail;
};

// Helper function to normalize session data (defined outside component to avoid closure issues)
function normalizeSessionData(sessionData: SessionDetail | null | undefined): SessionDetail | null {
  if (!sessionData || typeof sessionData !== 'object' || !sessionData.id) {
    return null;
  }
  try {
    return {
      id: sessionData.id,
      title: sessionData.title ?? null,
      dogId: sessionData.dogId ?? '',
      trainerId: sessionData.trainerId ?? '',
      clientId: sessionData.clientId ?? null,
      datetime: sessionData.datetime ?? '',
      location: sessionData.location ?? '',
      durationMin: sessionData.durationMin ?? 0,
      status: sessionData.status ?? 'scheduled',
      objectives: Array.isArray(sessionData.objectives) ? sessionData.objectives : [],
      scorecards: Array.isArray(sessionData.scorecards) ? sessionData.scorecards : [],
      notes: sessionData.notes ?? null,
      mediaIds: Array.isArray(sessionData.mediaIds) ? sessionData.mediaIds : [],
      packageId: sessionData.packageId ?? null,
      packageInfo: sessionData.packageInfo ?? null,
      nextSteps: Array.isArray(sessionData.nextSteps) ? sessionData.nextSteps : [],
      travelMinutes: sessionData.travelMinutes ?? 0,
      bufferMinutes: sessionData.bufferMinutes ?? 0,
      dogName: sessionData.dogName ?? 'Unknown',
      trainerName: sessionData.trainerName ?? 'Unknown',
      dogNotes: Array.isArray(sessionData.dogNotes) ? sessionData.dogNotes : [],
      behaviorLogs: Array.isArray(sessionData.behaviorLogs) ? sessionData.behaviorLogs : [],
      trainingObjectives: Array.isArray(sessionData.trainingObjectives) ? sessionData.trainingObjectives : [],
    };
  } catch (error) {
    console.error('Error normalizing session data:', error);
    return null;
  }
}

export function SessionDetailClient({ session: initialSession }: SessionDetailClientProps) {
  const router = useRouter();
  
  const normalizedSession = normalizeSessionData(initialSession);
  const [session, setSession] = useState<SessionDetail | null>(normalizedSession);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editingObjective, setEditingObjective] = useState<number | null>(null);
  const [objectiveText, setObjectiveText] = useState("");

  useEffect(() => {
    const normalized = normalizeSessionData(initialSession);
    if (normalized) {
      setSession(normalized);
    }
  }, [initialSession]);

  // Validate after hooks (React rules)
  if (!session || !session.id) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6">
        <p className="text-sm text-neutral-500">Loading session data...</p>
      </div>
    );
  }

  const handleEditNote = () => {
    setEditingNote("session");
    // Show notes without title if title exists
    const notes = session.notes || "";
    const hasTitle = notes.split("\n").length > 1 && notes.split("\n")[1]?.trim() === "";
    const notesBody = hasTitle ? notes.split("\n").slice(2).join("\n").trim() : notes;
    setNoteText(notesBody);
  };

  const handleSaveNote = async () => {
    try {
      // Preserve title if it exists
      const currentNotes = session.notes || "";
      const hasTitle = currentNotes.split("\n").length > 1 && currentNotes.split("\n")[1]?.trim() === "";
      const currentTitle = hasTitle ? currentNotes.split("\n")[0]?.trim() : null;
      
      const newNotes = currentTitle 
        ? `${currentTitle}\n\n${noteText.trim()}`.trim()
        : noteText.trim() || null;

      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionNote: newNotes,
        }),
      });

      if (response.ok) {
        setSession({ ...session, notes: newNotes });
        setEditingNote(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update note", error);
    }
  };

  const handleDeleteNote = async () => {
    if (!confirm("Delete session notes?")) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionNote: null,
        }),
      });

      if (response.ok) {
        setSession({ ...session, notes: null });
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete note", error);
    }
  };

  const handleEditObjective = (index: number) => {
    setEditingObjective(index);
    setObjectiveText(session.objectives[index] || "");
  };

  const handleSaveObjective = async (index: number) => {
    const newObjectives = [...session.objectives];
    newObjectives[index] = objectiveText.trim();
    
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectives: newObjectives.filter((o) => o.length > 0),
        }),
      });

      if (response.ok) {
        setSession({ ...session, objectives: newObjectives.filter((o) => o.length > 0) });
        setEditingObjective(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update objective", error);
    }
  };

  const handleDeleteObjective = async (index: number) => {
    if (!confirm("Delete this objective?")) return;

    const newObjectives = session.objectives.filter((_, i) => i !== index);
    
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectives: newObjectives,
        }),
      });

      if (response.ok) {
        setSession({ ...session, objectives: newObjectives });
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete objective", error);
    }
  };

  return (
    <>
      <Card title="Objectives">
        {session.objectives.length === 0 ? (
          <p className="text-sm text-neutral-500">No objectives set.</p>
        ) : (
          <ul className="space-y-2">
            {session.objectives.map((objective, index) => (
              <li
                key={index}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                {editingObjective === index ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={objectiveText}
                      onChange={(e) => setObjectiveText(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      onBlur={() => handleSaveObjective(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveObjective(index);
                        } else if (e.key === "Escape") {
                          setEditingObjective(null);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-neutral-600">{objective}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditObjective(index)}
                        className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                        title="Edit objective"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteObjective(index)}
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:border-red-300 hover:bg-red-100"
                        title="Delete objective"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Session Notes">
        {editingNote === "session" ? (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingNote(null)}
                className="rounded-lg px-3 py-2 text-sm text-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-brand-secondary px-3 py-2 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {session.notes ? (
              <div className="flex items-start justify-between">
                <p className="flex-1 whitespace-pre-wrap text-sm text-neutral-600">
                  {session.notes}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditNote}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                    title="Edit note"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:border-red-300 hover:bg-red-100"
                    title="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">No notes added yet.</p>
                <button
                  onClick={handleEditNote}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  Add Note
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {session.dogNotes && session.dogNotes.length > 0 && (
        <Card title="Dog Notes">
          <ul className="space-y-2">
            {session.dogNotes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-neutral-600"
              >
                <p className="text-xs uppercase text-neutral-500 mb-1">
                  {format(parseISO(note.createdAt), "MMM d, HH:mm")}
                </p>
                <p>{note.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {session.behaviorLogs && session.behaviorLogs.length > 0 && (
        <Card title="Behavior Journal">
          <div className="space-y-3">
            {session.behaviorLogs.map((log) => {
              const moodColors: Record<typeof log.mood, string> = {
                anxious: "bg-red-100 text-red-700 border-red-200",
                excited: "bg-orange-100 text-orange-700 border-orange-200",
                calm: "bg-green-100 text-green-700 border-green-200",
                distracted: "bg-yellow-100 text-yellow-700 border-yellow-200",
                focused: "bg-blue-100 text-blue-700 border-blue-200",
                reactive: "bg-purple-100 text-purple-700 border-purple-200",
              };
              const moodEmoji: Record<typeof log.mood, string> = {
                anxious: "😰",
                excited: "🎉",
                calm: "😌",
                distracted: "🤔",
                focused: "🎯",
                reactive: "⚠️",
              };
              return (
                <div
                  key={log.id}
                  className={`rounded-xl border-2 p-4 ${moodColors[log.mood]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{moodEmoji[log.mood]}</span>
                    <Badge variant="muted">{log.mood}</Badge>
                    <span className="text-xs opacity-75">
                      {format(parseISO(log.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {log.environment && (
                      <p>
                        <span className="font-medium">Environment:</span> {log.environment}
                      </p>
                    )}
                    {log.weather && (
                      <p>
                        <span className="font-medium">Weather:</span> {log.weather}
                      </p>
                    )}
                    {log.distractions && (
                      <p>
                        <span className="font-medium">Distractions:</span> {log.distractions}
                      </p>
                    )}
                    <p className="mt-2">{log.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {session.trainingObjectives && session.trainingObjectives.length > 0 && (
        <Card title="Training Objectives">
          <div className="space-y-4">
            {(() => {
              const planned = session.trainingObjectives.filter((o) => o.status === "planned");
              const inProgress = session.trainingObjectives.filter((o) => o.status === "in_progress");
              const mastered = session.trainingObjectives.filter((o) => o.status === "mastered");
              
              return (
                <>
                  {planned.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">📋 Planned ({planned.length})</h4>
                      <ul className="space-y-2">
                        {planned.map((obj) => (
                          <li key={obj.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                            <span className="font-medium">{obj.skill}</span>
                            {obj.notes && <p className="text-xs text-slate-600 mt-1">{obj.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {inProgress.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">🔄 In Progress ({inProgress.length})</h4>
                      <ul className="space-y-2">
                        {inProgress.map((obj) => (
                          <li key={obj.id} className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm">
                            <span className="font-medium">{obj.skill}</span>
                            {obj.notes && <p className="text-xs text-blue-600 mt-1">{obj.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mastered.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-700 mb-2">✅ Mastered ({mastered.length})</h4>
                      <ul className="space-y-2">
                        {mastered.map((obj) => (
                          <li key={obj.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm">
                            <span className="font-medium">{obj.skill}</span>
                            {obj.notes && <p className="text-xs text-emerald-600 mt-1">{obj.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Card>
      )}
    </>
  );
}
