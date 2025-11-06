import { ConsentScope } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../prisma";

export type MediaListItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  tags: string[];
  consentScope: "internal" | "share_later";
  uploadedAt: string;
};

const CONSENT_MAP: Record<ConsentScope, MediaListItem["consentScope"]> = {
  INTERNAL: "internal",
  SHARE_LATER: "share_later",
};

export async function listMedia(limit = 30): Promise<MediaListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { uploadedAt: "desc" },
    take: limit,
  });

  return assets.map((asset) => ({
    id: asset.id,
    url: asset.url,
    thumbUrl: asset.thumbUrl,
    tags: asset.tags,
    consentScope: CONSENT_MAP[asset.consentScope],
    uploadedAt: asset.uploadedAt.toISOString(),
  }));
}
