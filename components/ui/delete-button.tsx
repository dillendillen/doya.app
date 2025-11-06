"use client";

import { TrashIcon } from "@/components/ui/icons";
import { useDeleteAction } from "@/lib/utils/delete-action";

type DeleteButtonProps = {
  endpoint: string;
  confirmMessage: string;
  title?: string;
  onSuccess?: () => void;
  redirectPath?: string;
  className?: string;
  iconClassName?: string;
};

/**
 * Reusable delete button component
 */
export function DeleteButton({
  endpoint,
  confirmMessage,
  title = "Delete",
  onSuccess,
  redirectPath,
  className = "rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50",
  iconClassName = "h-4 w-4",
}: DeleteButtonProps) {
  const { handleDelete, isDeleting } = useDeleteAction({
    endpoint,
    confirmMessage,
    onSuccess,
    redirectPath,
  });

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={className}
      title={title}
    >
      <TrashIcon className={iconClassName} />
    </button>
  );
}

