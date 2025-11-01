import { mediaLibrary } from "../mock-data";
import type { Media } from "../types";

export function listMedia(): Media[] {
  return mediaLibrary
    .slice()
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 30);
}
