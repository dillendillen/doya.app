"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@/components/ui/icons";
import type { MediaListItem } from "@/lib/data/media";
import type { DogQuickPick } from "@/lib/data/dogs";
import type { ClientQuickPick } from "@/lib/data/clients";

type MediaPageClientProps = {
  initialMedia: MediaListItem[];
  dogs: DogQuickPick[];
  clients: ClientQuickPick[];
};

export function MediaPageClient({ initialMedia, dogs, clients }: MediaPageClientProps) {
  const router = useRouter();
  const [filterDog, setFilterDog] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDog, setSelectedDog] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);

  const filteredMedia = useMemo(() => {
    return initialMedia.filter((item) => {
      // Filtering would need dog/client relationship in MediaListItem
      // For now, return all - this would need to be enhanced based on actual data structure
      return true;
    });
  }, [initialMedia, filterDog, filterClient]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (selectedDog) formData.append("dogId", selectedDog);
    if (selectedClient) formData.append("clientId", selectedClient);

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      router.refresh();
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedDog("");
      setSelectedClient("");
      setPreview(null);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={filterDog}
          onChange={(e) => setFilterDog(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <option value="all">All Dogs</option>
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name}
            </option>
          ))}
        </select>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <option value="all">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary ml-auto"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Media
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMedia.map((asset) => (
          <div
            key={asset.id}
            className="card-modern p-4 space-y-3 group hover:scale-[1.02] transition-transform"
          >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
              {(asset.thumbUrl || asset.url) && (
                <img
                  src={asset.thumbUrl ?? asset.url}
                  alt={asset.tags.join(", ") || "Media"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs uppercase text-slate-500">
              <span>{asset.tags[0] ?? "Untagged"}</span>
              <Badge variant={asset.consentScope === "share_later" ? "success" : "muted"}>
                {asset.consentScope}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {new Date(asset.uploadedAt).toLocaleDateString()}
              </p>
              <button
                onClick={async () => {
                  if (confirm("Delete this media?")) {
                    try {
                      const response = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
                      if (response.ok) {
                        router.refresh();
                      } else {
                        alert("Failed to delete media");
                      }
                    } catch (error) {
                      console.error("Delete failed", error);
                      alert("Failed to delete media");
                    }
                  }
                }}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            No media found. Upload session clips to start building a library.
          </p>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-brand-secondary mb-4">Upload Media</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-primary/90"
                />
                {preview && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                  </div>
                )}
              </div>
              <select
                value={selectedDog}
                onChange={(e) => setSelectedDog(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select Dog (optional)</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select Client (optional)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

