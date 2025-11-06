/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";

type TrainerOption = {
  id: string;
  name: string;
};

type SessionForEdit = {
  id: string;
  title: string | null;
  dogName: string;
  datetime: string;
  location: string;
  durationMin: number;
  status: "scheduled" | "in_progress" | "done";
  trainerId: string | null;
  trainerName: string;
  travelMinutes: number;
  bufferMinutes: number;
  objectives: string[];
  sessionNote: string | null;
  clientId: string | null;
  packageId: string | null;
};

type FormState = {
  title: string;
  startTime: string;
  durationMinutes: string;
  location: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "DONE";
  trainerId: string;
  travelMinutes: string;
  bufferMinutes: string;
  objectivesText: string;
  internalNote: string;
  notes: string;
  packageId: string;
  clientId: string;
};

type EditSessionButtonProps = {
  session: SessionForEdit;
  trainers: TrainerOption[];
};

const STATUS_OPTIONS: Array<{ value: FormState["status"]; label: string }> = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - timezoneOffset).toISOString();
  return local.slice(0, 16);
}

export function EditSessionButton({ session, trainers }: EditSessionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<Array<{ id: string; type: string; sessionsRemaining: number; totalSessions: number }>>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  // Extract notes from sessionNote (sessionNote contains "Title\n\nnotes" format)
  const extractNotesFromSessionNote = (sessionNote: string | null): string => {
    if (!sessionNote) return "";
    const lines = sessionNote.split("\n");
    if (lines.length > 1 && lines[1]?.trim() === "") {
      // Has title format, return just the notes part
      return lines.slice(2).join("\n").trim();
    }
    return sessionNote;
  };

  const initialState: FormState = useMemo(
    () => ({
      title: session.title ?? "",
      startTime: formatDateTimeLocal(session.datetime),
      durationMinutes: String(session.durationMin),
      location: session.location,
      status: session.status.toUpperCase() as FormState["status"],
      trainerId: session.trainerId ?? (trainers[0]?.id ?? ""),
      travelMinutes: String(session.travelMinutes ?? 0),
      bufferMinutes: String(session.bufferMinutes ?? 0),
      objectivesText: session.objectives.join("\n"),
      internalNote: session.sessionNote ?? "",
      notes: extractNotesFromSessionNote(session.sessionNote),
      packageId: session.packageId ?? "",
      clientId: session.clientId ?? "",
    }),
    [session, trainers],
  );

  const [form, setForm] = useState<FormState>(initialState);

  // Load clients and packages when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load clients
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (data.clients) {
            setClients(data.clients);
          }
        })
        .catch(() => {});

      // Load packages if clientId is available
      if (form.clientId) {
        loadPackages(form.clientId);
      }
    }
  }, [isOpen, form.clientId]);

  const loadPackages = async (clientId: string) => {
    if (!clientId) {
      setPackages([]);
      return;
    }

    setLoadingPackages(true);
    try {
      const response = await fetch(`/api/packages?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        const availablePackages = (data.packages || [])
          .filter((pkg: any) => pkg.sessionsRemaining > 0 || pkg.id === form.packageId)
          .map((pkg: any) => ({
            id: pkg.id,
            type: pkg.templateName || "Package",
            sessionsRemaining: pkg.sessionsRemaining,
            totalSessions: pkg.totalSessions || pkg.sessionsRemaining,
          }));
        setPackages(availablePackages);
      }
    } catch (error) {
      console.error("Failed to load packages", error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const trainerOptions = useMemo(() => {
    if (!session.trainerId) {
      return trainers;
    }
    const exists = trainers.some((trainer) => trainer.id === session.trainerId);
    if (exists) {
      return trainers;
    }
    return [{ id: session.trainerId, name: session.trainerName }, ...trainers];
  }, [session.trainerId, session.trainerName, trainers]);

  const openModal = () => {
    setForm(initialState);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!form.startTime) {
      setError("Provide a start date and time.");
      setIsSubmitting(false);
      return;
    }

    const parsedStart = new Date(form.startTime);
    if (Number.isNaN(parsedStart.getTime())) {
      setError("Start time is invalid.");
      setIsSubmitting(false);
      return;
    }

    const duration = Number.parseInt(form.durationMinutes, 10);
    if (Number.isNaN(duration) || duration <= 0) {
      setError("Duration must be a positive number.");
      setIsSubmitting(false);
      return;
    }

    const travel = Number.parseInt(form.travelMinutes || "0", 10);
    if (Number.isNaN(travel) || travel < 0) {
      setError("Travel minutes cannot be negative.");
      setIsSubmitting(false);
      return;
    }

    const buffer = Number.parseInt(form.bufferMinutes || "0", 10);
    if (Number.isNaN(buffer) || buffer < 0) {
      setError("Buffer minutes cannot be negative.");
      setIsSubmitting(false);
      return;
    }

    if (!form.location.trim()) {
      setError("Location is required.");
      setIsSubmitting(false);
      return;
    }

    if (!form.trainerId) {
      setError("Select a trainer.");
      setIsSubmitting(false);
      return;
    }

    const titleTrimmed = form.title.trim();
    if (titleTrimmed.length === 0) {
      setError("Provide a session name.");
      setIsSubmitting(false);
      return;
    }

    const internalNoteDraft = form.internalNote;

    const objectives = form.objectivesText
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    // Combine title and notes in the format expected by the API
    const sessionNote = titleTrimmed && form.notes.trim()
      ? `${titleTrimmed}\n\n${form.notes.trim()}`
      : titleTrimmed || form.notes.trim() || null;

    const payload: Record<string, unknown> = {
      title: titleTrimmed,
      startTime: parsedStart.toISOString(),
      durationMinutes: duration,
      location: form.location.trim(),
      status: form.status,
      trainerId: form.trainerId,
      travelMinutes: travel,
      bufferMinutes: buffer,
      objectives,
      sessionNote: sessionNote,
      packageId: form.packageId || null,
    };

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({ error: "Failed to update session." }));
        throw new Error(payloadError.error ?? "Failed to update session.");
      }

      setIsSubmitting(false);
      closeModal();
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update session.");
    }
  };

  const selectedTrainerName =
    trainerOptions.find((option) => option.id === form.trainerId)?.name ?? "Unassigned";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:border-brand-primary hover:text-brand-primary"
      >
        Edit
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
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
                <Dialog.Panel className="w-full max-w-xl transform rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary dark:text-slate-100">
                    Edit Session · {session.dogName}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                    Set the details, define objectives, and capture any context before the session kicks off.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                      <label
                        htmlFor={`session-title-${session.id}`}
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Session name
                      </label>
                      <input
                        id={`session-title-${session.id}`}
                        className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.title}
                        onChange={(event) => handleChange("title", event.target.value)}
                        placeholder="e.g. Intro to loose leash walking"
                        required
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-start-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Start
                        </label>
                        <input
                          id={`session-start-${session.id}`}
                          type="datetime-local"
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.startTime}
                          onChange={(event) => handleChange("startTime", event.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`session-duration-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Duration (min)
                        </label>
                        <input
                          id={`session-duration-${session.id}`}
                          type="number"
                          min={1}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.durationMinutes}
                          onChange={(event) => handleChange("durationMinutes", event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-location-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Location
                        </label>
                        <input
                          id={`session-location-${session.id}`}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.location}
                          onChange={(event) => handleChange("location", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-client-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Client
                        </label>
                        <select
                          id={`session-client-${session.id}`}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.clientId}
                          onChange={(event) => {
                            handleChange("clientId", event.target.value);
                            handleChange("packageId", ""); // Reset package when client changes
                            if (event.target.value) {
                              loadPackages(event.target.value);
                            } else {
                              setPackages([]);
                            }
                          }}
                        >
                          <option value="">Unassigned</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {form.clientId && (
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-package-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Package (optional)
                        </label>
                        {loadingPackages ? (
                          <p className="text-sm text-neutral-500">Loading packages...</p>
                        ) : (
                          <select
                            id={`session-package-${session.id}`}
                            className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            value={form.packageId}
                            onChange={(event) => handleChange("packageId", event.target.value)}
                          >
                            <option value="">No package</option>
                            {packages.map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.type} - {pkg.sessionsRemaining} sessions remaining ({pkg.totalSessions} total)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-status-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Status
                        </label>
                        <select
                          id={`session-status-${session.id}`}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.status}
                          onChange={(event) =>
                            handleChange("status", event.target.value as FormState["status"])
                          }
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`session-trainer-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Trainer
                        </label>
                        <select
                          id={`session-trainer-${session.id}`}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.trainerId}
                          onChange={(event) => handleChange("trainerId", event.target.value)}
                        >
                          {trainerOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-neutral-400">
                          Current: {selectedTrainerName}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor={`session-travel-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Travel (min)
                        </label>
                        <input
                          id={`session-travel-${session.id}`}
                          type="number"
                          min={0}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.travelMinutes}
                          onChange={(event) => handleChange("travelMinutes", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`session-buffer-${session.id}`}
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Buffer (min)
                        </label>
                        <input
                          id={`session-buffer-${session.id}`}
                          type="number"
                          min={0}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.bufferMinutes}
                          onChange={(event) => handleChange("bufferMinutes", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`session-objectives-${session.id}`}
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Objectives (one per line)
                      </label>
                      <textarea
                        id={`session-objectives-${session.id}`}
                        className="min-h-[100px] w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.objectivesText}
                        onChange={(event) => handleChange("objectivesText", event.target.value)}
                        placeholder="Loose leash, settle on mat, greet visitors…"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`session-notes-${session.id}`}
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        id={`session-notes-${session.id}`}
                        className="min-h-[100px] w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.notes}
                        onChange={(event) => handleChange("notes", event.target.value)}
                        placeholder="Additional notes about this session..."
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
