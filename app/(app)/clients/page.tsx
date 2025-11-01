import Link from "next/link";
import { listClients } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ClientsPage() {
  const clients = listClients();

  return (
    <div className="space-y-6">
      <TopBar
        title="Clients"
        actions={[
          { label: "New Client" },
          { label: "New Package" },
        ]}
      />

      <Table headers={["Client", "Contact", "Language", "Packages", "Balance", ""]}>
        {clients.map((client) => (
          <tr key={client.id}>
            <td className="px-4 py-3 text-sm font-medium text-brand-secondary">
              <Link href={`/clients/${client.id}`}>{client.name}</Link>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              <div>{client.phone}</div>
              <div className="text-xs text-neutral-500">{client.email}</div>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              <Badge variant="muted">{client.language}</Badge>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {client.packages}
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {client.balanceCredits} credits
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
    </div>
  );
}
