/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { format } from "date-fns";
import { PlayIcon, StopIcon } from "@/components/ui/icons";

type SessionOption = {
  id: string;
  startTime: string;
  dogName: string;
  dogId?: string;
  location: string;
};

type StartSessionButtonProps = {
  sessions?: SessionOption[];
};

const TIMER_STORAGE_KEY = "doya_session_timer";

type TimerState = {
  isRunning: boolean;
  startTime: string;
  selectedSessionId: string | null;
  timestamps: Array<{ action: string; time: string }>;
};

export function StartSessionButton({ sessions = [] }: StartSessionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timestamps, setTimestamps] = useState<Array<{ action: string; time: Date }>>([]);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        if (state.isRunning && state.startTime) {
          const savedStartTime = new Date(state.startTime);
          const now = new Date();
          const savedElapsed = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000);
          
          setStartTime(savedStartTime);
          setElapsedSeconds(savedElapsed);
          setSelectedSessionId(state.selectedSessionId);
          setIsRunning(true);
          setTimestamps(state.timestamps.map((t) => ({ action: t.action, time: new Date(t.time) })));
        }
      } catch (e) {
        console.error("Failed to load timer state", e);
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
  }, []);

  // Update elapsed time and save to localStorage
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
        
        // Persist to localStorage
        const state: TimerState = {
          isRunning: true,
          startTime: startTime.toISOString(),
          selectedSessionId,
          timestamps: timestamps.map((t) => ({ action: t.action, time: t.time.toISOString() })),
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
      }, 1000);
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime, selectedSessionId, timestamps]);

  const handleStart = async (sessionId: string | null) => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setElapsedSeconds(0);
    setTimestamps([{ action: "Session Started", time: now }]);
    setIsOpen(false);
    setSelectedSessionId(sessionId);

    // If sessionId provided, update session status
    if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}/start`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to update session", error);
      }
    }
  };

  const handleStop = async () => {
    if (!startTime) return;

    const now = new Date();
    const finalTimestamps = [...timestamps, { action: "Session Stopped", time: now }];
    setIsRunning(false);
    localStorage.removeItem(TIMER_STORAGE_KEY);

    let finalSessionId = selectedSessionId;
    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const timestampText = finalTimestamps
      .map((t) => `${t.action}: ${format(t.time, "MMM d, HH:mm:ss")}`)
      .join("\n");
    const notesText = `Session Duration: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s\n\nTimestamps:\n${timestampText}`;

    // If unplanned session, create a new session
    if (!selectedSessionId) {
      try {
        if (sessions.length > 0 && sessions[0].dogId) {
          const response = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dogId: sessions[0].dogId,
              startTime: startTime.toISOString(),
              durationMinutes,
              location: "Unplanned Session",
              status: "DONE",
              notes: notesText,
              objectives: [],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            finalSessionId = data.session?.id || null;
          }
        }
      } catch (error) {
        console.error("Failed to create session", error);
      }
    } else {
      // Update existing session with notes and timestamps
      try {
        await fetch(`/api/sessions/${selectedSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "DONE",
            notes: notesText,
            durationMinutes,
          }),
        });
      } catch (error) {
        console.error("Failed to update session", error);
      }
    }

    // Save to audit log
    try {
      await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: finalSessionId,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          durationSeconds: elapsedSeconds,
          timestamps: finalTimestamps.map((t) => ({
            action: t.action,
            time: t.time.toISOString(),
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to save audit log", error);
    }

    setStartTime(null);
    setElapsedSeconds(0);
    setTimestamps([]);
    setSelectedSessionId(null);
    router.refresh();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If timer is running, show minimalistic top-fixed timer UI
  if (isRunning) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
              <span className="text-xs font-medium uppercase tracking-wide opacity-90">Session Active</span>
            </div>
            <div className="text-lg font-mono font-semibold">{formatTime(elapsedSeconds)}</div>
            {selectedSessionId && (
              <span className="text-xs opacity-75">
                {sessions.find((s) => s.id === selectedSessionId)?.dogName || "Session"}
              </span>
            )}
          </div>
          <button
            onClick={handleStop}
            className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30"
          >
            <StopIcon className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <PlayIcon className="h-4 w-4" />
        Start Session
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary">
                    Start Session
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Select a planned session or start a new unplanned session.
                  </Dialog.Description>

                  <div className="mt-4 space-y-3">
                    {sessions.length > 0 && (
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          Planned Sessions
                        </label>
                        <div className="mt-2 space-y-2">
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => handleStart(session.id)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-brand-primary hover:bg-brand-primary/5"
                            >
                              <p className="font-medium text-brand-secondary">{session.dogName}</p>
                              <p className="text-xs text-neutral-500">
                                {format(new Date(session.startTime), "MMM d, HH:mm")} · {session.location}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => handleStart(null)}
                        className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
                      >
                        Start Unplanned Session
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
