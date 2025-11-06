"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeleteBehaviorLogButtonProps = {
  logId: string;
};

export function DeleteBehaviorLogButton({ logId }: DeleteBehaviorLogButtonProps) {
  return (
    <DeleteButton
      endpoint={`/api/dogs/notes/${logId}`}
      confirmMessage="Delete this behavior log? This action cannot be undone."
      title="Delete behavior log"
    />
  );
}

