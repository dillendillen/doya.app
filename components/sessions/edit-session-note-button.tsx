/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";

type EditSessionNoteButtonProps = {
  sessionId: string;
  initialNote: string | null;
};

export function EditSessionNoteButton({ sessionId, initialNote }: EditSessionNoteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setNote(initialNote ?? "");
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionNote: note,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to save note." }));
        throw new Error(payload.error ?? "Failed to save note.");
      }

      setIsSubmitting(false);
      closeModal();
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to save note.");
    }
  };

  const buttonLabel = initialNote && initialNote.trim().length > 0 ? "Edit internal note" : "Add internal note";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:border-brand-primary hover:text-brand-primary"
      >
        {buttonLabel}
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
                    Edit Internal Note
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Internal notes are only visible to your team. Leave the field empty to clear the note.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                      <label
                        htmlFor="session-internal-note"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Note
                      </label>
                      <textarea
                        id="session-internal-note"
                        className="min-h-[140px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Only visible to your team."
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setNote("")}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700"
                        disabled={isSubmitting}
                      >
                        Clear note
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Saving…" : "Save"}
                        </button>
                      </div>
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
