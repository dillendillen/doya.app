import { listClients } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { NewClientButton } from "@/components/dashboard/new-client-button";
import { ClientsPageClient } from "./clients-page-client";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <TopBar
        title="Clients"
        actions={[
          { key: "new-client", node: <NewClientButton variant="topbar" /> },
        ]}
      />

      <ClientsPageClient clients={clients} />
    </div>
  );
}
