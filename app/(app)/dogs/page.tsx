import Link from "next/link";
import { format } from "date-fns";
import { listDogs } from "@/lib/data/dogs";
import { TopBar } from "@/components/layout/top-bar";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export default function DogsPage() {
  const dogs = listDogs();

  return (
    <div className="space-y-6">
      <TopBar
        title="Dogs"
        actions={[
          { label: "New Dog" },
          { label: "Add Note" },
        ]}
      />

      <Table headers={["Dog", "Client", "Tags", "Active plan", "Last session", ""]}>
        {dogs.map((dog) => (
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
                  <p className="text-xs text-neutral-500">{dog.breed}</p>
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
    </div>
  );
}
