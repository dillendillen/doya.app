"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/ui/icons";

type DeleteSessionButtonProps = {
  sessionId: string;
  sessionTitle?: string | null;
  onDelete?: () => void;
};

export function DeleteSessionButton({
  sessionId,
  sessionTitle,
  onDelete,
}: DeleteSessionButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmMessage = sessionTitle
      ? `Delete session "${sessionTitle}"? This action cannot be undone.`
      : "Delete this session? This action cannot be undone.";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to delete session." }));
        throw new Error(payload.error ?? "Failed to delete session.");
      }

      // Refresh the page to ensure all data is updated
      router.refresh();
      
      if (onDelete) {
        onDelete();
      } else {
        // Use both router navigation and window reload for comprehensive refresh
        router.push("/sessions");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error("Delete session failed", error);
      alert(error instanceof Error ? error.message : "Failed to delete session.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:border-red-300 hover:bg-red-100"
      title="Delete session"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}


