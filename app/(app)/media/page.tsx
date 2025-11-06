import { listMedia } from "@/lib/data/media";
import { listDogsForQuickCreate } from "@/lib/data/dogs";
import { listClientsForQuickCreate } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { MediaPageClient } from "./media-page-client";

export default async function MediaPage() {
  const [media, dogs, clients] = await Promise.all([
    listMedia(),
    listDogsForQuickCreate(),
    listClientsForQuickCreate(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar title="Media Library" actions={[]} />
      <MediaPageClient initialMedia={media} dogs={dogs} clients={clients} />
    </div>
  );
}

