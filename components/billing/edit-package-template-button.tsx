"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@/components/ui/icons";
import type { PackageTemplate } from "@/lib/data/billing";

type EditPackageTemplateButtonProps = {
  template: PackageTemplate;
};

export function EditPackageTemplateButton({ template }: EditPackageTemplateButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [sessionCount, setSessionCount] = useState(template.sessionCount);
  const [price, setPrice] = useState((template.priceCents / 100).toFixed(2));
  const [currency, setCurrency] = useState(template.currency);
  const [expiresInDays, setExpiresInDays] = useState(template.expiresInDays?.toString() || "");

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/packages/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: name,
          totalCredits: sessionCount,
          price: parseFloat(price),
          currency,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to update template");
      }
    } catch (error) {
      console.error("Failed to update template", error);
      alert("Failed to update template");
    }
  };

  if (isEditing) {
    return (
        <div className="space-y-3 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-slate-800 p-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">Session Count</label>
          <input
            type="number"
            value={sessionCount}
            onChange={(e) => setSessionCount(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">Expires In (days, optional)</label>
          <input
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="w-full rounded-lg border border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
            placeholder="Leave empty for no expiry"
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
      title="Edit template"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  );
}

