"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteMediaButtonProps = {
  mediaId: string;
};

export function DeleteMediaButton({ mediaId }: DeleteMediaButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this media?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (response.ok) {
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } else {
        const payload = await response.json().catch(() => ({ error: "Failed to delete media." }));
        alert(payload.error ?? "Failed to delete media");
      }
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete media. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute top-2 right-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg opacity-0 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl group-hover:opacity-100 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}

