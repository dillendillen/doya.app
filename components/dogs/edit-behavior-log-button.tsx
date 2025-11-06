"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon } from "@/components/ui/icons";
import type { DogBehaviorLog } from "@/lib/data/dog-progress";

type EditBehaviorLogButtonProps = {
  log: DogBehaviorLog;
  dogId: string;
};

export function EditBehaviorLogButton({ log, dogId }: EditBehaviorLogButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<DogBehaviorLog["mood"]>(log.mood);
  const [environment, setEnvironment] = useState(log.environment || "");
  const [weather, setWeather] = useState(log.weather || "");
  const [distractions, setDistractions] = useState(log.distractions || "");
  const [notes, setNotes] = useState(log.notes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format as [BEHAVIOR] mood:xxx, env:xxx, weather:xxx, distractions:xxx, sessionId:xxx\nnotes
      const header = `[BEHAVIOR] mood:${mood}${environment ? `, env:${environment}` : ""}${weather ? `, weather:${weather}` : ""}${distractions ? `, distractions:${distractions}` : ""}${log.sessionId ? `, sessionId:${log.sessionId}` : ""}`;
      const body = `${header}\n${notes.trim()}`;

      const response = await fetch(`/api/dogs/notes/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (response.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Failed to update behavior log");
      }
    } catch (error) {
      console.error("Failed to update behavior log", error);
      alert("Failed to update behavior log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        title="Edit behavior log"
      >
        <PencilIcon className="h-4 w-4" />
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary dark:text-slate-100">
                    Edit Behavior Log
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                    Update the dog's mood, environment, and behavior observations.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Mood
                      </label>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value as DogBehaviorLog["mood"])}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        required
                      >
                        <option value="calm">😌 Calm</option>
                        <option value="excited">🎉 Excited</option>
                        <option value="focused">🎯 Focused</option>
                        <option value="distracted">🤔 Distracted</option>
                        <option value="anxious">😰 Anxious</option>
                        <option value="reactive">⚠️ Reactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Environment (optional)
                      </label>
                      <input
                        type="text"
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        placeholder="e.g., park, indoor, windy day"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Weather (optional)
                      </label>
                      <input
                        type="text"
                        value={weather}
                        onChange={(e) => setWeather(e.target.value)}
                        placeholder="e.g., sunny, windy, rainy"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Distractions (optional)
                      </label>
                      <input
                        type="text"
                        value={distractions}
                        onChange={(e) => setDistractions(e.target.value)}
                        placeholder="e.g., other dogs, children, loud noises"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Describe the dog's behavior, reactions, and any observations..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !notes.trim()}
                        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Updating..." : "Update Log"}
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

