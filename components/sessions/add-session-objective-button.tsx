/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type SessionOption = {
  id: string;
  title?: string | null;
  dogName: string;
  datetime: string;
};

type AddSessionObjectiveButtonProps = {
  sessions: SessionOption[];
};

function formatSessionLabel(option: SessionOption): string {
  try {
    const date = new Date(option.datetime);
    const formatted = Number.isNaN(date.getTime())
      ? option.datetime
      : date.toLocaleString();
    const label = option.title && option.title.trim().length > 0 ? option.title : option.dogName;
    return `${label} · ${formatted}`;
  } catch (_error) {
    const fallback = option.title && option.title.trim().length > 0 ? option.title : option.dogName;
    return `${fallback} · ${option.datetime}`;
  }
}

export function AddSessionObjectiveButton({ sessions }: AddSessionObjectiveButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id ?? "",
  );
  const [objective, setObjective] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sessionOptions = useMemo(() => sessions, [sessions]);
  const hasSessions = sessionOptions.length > 0;

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
    setObjective("");
  };

  const openModal = () => {
    if (!hasSessions) {
      return;
    }

    if (!sessionOptions.some((option) => option.id === selectedSessionId)) {
      setSelectedSessionId(sessionOptions[0]?.id ?? "");
    }

    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSessionId) {
      setError("Select a session before adding an objective.");
      return;
    }

    if (objective.trim().length === 0) {
      setError("Objective cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${selectedSessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objective: objective.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to add objective." }));
        throw new Error(payload.error ?? "Failed to add objective.");
      }

      setIsSubmitting(false);
      closeModal();
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to add objective.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!hasSessions}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon className="h-4 w-4 text-brand-primary" />
        Add Objective
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary">
                    Add Objective
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Choose a session and capture the new objective to track.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                      <label
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        htmlFor="session-select"
                      >
                        Session
                      </label>
                      <select
                        id="session-select"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={selectedSessionId}
                        onChange={(event) => setSelectedSessionId(event.target.value)}
                      >
                        {sessionOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {formatSessionLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        htmlFor="session-objective"
                      >
                        Objective
                      </label>
                      <textarea
                        id="session-objective"
                        className="min-h-[100px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={objective}
                        onChange={(event) => setObjective(event.target.value)}
                        placeholder="Describe the training objective…"
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
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Saving…" : "Save Objective"}
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
