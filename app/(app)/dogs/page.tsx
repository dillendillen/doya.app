import { listDogs } from "@/lib/data/dogs";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { NewDogButton } from "@/components/dashboard/new-dog-button";
import { DogsPageClient } from "./dogs-page-client";

export default async function DogsPage() {
  const [dogs, clientOptions] = await Promise.all([
    listDogs(),
    listClientsForQuickCreate(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Dogs"
        actions={[
          {
            key: "new-dog",
            node: <NewDogButton variant="topbar" clients={clientOptions} />,
          },
          { label: "Add Note" },
        ]}
      />

      <DogsPageClient dogs={dogs} />
    </div>
  );
}

