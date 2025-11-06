"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PencilIcon } from "@/components/ui/icons";

type PackageOption = {
  id: string;
  type: string;
  sessionsRemaining: number;
  totalSessions: number;
  currency: string;
  clientId?: string;
};

type AssignPackageButtonProps = {
  sessionId: string;
  clientId: string | null;
  currentPackageId: string | null;
  currentPackageInfo: {
    type: string;
    sessionsRemaining: number;
    totalSessions: number;
  } | null;
};

export function AssignPackageButton({
  sessionId,
  clientId,
  currentPackageId,
  currentPackageInfo,
}: AssignPackageButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(currentPackageId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clientId) {
      loadPackages();
    }
  }, [isOpen, clientId]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      // Use the packages API to get packages for the client
      const response = await fetch(`/api/packages?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter packages with remaining sessions
        const availablePackages = (data.packages || [])
          .filter((pkg: any) => pkg.sessionsRemaining > 0)
          .map((pkg: any) => ({
            id: pkg.id,
            type: pkg.templateName || "Package",
            sessionsRemaining: pkg.sessionsRemaining,
            totalSessions: pkg.totalSessions || pkg.sessionsRemaining,
            currency: pkg.currency,
          }));
        setPackages(availablePackages);
      }
    } catch (error) {
      console.error("Failed to load packages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to assign package." }));
        throw new Error(payload.error ?? "Failed to assign package.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign package.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clientId) {
    return null; // Can't assign package without a client
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        title={currentPackageInfo ? "Change package" : "Assign package"}
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
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
                    {currentPackageInfo ? "Change Package" : "Assign Package"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                    {currentPackageInfo
                      ? "Select a different package for this session."
                      : "Select a package to link to this session. When the session is completed, one session will be deducted from the package."}
                  </Dialog.Description>

                  {currentPackageInfo && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-900">Current Package:</p>
                      <p className="text-blue-700">{currentPackageInfo.type}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {currentPackageInfo.sessionsRemaining} of {currentPackageInfo.totalSessions} sessions remaining
                      </p>
                    </div>
                  )}

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Package
                      </label>
                      {loading ? (
                        <p className="text-sm text-neutral-500 dark:text-slate-400">Loading packages...</p>
                      ) : (
                        <select
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        >
                          <option value="">No package (remove assignment)</option>
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.type} - {pkg.sessionsRemaining} sessions remaining ({pkg.totalSessions} total)
                            </option>
                          ))}
                        </select>
                      )}
                      {packages.length === 0 && !loading && (
                        <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
                          No packages with remaining sessions available for this client.
                        </p>
                      )}
                    </div>

                    {selectedPackageId && packages.find((p) => p.id === selectedPackageId) && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          After this session:
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          {packages.find((p) => p.id === selectedPackageId)!.sessionsRemaining - 1} session
                          {packages.find((p) => p.id === selectedPackageId)!.sessionsRemaining - 1 !== 1 ? "s" : ""} will remain
                        </p>
                      </div>
                    )}

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
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

