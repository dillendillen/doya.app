"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { PlusIcon } from "@/components/ui/icons";

type AddBehaviorLogButtonProps = {
  dogId: string;
  sessionId?: string | null;
};

export function AddBehaviorLogButton({ dogId, sessionId }: AddBehaviorLogButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<"anxious" | "excited" | "calm" | "distracted" | "focused" | "reactive">("calm");
  const [environment, setEnvironment] = useState("");
  const [weather, setWeather] = useState("");
  const [distractions, setDistractions] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format as [BEHAVIOR] mood:xxx, env:xxx, weather:xxx, distractions:xxx, sessionId:xxx\nnotes
      const header = `[BEHAVIOR] mood:${mood}${environment ? `, env:${environment}` : ""}${weather ? `, weather:${weather}` : ""}${distractions ? `, distractions:${distractions}` : ""}${sessionId ? `, sessionId:${sessionId}` : ""}`;
      const body = `${header}\n${notes.trim()}`;

      const response = await fetch(`/api/dogs/${dogId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (response.ok) {
        setIsOpen(false);
        setMood("calm");
        setEnvironment("");
        setWeather("");
        setDistractions("");
        setNotes("");
        router.refresh();
      } else {
        alert("Failed to add behavior log");
      }
    } catch (error) {
      console.error("Failed to add behavior log", error);
      alert("Failed to add behavior log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-secondary inline-flex items-center gap-2 text-sm"
      >
        <PlusIcon className="h-4 w-4" />
        Add Log
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
                    Add Behavior Log
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    Record the dog's mood, environment, and behavior observations.
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Mood
                      </label>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value as typeof mood)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Environment (optional)
                      </label>
                      <input
                        type="text"
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        placeholder="e.g., park, indoor, windy day"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Weather (optional)
                      </label>
                      <input
                        type="text"
                        value={weather}
                        onChange={(e) => setWeather(e.target.value)}
                        placeholder="e.g., sunny, windy, rainy"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Distractions (optional)
                      </label>
                      <input
                        type="text"
                        value={distractions}
                        onChange={(e) => setDistractions(e.target.value)}
                        placeholder="e.g., other dogs, children, loud noises"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Describe the dog's behavior, reactions, and any observations..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !notes.trim()}
                        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Saving..." : "Save Log"}
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

