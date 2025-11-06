/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon } from "@/components/ui/icons";
import type { TaskBoardItem } from "@/lib/data/tasks";
import type { DogQuickPick } from "@/lib/data/dogs";
import type { ClientQuickPick } from "@/lib/data/clients";

type EditTaskButtonProps = {
  task: TaskBoardItem;
  dogs: DogQuickPick[];
  clients: ClientQuickPick[];
};

export function EditTaskButton({ task, dogs, clients }: EditTaskButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task.priority);
  const [due, setDue] = useState(task.due ? new Date(task.due).toISOString().split("T")[0] : "");
  const [notes, setNotes] = useState(task.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setPriority(task.priority);
    setDue(task.due ? new Date(task.due).toISOString().split("T")[0] : "");
    setNotes(task.notes || "");
  }, [task]);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length === 0) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          priority: priority.toUpperCase(),
          due: due || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to update task." }));
        throw new Error(payload.error ?? "Failed to update task.");
      }

      setIsSubmitting(false);
      closeModal();
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <PencilIcon className="h-3 w-3" />
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary">
                    Edit Task
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Update task details.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                      <label
                        htmlFor="edit-task-title"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Title *
                      </label>
                      <input
                        id="edit-task-title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="edit-task-priority"
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Priority
                        </label>
                        <select
                          id="edit-task-priority"
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
                          htmlFor="edit-task-due"
                          className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                        >
                          Due Date
                        </label>
                        <input
                          id="edit-task-due"
                          type="date"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="edit-task-notes"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Notes
                      </label>
                      <textarea
                        id="edit-task-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    {error && <p className="text-sm text-rose-600">{error}</p>}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
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

