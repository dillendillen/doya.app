/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";
import type { DogQuickPick } from "@/lib/data/dogs";
import type { ClientQuickPick } from "@/lib/data/clients";

type NewTaskButtonProps = {
  dogs: DogQuickPick[];
  clients: ClientQuickPick[];
  sessions?: Array<{ id: string; title: string | null; dogName: string }>;
};

export function NewTaskButton({ dogs, clients, sessions = [] }: NewTaskButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [linkType, setLinkType] = useState<"none" | "dog" | "client" | "session">("none");
  const [linkId, setLinkId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
    setTitle("");
    setPriority("medium");
    setDue("");
    setNotes("");
    setLinkType("none");
    setLinkId("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length === 0) {
      setError("Title is required.");
      return;
    }

    if (linkType !== "none" && !linkId) {
      setError("Please select a linked item.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          priority: priority.toUpperCase(),
          due: due || undefined,
          notes: notes.trim() || undefined,
          relatedDogId: linkType === "dog" ? linkId : undefined,
          relatedClientId: linkType === "client" ? linkId : undefined,
          relatedSessionId: linkType === "session" ? linkId : undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to create task." }));
        throw new Error(payload.error ?? "Failed to create task.");
      }

      setIsSubmitting(false);
      closeModal();
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
      >
        <PlusIcon className="h-4 w-4 text-brand-primary" />
        New Task
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
                    New Task
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Create a new task. You can optionally link it to a dog, client, or session.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                      <label
                        htmlFor="task-title"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Title *
                      </label>
                      <input
                        id="task-title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="task-priority"
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Priority
                        </label>
                        <select
                          id="task-priority"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as typeof priority)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="task-due"
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Due Date
                        </label>
                        <input
                          id="task-due"
                          type="date"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="task-link-type"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Link To
                      </label>
                      <select
                        id="task-link-type"
                        value={linkType}
                        onChange={(e) => {
                          setLinkType(e.target.value as typeof linkType);
                          setLinkId("");
                        }}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      >
                        <option value="none">None</option>
                        <option value="dog">Dog</option>
                        <option value="client">Client</option>
                        <option value="session">Session</option>
                      </select>
                    </div>

                    {linkType !== "none" && (
                      <div className="space-y-1">
                        <label
                          htmlFor="task-link-id"
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          {linkType === "dog" ? "Dog" : linkType === "client" ? "Client" : "Session"} *
                        </label>
                        <select
                          id="task-link-id"
                          required={linkType !== "none"}
                          value={linkId}
                          onChange={(e) => setLinkId(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        >
                          <option value="">Select {linkType}...</option>
                          {linkType === "dog" &&
                            dogs.map((dog) => (
                              <option key={dog.id} value={dog.id}>
                                {dog.name}
                              </option>
                            ))}
                          {linkType === "client" &&
                            clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          {linkType === "session" &&
                            sessions.map((session) => (
                              <option key={session.id} value={session.id}>
                                {session.title || session.dogName}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label
                        htmlFor="task-notes"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Notes
                      </label>
                      <textarea
                        id="task-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

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
                        {isSubmitting ? "Creating…" : "Create Task"}
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

