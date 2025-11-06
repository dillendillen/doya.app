"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeleteNoteButtonProps = {
  noteId: string;
};

export function DeleteNoteButton({ noteId }: DeleteNoteButtonProps) {
  return (
    <DeleteButton
      endpoint={`/api/dogs/notes/${noteId}`}
      confirmMessage="Delete this note? This action cannot be undone."
      title="Delete note"
      className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
    />
  );
}


