/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import type { ChangeEvent } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type ClientOption = {
  id: string;
  name: string;
};

type DogForm = {
  id: string;
  name: string;
  clientId: string;
  breed: string;
  sex: "M" | "F";
  tagsInput: string;
  dob: string;
  weightKg: string;
  medicalFlagsInput: string;
  triggersInput: string;
  consentInternal: boolean;
  consentShareLater: boolean;
  photoData: string;
  note: string;
};

type EditDogButtonProps = {
  dog: DogForm;
  clients: ClientOption[];
};

export function EditDogButton({ dog, clients }: EditDogButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DogForm>(dog);

  useEffect(() => {
    setForm(dog);
  }, [dog]);

  const clientOptions = useMemo(() => clients, [clients]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const openModal = () => {
    setForm(dog);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleChange = (field: keyof DogForm, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoSelect = async (file: File | null) => {
    setError(null);

    if (!file) {
      setForm((prev) => ({ ...prev, photoData: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (png, jpg, gif).");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read file."));
          }
        };
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      setForm((prev) => ({
        ...prev,
        photoData: dataUrl,
      }));
    } catch (err) {
      console.error("Failed to process photo upload", err);
      setError(err instanceof Error ? err.message : "Failed to process the selected image.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    void handlePhotoSelect(file);
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    void handlePhotoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tags = parseList(form.tagsInput);
    const medicalFlags = parseList(form.medicalFlagsInput);
    const triggers = parseList(form.triggersInput);
    const weight =
      form.weightKg.trim().length > 0 ? Number.parseFloat(form.weightKg.trim()) : undefined;

    if (weight !== undefined && (Number.isNaN(weight) || weight < 0)) {
      setIsSubmitting(false);
      setError("Weight must be a positive number.");
      return;
    }

    try {
      const response = await fetch(`/api/dogs/${dog.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          clientId: form.clientId,
          breed: form.breed.trim(),
          sex: form.sex,
          tags,
          medicalFlags,
          triggers,
          dob: form.dob || undefined,
          weightKg: weight,
          consentInternal: form.consentInternal,
          consentShareLater: form.consentShareLater,
          photo: form.photoData || undefined,
          note: form.note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to update dog." }));
        throw new Error(payload.error ?? "Failed to update dog.");
      }

      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update dog.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-secondary hover:text-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/60"
      >
        <PlusIcon className="h-4 w-4 text-brand-secondary" />
        Edit Dog
      </button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary">
                    Edit dog
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-neutral-500">
                    Update key details and keep the profile in sync.
                  </p>
                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-name">
                        Name
                      </label>
                      <input
                        id="edit-dog-name"
                        name="name"
                        required
                        value={form.name}
                        onChange={(event) => handleChange("name", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-client">
                        Client
                      </label>
                      <select
                        id="edit-dog-client"
                        name="clientId"
                        required
                        value={form.clientId}
                        onChange={(event) => handleChange("clientId", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      >
                        {clientOptions.map((clientOption) => (
                          <option key={clientOption.id} value={clientOption.id}>
                            {clientOption.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-breed">
                          Breed
                        </label>
                        <input
                          id="edit-dog-breed"
                          name="breed"
                          value={form.breed}
                          onChange={(event) => handleChange("breed", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-sex">
                          Sex
                        </label>
                        <select
                          id="edit-dog-sex"
                          name="sex"
                          value={form.sex}
                          onChange={(event) => handleChange("sex", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        >
                          <option value="F">Female</option>
                          <option value="M">Male</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-dob">
                          Date of birth
                        </label>
                        <input
                          id="edit-dog-dob"
                          name="dob"
                          type="date"
                          value={form.dob}
                          onChange={(event) => handleChange("dob", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-weight">
                          Weight (kg)
                        </label>
                        <input
                          id="edit-dog-weight"
                          name="weightKg"
                          type="number"
                          min={0}
                          step={0.1}
                          value={form.weightKg}
                          onChange={(event) => handleChange("weightKg", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-medical">
                          Medical flags
                        </label>
                        <input
                          id="edit-dog-medical"
                          name="medicalFlags"
                          value={form.medicalFlagsInput}
                          onChange={(event) => handleChange("medicalFlagsInput", event.target.value)}
                          placeholder="allergies, meds"
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-triggers">
                          Triggers
                        </label>
                        <input
                          id="edit-dog-triggers"
                          name="triggers"
                          value={form.triggersInput}
                          onChange={(event) => handleChange("triggersInput", event.target.value)}
                          placeholder="strangers, bikes"
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-tags">
                        Tags
                      </label>
                      <input
                        id="edit-dog-tags"
                        name="tags"
                        value={form.tagsInput}
                        onChange={(event) => handleChange("tagsInput", event.target.value)}
                        placeholder="reactive, puppy"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-photo">
                        Profile photo
                      </label>
                      <div className="flex flex-col gap-2">
                        <input
                          id="edit-dog-photo"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-secondary/90"
                        />
                        {form.photoData && (
                          <div className="flex items-center gap-3">
                            <img
                              src={form.photoData}
                              alt={`${form.name || "Dog"} preview`}
                              className="h-16 w-16 rounded-full object-cover ring-1 ring-neutral-200"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="text-xs font-medium text-brand-secondary hover:underline"
                            >
                              Remove photo
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-neutral-500">
                          Update the cover image shown in lists and profiles.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium text-brand-secondary">Consents</span>
                      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
                        <label className="flex items-center gap-2 text-sm text-neutral-600">
                          <input
                            type="checkbox"
                            checked={form.consentInternal}
                            onChange={(event) => handleChange("consentInternal", event.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 text-brand-secondary focus:ring-brand-secondary"
                          />
                          <span>Keep media internal.</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-neutral-600">
                          <input
                            type="checkbox"
                            checked={form.consentShareLater}
                            onChange={(event) => handleChange("consentShareLater", event.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 text-brand-secondary focus:ring-brand-secondary"
                          />
                          <span>Allowed to share media with client later.</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-dog-note">
                        Add internal note
                      </label>
                      <textarea
                        id="edit-dog-note"
                        name="note"
                        rows={3}
                        value={form.note}
                        onChange={(event) => handleChange("note", event.target.value)}
                        placeholder="What changed, what should the team remember?"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                      <p className="text-xs text-neutral-500">
                        We’ll append this as a new internal note linked to the dog.
                      </p>
                    </div>

                    {error && <p className="text-sm text-rose-600">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
