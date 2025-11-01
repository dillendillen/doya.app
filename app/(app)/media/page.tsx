import Image from "next/image";
import { listMedia } from "@/lib/data/media";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";

export default function MediaPage() {
  const media = listMedia();

  return (
    <div className="space-y-6">
      <TopBar
        title="Media Library"
        actions={[
          { label: "Upload Media" },
          { label: "Filter" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {media.map((asset) => (
          <div
            key={asset.id}
            className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
              {(asset.thumbUrl || asset.url) && (
                <Image
                  src={asset.thumbUrl ?? asset.url}
                  alt={asset.tags.join(", ") || "Session media"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs uppercase text-neutral-500">
              <span>{asset.tags[0] ?? "Untagged"}</span>
              <Badge variant="muted">{asset.consentScope}</Badge>
            </div>
            <p className="text-xs text-neutral-500">
              Uploaded {new Date(asset.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {media.length === 0 && (
        <p className="text-sm text-neutral-500">
          No media yet. Upload session clips to start building a library.
        </p>
      )}
    </div>
  );
}
