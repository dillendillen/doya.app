"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UseDeleteActionOptions = {
  endpoint: string;
  confirmMessage: string;
  onSuccess?: () => void;
  redirectPath?: string;
};

/**
 * Shared hook for delete actions across the application
 */
export function useDeleteAction({
  endpoint,
  confirmMessage,
  onSuccess,
  redirectPath,
}: UseDeleteActionOptions) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to delete." }));
        const errorMessage = payload.error ?? `Failed to delete (${response.status}).`;
        throw new Error(errorMessage);
      }

      // Call custom success handler if provided
      if (onSuccess) {
        onSuccess();
      }

      // Refresh and optionally redirect
      if (redirectPath) {
        router.push(redirectPath);
        router.refresh();
      } else {
        // Use router.refresh() first, then reload if needed
        router.refresh();
        // Small delay to ensure refresh completes before reload
        setTimeout(() => {
          window.location.reload();
        }, 200);
      }
    } catch (error) {
      console.error("Delete failed", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete. Please try again.";
      alert(errorMessage);
      setIsDeleting(false);
    }
  };

  return { handleDelete, isDeleting };
}

