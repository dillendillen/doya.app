"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { DogListItem } from "@/lib/data/dogs";

type DogsPageClientProps = {
  dogs: DogListItem[];
};

type SortField = "dog" | "client" | "tags" | "activePlan" | "status" | "lastSession";
type SortDirection = "asc" | "desc";

function getStatusBadgeVariant(status: DogListItem["status"]) {
  switch (status) {
    case "in_training":
      return "success" as const;
    case "hold":
      return "warning" as const;
    case "prospect":
      return "default" as const;
    case "done":
      return "muted" as const;
    default:
      return "muted" as const;
  }
}

function formatStatus(status: DogListItem["status"]) {
  switch (status) {
    case "in_training":
      return "In Training";
    case "hold":
      return "Hold";
    case "prospect":
      return "Prospect";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export function DogsPageClient({ dogs }: DogsPageClientProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedDogs = useMemo(() => {
    if (!sortField) return dogs;

    return [...dogs].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case "dog":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "client":
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case "tags":
          aVal = a.tags.join(", ").toLowerCase();
          bVal = b.tags.join(", ").toLowerCase();
          break;
        case "activePlan":
          aVal = a.activePlanName?.toLowerCase() ?? "";
          bVal = b.activePlanName?.toLowerCase() ?? "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "lastSession":
          aVal = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
          bVal = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [dogs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left font-medium text-brand-secondary hover:underline"
    >
      {label}
      {sortField === field && (
        <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  return (
    <Table
      headers={[
        <SortButton key="dog" field="dog" label="Dog" />,
        <SortButton key="client" field="client" label="Client" />,
        <SortButton key="tags" field="tags" label="Tags" />,
        <SortButton key="activePlan" field="activePlan" label="Active Plan" />,
        <SortButton key="status" field="status" label="Status" />,
        <SortButton key="lastSession" field="lastSession" label="Last Session" />,
        "",
      ]}
    >
      {sortedDogs.map((dog) => (
        <tr key={dog.id}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar label={dog.name} src={dog.photoUrl} />
              <div>
                <Link
                  href={`/dogs/${dog.id}`}
                  className="font-medium text-brand-secondary"
                >
                  {dog.name}
                </Link>
                <p className="text-xs text-neutral-500">{dog.breed ?? "—"}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            {dog.clientName}
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {dog.tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            {dog.activePlanName ?? "—"}
          </td>
          <td className="px-4 py-3">
            <Badge variant={getStatusBadgeVariant(dog.status)}>
              {formatStatus(dog.status)}
            </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            {dog.lastSessionDate
              ? format(new Date(dog.lastSessionDate), "MMM d, yyyy")
              : "—"}
          </td>
          <td className="px-4 py-3 text-right">
            <Link
              href={`/dogs/${dog.id}`}
              className="text-sm font-medium text-brand-secondary"
            >
              View →
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
}

