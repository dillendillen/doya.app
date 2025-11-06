/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type ClientForm = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  referral: string;
  vatId: string;
  notes: string;
};

type EditClientButtonProps = {
  client: ClientForm;
};

export function EditClientButton({ client }: EditClientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(client);

  useEffect(() => {
    setForm(client);
  }, [client]);

  const openModal = () => {
    setForm(client);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleChange = (field: keyof ClientForm, value: string) => {
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
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
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
        const payload = await response.json().catch(() => ({ error: "Failed to update client." }));
        throw new Error(payload.error ?? "Failed to update client.");
      }

      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to update client.");
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
        Edit Client
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
                    Edit client
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-neutral-500">
                    Update contact details and keep records accurate.
                  </p>
                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-name">
                        Name
                      </label>
                      <input
                        id="edit-client-name"
                        name="name"
                        required
                        value={form.name}
                        onChange={(event) => handleChange("name", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-phone">
                          Phone
                        </label>
                        <input
                          id="edit-client-phone"
                          name="phone"
                          value={form.phone}
                          onChange={(event) => handleChange("phone", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-email">
                          Email
                        </label>
                        <input
                          id="edit-client-email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={(event) => handleChange("email", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-address">
                        Address
                      </label>
                      <input
                        id="edit-client-address"
                        name="address"
                        value={form.address}
                        onChange={(event) => handleChange("address", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-language">
                          Preferred language
                        </label>
                        <input
                          id="edit-client-language"
                          name="language"
                          value={form.language}
                          onChange={(event) => handleChange("language", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-referral">
                          Referral source
                        </label>
                        <input
                          id="edit-client-referral"
                          name="referral"
                          value={form.referral}
                          onChange={(event) => handleChange("referral", event.target.value)}
                          placeholder="Existing client, vet, web form…"
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-vat">
                        VAT / Tax ID
                      </label>
                      <input
                        id="edit-client-vat"
                        name="vatId"
                        value={form.vatId}
                        onChange={(event) => handleChange("vatId", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary" htmlFor="edit-client-notes">
                        Internal notes
                      </label>
                      <textarea
                        id="edit-client-notes"
                        name="notes"
                        rows={3}
                        value={form.notes}
                        onChange={(event) => handleChange("notes", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                      />
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
