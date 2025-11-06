"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type PackageTemplate = {
  id: string;
  type: string;
  totalCredits: number;
  priceCents: number;
  currency: string;
};

type NewPackageButtonProps = {
  clients?: Array<{ id: string; name: string }>;
  isTemplate?: boolean;
};

/**
 * Unified package button component for creating templates or assigning packages to clients
 */
export function NewPackageButton({ clients = [], isTemplate = false }: NewPackageButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [name, setName] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates when modal opens and not creating template
  useEffect(() => {
    if (isOpen && !isTemplate) {
      loadTemplates();
    }
  }, [isOpen, isTemplate]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/packages/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to load templates", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // When template is selected, populate fields
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setName(template.type);
        setSessionCount(template?.totalCredits?.toString() ?? "0");
        setPrice((template.priceCents / 100).toFixed(2));
        setCurrency(template.currency);
      }
    }
  }, [templateId, templates]);

  const resetForm = () => {
    setClientId("");
    setTemplateId("");
    setName("");
    setSessionCount("");
    setPrice("");
    setCurrency("EUR");
    setExpiresInDays("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // If template is selected, use it to create package for client
      if (templateId && !isTemplate) {
        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            amount: parseFloat(price),
            currency,
            packageTemplateId: templateId,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Failed to assign package." }));
          throw new Error(payload.error ?? "Failed to assign package.");
        }
      } else {
        // Create new package (template or custom)
        const response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: isTemplate ? null : clientId,
            type: name.trim(),
            totalCredits: parseInt(sessionCount, 10),
            price: parseFloat(price),
            currency,
            expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : null,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Failed to create package." }));
          throw new Error(payload.error ?? "Failed to create package.");
        }
      }

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create package.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        {isTemplate ? "New Package Template" : "New Package"}
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary dark:text-slate-100">
                    {isTemplate ? "Create Package Template" : "Assign Package to Client"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                    {isTemplate
                      ? "Create a reusable package template that can be assigned to clients."
                      : "Select a package template or create a custom package for this client."}
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    {!isTemplate && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Client *
                          </label>
                          <select
                            value={clientId}
                            onChange={(e) => {
                              setClientId(e.target.value);
                              setTemplateId("");
                            }}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            required
                          >
                            <option value="">Select Client</option>
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Package Template (optional)
                          </label>
                          {loadingTemplates ? (
                            <p className="text-sm text-neutral-500 dark:text-slate-400">Loading templates...</p>
                          ) : (
                            <select
                              value={templateId}
                              onChange={(e) => {
                                setTemplateId(e.target.value);
                                if (!e.target.value) {
                                  setName("");
                                  setSessionCount("");
                                  setPrice("");
                                }
                              }}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            >
                              <option value="">Select Template or Create Custom</option>
                              {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.type} - {template.totalCredits} sessions - {(template.priceCents / 100).toFixed(2)} {template.currency}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., 10 Sessions Standard Pack"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        required
                        disabled={!!templateId && !isTemplate}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Sessions Included *
                        </label>
                        <input
                          type="number"
                          value={sessionCount}
                          onChange={(e) => setSessionCount(e.target.value)}
                          min="1"
                          placeholder="10"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          required
                          disabled={!!templateId && !isTemplate}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          placeholder="500.00"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          required
                          disabled={!!templateId && !isTemplate}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          disabled={!!templateId && !isTemplate}
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Expires In (days, optional)
                        </label>
                        <input
                          type="number"
                          value={expiresInDays}
                          onChange={(e) => setExpiresInDays(e.target.value)}
                          min="1"
                          placeholder="90"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          (!isTemplate && !clientId) ||
                          !name.trim() ||
                          !sessionCount ||
                          !price
                        }
                        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Creating..." : templateId && !isTemplate ? "Assign Package" : "Create"}
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
