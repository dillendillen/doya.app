"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/ui/icons";

type RepurchasePackageButtonProps = {
  packageId: string;
  packageType: string;
  clientId: string;
  totalCredits: number;
  priceCents: number;
  currency: string;
  expiresOn: string | null;
};

export function RepurchasePackageButton({
  packageId,
  packageType,
  clientId,
  totalCredits,
  priceCents,
  currency,
  expiresOn,
}: RepurchasePackageButtonProps) {
  const router = useRouter();
  const [isRepurchasing, setIsRepurchasing] = useState(false);

  const handleRepurchase = async () => {
    if (!confirm(`Repurchase "${packageType}" for this client?`)) {
      return;
    }

    setIsRepurchasing(true);

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: packageType,
          totalCredits,
          price: priceCents / 100,
          currency,
          expiresOn: expiresOn || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to repurchase package." }));
        throw new Error(payload.error ?? "Failed to repurchase package.");
      }

      // Refresh the page to show the new package
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Repurchase package failed", error);
      alert(error instanceof Error ? error.message : "Failed to repurchase package.");
    } finally {
      setIsRepurchasing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRepurchase}
      disabled={isRepurchasing}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      title="Repurchase this package"
    >
      <PlusIcon className="h-3 w-3" />
      {isRepurchasing ? "Repurchasing..." : "Repurchase"}
    </button>
  );
}

