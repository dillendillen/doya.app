"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@/components/ui/icons";

type MediaItem = {
  id: string;
  url: string | null;
  thumbUrl: string | null;
  type: string | null;
};

type MediaViewerProps = {
  media: MediaItem;
  isOpen: boolean;
  onClose: () => void;
};

export function MediaViewer({ media, isOpen, onClose }: MediaViewerProps) {
  const mediaUrl = media.url || media.thumbUrl;
  const isVideo = media.type?.startsWith("video/") || mediaUrl?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-5xl transform rounded-2xl bg-slate-900 shadow-2xl transition-all">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="p-4">
                  {mediaUrl ? (
                    isVideo ? (
                      <video
                        src={mediaUrl}
                        controls
                        autoPlay
                        className="w-full rounded-lg"
                        style={{ maxHeight: "80vh" }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Media"
                        className="mx-auto w-full rounded-lg"
                        style={{ maxHeight: "80vh", objectFit: "contain" }}
                      />
                    )
                  ) : (
                    <div className="flex h-64 items-center justify-center text-white">
                      <p>Media not available</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

