/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type Variant = "topbar" | "quickCapture";

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  referral: string;
  vatId: string;
  notes: string;
};

const INITIAL_STATE: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  language: "",
  referral: "",
  vatId: "",
  notes: "",
};

type NewClientButtonProps = {
  variant: Variant;
};

export function NewClientButton({ variant }: NewClientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          language: form.language.trim(),
          referral: form.referral.trim(),
          vatId: form.vatId.trim(),
          notes: form.notes.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to create client." }));
        throw new Error(payload.error ?? "Failed to create client.");
      }

      setForm(INITIAL_STATE);
      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to create client.");
    }
  };

  if (variant === "quickCapture") {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          className="group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-secondary px-4 py-4 text-left text-sm font-medium text-white shadow-sm ring-brand-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <PlusIcon className="h-4 w-4" />
            Add Client
          </span>
          <span className="text-xs font-normal text-white/80">
            Convert a lead and link dogs.
          </span>
        </button>
        <NewClientDialog
          isOpen={isOpen}
          form={form}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleChange}
          error={error}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
      >
        <PlusIcon className="h-4 w-4 text-brand-primary" />
        Add Client
      </button>
      <NewClientDialog
        isOpen={isOpen}
        form={form}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        error={error}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

type DialogProps = {
  isOpen: boolean;
  form: FormState;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof FormState, value: string) => void;
  error: string | null;
  isSubmitting: boolean;
};

function NewClientDialog({
  isOpen,
  form,
  onClose,
  onSubmit,
  onChange,
  error,
  isSubmitting,
}: DialogProps) {
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
                  Add a new client
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500">
                  Capture contact details and follow up later with packages or sessions.
                </p>

                <form className="mt-4 space-y-4" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="client-name">
                      Name
                    </label>
                    <input
                      id="client-name"
                      name="name"
                      required
                      value={form.name}
                      onChange={(event) => onChange("name", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="client-phone">
                        Phone
                      </label>
                      <input
                        id="client-phone"
                        name="phone"
                        value={form.phone}
                        onChange={(event) => onChange("phone", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="client-email">
                        Email
                      </label>
                      <input
                        id="client-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => onChange("email", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="client-address">
                      Address
                    </label>
                    <input
                      id="client-address"
                      name="address"
                      value={form.address}
                      onChange={(event) => onChange("address", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="client-language">
                        Preferred language
                      </label>
                      <input
                        id="client-language"
                        name="language"
                        value={form.language}
                        onChange={(event) => onChange("language", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="client-referral">
                        Referral source
                      </label>
                      <input
                        id="client-referral"
                        name="referral"
                        value={form.referral}
                        onChange={(event) => onChange("referral", event.target.value)}
                        placeholder="Existing client, vet, web form…"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="client-vat">
                      VAT / Tax ID
                    </label>
                    <input
                      id="client-vat"
                      name="vatId"
                      value={form.vatId}
                      onChange={(event) => onChange("vatId", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary" htmlFor="client-notes">
                      Internal notes
                    </label>
                    <textarea
                      id="client-notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={(event) => onChange("notes", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  {error && <p className="text-sm text-rose-600">{error}</p>}

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
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving…" : "Create client"}
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
