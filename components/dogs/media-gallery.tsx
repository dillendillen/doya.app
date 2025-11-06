"use client";

import { useState } from "react";
import { DeleteMediaButton } from "./delete-media-button";
import { MediaViewer } from "./media-viewer";

type MediaItem = {
  id: string;
  url: string | null;
  thumbUrl: string | null;
  type: string | null;
};

type MediaGalleryProps = {
  media: MediaItem[];
};

export function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMedia(null);
  };

  if (media.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/30 p-6 text-center">
        <p className="text-sm font-medium text-pink-700">
          No media uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-pink-200/60 bg-gradient-to-br from-pink-50 to-white shadow-sm transition-all hover:border-pink-300 hover:shadow-lg hover:scale-105 cursor-pointer"
            onClick={() => handleMediaClick(item)}
          >
            {(item.thumbUrl || item.url) ? (
              <img
                src={item.thumbUrl || item.url}
                alt={item.id}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 to-pink-50 text-xs font-medium text-pink-600">
                Media
              </div>
            )}
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <DeleteMediaButton mediaId={item.id} />
            </div>
          </div>
        ))}
      </div>

      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}

