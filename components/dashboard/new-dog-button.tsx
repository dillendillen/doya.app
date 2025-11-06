'use client';

import type { ChangeEvent } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type ClientOption = {
  id: string;
  name: string;
};

type NewDogButtonProps = {
  variant: "topbar" | "quickCapture";
  clients: ClientOption[];
};

type DogFormState = {
  name: string;
  clientId: string;
  breed: string;
  sex: "M" | "F";
  dob: string;
  weightKg: string;
  tags: string;
  medicalFlags: string;
  triggers: string;
  consentInternal: boolean;
  consentShareLater: boolean;
  note: string;
  photoData: string;
};

const INITIAL_FORM: DogFormState = {
  name: "",
  clientId: "",
  breed: "",
  sex: "F",
  dob: "",
  weightKg: "",
  tags: "",
  medicalFlags: "",
  triggers: "",
  consentInternal: true,
  consentShareLater: false,
  note: "",
  photoData: "",
};

export function NewDogButton({ variant, clients }: NewDogButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DogFormState>(() => {
    if (clients.length === 0) return INITIAL_FORM;
    return { ...INITIAL_FORM, clientId: clients[0]!.id };
  });

  const clientOptions = useMemo(
    () => clients.map((client) => ({ id: client.id, name: client.name })),
    [clients],
  );

  useEffect(() => {
    if (clients.length > 0) {
      setForm((prev) => ({
        ...prev,
        clientId: prev.clientId || clients[0]!.id,
      }));
    }
  }, [clients]);

  const parseList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null);
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

  const handleChange = (
    field: keyof DogFormState,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tags = parseList(form.tags);
    const medicalFlags = parseList(form.medicalFlags);
    const triggers = parseList(form.triggers);

    const weight =
      form.weightKg.trim().length > 0 ? Number.parseFloat(form.weightKg.trim()) : undefined;

    if (weight !== undefined && (Number.isNaN(weight) || weight < 0)) {
      setIsSubmitting(false);
      setError("Weight must be a positive number.");
      return;
    }

    try {
      const response = await fetch("/api/dogs", {
        method: "POST",
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
        const payload = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(payload.error ?? "Failed to create dog");
      }

      setIsSubmitting(false);
      setIsOpen(false);
      setForm((prev) => ({
        ...INITIAL_FORM,
        clientId: clients[0]?.id ?? "",
      }));
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to create dog");
    }
  };

  const hasClients = clients.length > 0;

  if (variant === "quickCapture") {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-secondary via-brand-secondary/90 to-brand-primary px-4 py-4 text-left text-sm font-medium text-white shadow-sm ring-brand-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <PlusIcon className="h-4 w-4" />
            Add Dog
          </span>
          <span className="text-xs font-normal text-white/80">
            Create profile, flags, and plan scaffold.
          </span>
          {!hasClients && (
            <span className="mt-2 text-xs text-white/80">
              Add a client first to create a dog.
            </span>
          )}
        </button>
        <NewDogDialog
          isOpen={isOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onPhotoSelect={handlePhotoSelect}
          form={form}
          clients={clientOptions}
          isSubmitting={isSubmitting}
          error={error}
          canSubmit={hasClients}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon className="h-4 w-4 text-brand-primary" />
        Add Dog
      </button>
      <NewDogDialog
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onPhotoSelect={handlePhotoSelect}
        form={form}
        clients={clientOptions}
        isSubmitting={isSubmitting}
        error={error}
        canSubmit={hasClients}
      />
    </>
  );
}

type NewDogDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof DogFormState, value: string | boolean) => void;
  onPhotoSelect: (file: File | null) => void | Promise<void>;
  form: DogFormState;
  clients: ClientOption[];
  isSubmitting: boolean;
  error: string | null;
  canSubmit: boolean;
};

function NewDogDialog({
  isOpen,
  onClose,
  onSubmit,
  onChange,
  onPhotoSelect,
  form,
  clients,
  isSubmitting,
  error,
  canSubmit,
}: NewDogDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    void onPhotoSelect(file);
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    onPhotoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                  Add a new dog
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500">
                  Capture the basics now. You can enrich the profile later with plans, notes, and media.
                </p>

                <form className="mt-4 space-y-4" onSubmit={onSubmit}>
                  {!canSubmit && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Add a client first so you can assign the dog to an owner.
                    </p>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-name">
                      Name
                    </label>
                    <input
                      id="dog-name"
                      name="name"
                      required
                      value={form.name}
                      onChange={(event) => onChange("name", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-client">
                      Client
                    </label>
                    <select
                      id="dog-client"
                      name="clientId"
                      required
                      value={form.clientId}
                      onChange={(event) => onChange("clientId", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      disabled={!canSubmit}
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-breed">
                        Breed (optional)
                      </label>
                      <input
                        id="dog-breed"
                        name="breed"
                        value={form.breed}
                        onChange={(event) => onChange("breed", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-sex">
                        Sex
                      </label>
                      <select
                        id="dog-sex"
                        name="sex"
                        value={form.sex}
                        onChange={(event) => onChange("sex", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      >
                        <option value="F">Female</option>
                        <option value="M">Male</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-dob">
                        Date of birth (optional)
                      </label>
                      <input
                        id="dog-dob"
                        name="dob"
                        type="date"
                        value={form.dob}
                        onChange={(event) => onChange("dob", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-weight">
                        Weight (kg)
                      </label>
                      <input
                        id="dog-weight"
                        name="weightKg"
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.weightKg}
                        onChange={(event) => onChange("weightKg", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-medical">
                        Medical flags
                      </label>
                      <input
                        id="dog-medical"
                        name="medicalFlags"
                        value={form.medicalFlags}
                        onChange={(event) => onChange("medicalFlags", event.target.value)}
                        placeholder="allergies, meds"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-triggers">
                        Triggers
                      </label>
                      <input
                        id="dog-triggers"
                        name="triggers"
                        value={form.triggers}
                        onChange={(event) => onChange("triggers", event.target.value)}
                        placeholder="strangers, bikes"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-tags">
                      Tags (comma separated)
                    </label>
                    <input
                      id="dog-tags"
                      name="tags"
                      value={form.tags}
                      onChange={(event) => onChange("tags", event.target.value)}
                      placeholder="reactive, puppy"
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-photo">
                      Profile photo
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        id="dog-photo"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-primary/90"
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
                        Square images look best. PNG or JPG up to 2&nbsp;MB.
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
                          onChange={(event) => onChange("consentInternal", event.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span>Keep media internal.</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-neutral-600">
                        <input
                          type="checkbox"
                          checked={form.consentShareLater}
                          onChange={(event) => onChange("consentShareLater", event.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span>Allowed to share media with client later.</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="dog-note">
                      Add internal note (optional)
                    </label>
                    <textarea
                      id="dog-note"
                      name="note"
                      rows={3}
                      value={form.note}
                      onChange={(event) => onChange("note", event.target.value)}
                      placeholder="Initial observations, priorities, or reminders."
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                    <p className="text-xs text-neutral-500">
                      We’ll link this note to the dog so only your team can see it.
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !canSubmit}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving…" : "Create dog"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
