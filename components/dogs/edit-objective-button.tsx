"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DogTrainingObjective } from "@/lib/data/dog-progress";

type EditObjectiveButtonProps = {
  objective: DogTrainingObjective;
  dogId: string;
};

export function EditObjectiveButton({ objective, dogId }: EditObjectiveButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [skill, setSkill] = useState(objective.skill);
  const [status, setStatus] = useState<DogTrainingObjective["status"]>(objective.status);
  const [notes, setNotes] = useState(objective.notes || "");

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/dogs/${dogId}/objectives/${objective.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill,
          status,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to update objective");
      }
    } catch (error) {
      console.error("Failed to update objective", error);
      alert("Failed to update objective");
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">
            Skill
          </label>
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DogTrainingObjective["status"])}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="rounded-lg border border-current bg-white/50 p-2 opacity-70 transition hover:opacity-100"
      title="Edit objective"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
  );
}

