"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeleteClientNoteButtonProps = {
  noteId: string;
  noteType?: "note" | "email";
};

export function DeleteClientNoteButton({ noteId, noteType = "note" }: DeleteClientNoteButtonProps) {
  const confirmMessage =
    noteType === "email"
      ? "Delete this email from the communication log? This action cannot be undone."
      : "Delete this note? This action cannot be undone.";

  return (
    <DeleteButton
      endpoint={`/api/clients/notes/${noteId}`}
      confirmMessage={confirmMessage}
      title="Delete note"
    />
  );
}

