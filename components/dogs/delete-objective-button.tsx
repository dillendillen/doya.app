"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeleteObjectiveButtonProps = {
  objectiveId: string;
  dogId: string;
  skill: string;
};

export function DeleteObjectiveButton({ objectiveId, dogId, skill }: DeleteObjectiveButtonProps) {
  return (
    <DeleteButton
      endpoint={`/api/dogs/${dogId}/objectives/${objectiveId}`}
      confirmMessage={`Delete training objective "${skill}"? This action cannot be undone.`}
      title="Delete objective"
    />
  );
}

