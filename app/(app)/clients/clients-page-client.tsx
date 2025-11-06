"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ClientListItem } from "@/lib/data/clients";

type ClientsPageClientProps = {
  clients: ClientListItem[];
};

type SortField = "client" | "contact" | "source" | "language";
type SortDirection = "asc" | "desc";

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedClients = useMemo(() => {
    if (!sortField) return clients;

    return [...clients].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortField) {
        case "client":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "contact":
          aVal = `${a.phone} ${a.email}`.toLowerCase();
          bVal = `${b.phone} ${b.email}`.toLowerCase();
          break;
        case "source":
          aVal = a.source.toLowerCase();
          bVal = b.source.toLowerCase();
          break;
        case "language":
          aVal = a.language.toLowerCase();
          bVal = b.language.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [clients, sortField, sortDirection]);

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
        <SortButton key="client" field="client" label="Client" />,
        <SortButton key="contact" field="contact" label="Contact" />,
        <SortButton key="source" field="source" label="Source" />,
        <SortButton key="language" field="language" label="Language" />,
        "",
      ]}
    >
      {sortedClients.map((client) => (
        <tr key={client.id}>
          <td className="px-4 py-3 text-sm font-medium text-brand-secondary">
            <Link href={`/clients/${client.id}`}>{client.name}</Link>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            <div>{client.phone}</div>
            <div className="text-xs text-neutral-500">{client.email}</div>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            <Badge variant="muted">{client.source}</Badge>
          </td>
          <td className="px-4 py-3 text-sm text-neutral-600">
            <Badge variant="muted">{client.language}</Badge>
          </td>
          <td className="px-4 py-3 text-right">
            <Link
              href={`/clients/${client.id}`}
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

