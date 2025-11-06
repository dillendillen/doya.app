/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";

type Variant = "topbar" | "quickCapture";

export type SessionDogOption = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
};

type SessionClientOption = {
  id: string;
  name: string;
};

type FormState = {
  name: string;
  dogId: string;
  clientId: string;
  startTime: string;
  durationMinutes: string;
  location: string;
  notes: string;
  objectives: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "DONE";
  packageId: string;
};

const DEFAULT_STATUS: FormState["status"] = "SCHEDULED";

function formatDateTimeLocal(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localIso = new Date(date.getTime() - timezoneOffset).toISOString();
  return localIso.slice(0, 16);
}

function createInitialState(dogs: SessionDogOption[], clients: SessionClientOption[]): FormState {
  const firstDog = dogs[0];
  const current = formatDateTimeLocal(new Date());
  const derivedClientId = firstDog?.clientId ?? clients[0]?.id ?? "";

  return {
    name: "",
    dogId: firstDog?.id ?? "",
    clientId: derivedClientId,
    startTime: current,
    durationMinutes: "60",
    location: "",
    notes: "",
    objectives: "",
    status: DEFAULT_STATUS,
    packageId: "",
  };
}

type NewSessionButtonProps = {
  variant: Variant;
  dogs: SessionDogOption[];
  clients: SessionClientOption[];
};

export function NewSessionButton({ variant, dogs, clients }: NewSessionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => createInitialState(dogs, clients));
  const [packages, setPackages] = useState<Array<{ id: string; type: string; sessionsRemaining: number; totalSessions: number; isTemplate?: boolean }>>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const dogById = useMemo(() => new Map(dogs.map((dog) => [dog.id, dog])), [dogs]);

  useEffect(() => {
    setForm((prev) => {
      const nextDogId = prev.dogId || dogs[0]?.id || "";
      const inferredClientId =
        (nextDogId ? dogById.get(nextDogId)?.clientId ?? "" : "") || prev.clientId || clients[0]?.id || "";

      if (nextDogId === prev.dogId && inferredClientId === prev.clientId) {
        return prev;
      }

      return {
        ...prev,
        dogId: nextDogId,
        clientId: inferredClientId,
        packageId: "", // Reset package when client changes
      };
    });
  }, [dogs, clients, dogById]);

  // Load packages (both templates and client packages) when client changes
  useEffect(() => {
    const loadPackages = async () => {
      if (!form.clientId) {
        setPackages([]);
        return;
      }

      setLoadingPackages(true);
      try {
        // Fetch both templates and client packages
        const [templatesResponse, clientPackagesResponse] = await Promise.all([
          fetch("/api/packages/templates"),
          fetch(`/api/packages?clientId=${form.clientId}`),
        ]);

        const templatesData = templatesResponse.ok ? await templatesResponse.json() : { templates: [] };
        const clientPackagesData = clientPackagesResponse.ok ? await clientPackagesResponse.json() : { packages: [] };

        // Combine templates and client packages
        const templatePackages = (templatesData.templates || []).map((template: any) => ({
          id: template.id,
          type: template.name,
          sessionsRemaining: template.sessionCount, // Templates have full sessions available
          totalSessions: template.sessionCount,
          isTemplate: true,
        }));

        // Show all client packages (including finished ones with negative balance)
        const clientPackages = (clientPackagesData.packages || []).map((pkg: any) => ({
          id: pkg.id,
          type: pkg.templateName || "Package",
          sessionsRemaining: pkg.sessionsRemaining || 0,
          totalSessions: pkg.totalSessions || pkg.sessionsRemaining || 0,
          isTemplate: false,
        }));

        // Combine and sort: client packages first, then templates
        setPackages([...clientPackages, ...templatePackages]);
      } catch (error) {
        console.error("Failed to load packages", error);
      } finally {
        setLoadingPackages(false);
      }
    };

    if (isOpen && form.clientId) {
      loadPackages();
    }
  }, [isOpen, form.clientId]);

  const clientOptions = clients.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  const openModal = () => {
    setForm((prev) => ({
      ...prev,
      startTime: formatDateTimeLocal(new Date()),
    }));
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    if (field === "dogId") {
      const nextDog = dogById.get(value);
      setForm((prev) => ({
        ...prev,
        dogId: value,
        clientId: nextDog?.clientId ?? "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(createInitialState(dogs, clients));
    setPackages([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const duration = Number.parseInt(form.durationMinutes, 10);
    if (Number.isNaN(duration) || duration <= 0) {
      setError("Duration must be a positive number.");
      setIsSubmitting(false);
      return;
    }

    const objectives = form.objectives
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogId: form.dogId,
          title: form.name.trim() || null, // Send null instead of undefined to ensure it's processed
          clientId: form.clientId,
          startTime: form.startTime,
          durationMinutes: duration,
          location: form.location.trim(),
          status: form.status,
          notes: form.notes.trim(),
          objectives,
          packageId: form.packageId || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to create session." }));
        throw new Error(payload.error ?? "Failed to create session.");
      }

      resetForm();
      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to create session.");
    }
  };

  const selectedDog = dogById.get(form.dogId);
  const linkedClientName =
    selectedDog?.clientName ??
    clientOptions.find((client) => client.id === form.clientId)?.name ??
    "—";

  if (variant === "quickCapture") {
    return (
      <>
        <button
          type="button"
          onClick={openModal}
          disabled={dogs.length === 0}
          className="group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-secondary via-brand-secondary/90 to-brand-primary px-4 py-4 text-left text-sm font-medium text-white shadow-sm ring-brand-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <PlusIcon className="h-4 w-4" />
            New Session
          </span>
          <span className="text-xs font-normal text-white/80">
            Schedule or jump into Live Mode.
          </span>
          {dogs.length === 0 && (
            <span className="mt-2 text-xs text-white/80">
              Add a dog before scheduling sessions.
            </span>
          )}
        </button>
        <NewSessionDialog
          isOpen={isOpen}
          form={form}
          clients={clientOptions}
          dogs={dogs}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleChange}
          error={error}
          isSubmitting={isSubmitting}
          linkedClientName={linkedClientName}
          hasDogs={dogs.length > 0}
          loadingPackages={loadingPackages}
          packages={packages}
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
        New Session
      </button>
      <NewSessionDialog
        isOpen={isOpen}
        form={form}
        clients={clientOptions}
        dogs={dogs}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        error={error}
        isSubmitting={isSubmitting}
        linkedClientName={linkedClientName}
        hasDogs={dogs.length > 0}
        loadingPackages={loadingPackages}
        packages={packages}
      />
    </>
  );
}

type DialogProps = {
  isOpen: boolean;
  form: FormState;
  clients: SessionClientOption[];
  dogs: SessionDogOption[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof FormState, value: string) => void;
  error: string | null;
  isSubmitting: boolean;
  linkedClientName: string;
  hasDogs: boolean;
  loadingPackages: boolean;
  packages: Array<{ id: string; type: string; sessionsRemaining: number; totalSessions: number }>;
};

function NewSessionDialog({
  isOpen,
  form,
  clients,
  dogs,
  onClose,
  onSubmit,
  onChange,
  error,
  isSubmitting,
  linkedClientName,
  hasDogs,
  loadingPackages,
  packages,
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
              <Dialog.Panel className="w-full max-w-xl transform rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-brand-secondary dark:text-slate-100">
                  Schedule a session
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500 dark:text-slate-400">
                  Set the details, define objectives, and capture any context before the session kicks off.
                </p>

                <form className="mt-4 space-y-4" onSubmit={onSubmit}>
                  {!hasDogs && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Add a dog first so you can tie the session to a profile.
                    </p>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-name">
                      Session Name
                    </label>
                    <input
                      type="text"
                      id="session-name"
                      name="name"
                      value={form.name}
                      onChange={(event) => onChange("name", event.target.value)}
                      placeholder="e.g. Intro to loose leash walking"
                      className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-dog">
                      Dog
                    </label>
                    <select
                      id="session-dog"
                      name="dogId"
                      required
                      value={form.dogId}
                      onChange={(event) => onChange("dogId", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      disabled={!hasDogs}
                    >
                      {dogs.map((dog) => (
                        <option key={dog.id} value={dog.id}>
                          {dog.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-start">
                        Start
                      </label>
                      <input
                        id="session-start"
                        name="startTime"
                        type="datetime-local"
                        required
                        value={form.startTime}
                        onChange={(event) => onChange("startTime", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-duration">
                        Duration (minutes)
                      </label>
                      <input
                        id="session-duration"
                        name="durationMinutes"
                        type="number"
                        min={1}
                        value={form.durationMinutes}
                        onChange={(event) => onChange("durationMinutes", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-location">
                        Location
                      </label>
                      <input
                        id="session-location"
                        name="location"
                        required
                        value={form.location}
                        onChange={(event) => onChange("location", event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-client">
                        Client
                      </label>
                      <select
                        id="session-client"
                        name="clientId"
                        value={form.clientId}
                        onChange={(event) => {
                          onChange("clientId", event.target.value);
                          onChange("packageId", ""); // Reset package when client changes
                        }}
                        className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      >
                        <option value="">Unassigned</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.clientId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-package">
                        Package (optional)
                      </label>
                      {loadingPackages ? (
                        <p className="text-sm text-neutral-500 dark:text-slate-400">Loading packages...</p>
                      ) : (
                        <select
                          id="session-package"
                          name="packageId"
                          value={form.packageId}
                          onChange={(event) => onChange("packageId", event.target.value)}
                          className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                        >
                          <option value="">No package</option>
                          {packages.filter((p) => !p.isTemplate).length > 0 && (
                            <optgroup label="Client Packages">
                              {packages.filter((p) => !p.isTemplate).map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.type} - {pkg.sessionsRemaining >= 0 ? `${pkg.sessionsRemaining} sessions remaining` : `${Math.abs(pkg.sessionsRemaining)} sessions over (negative balance)`} ({pkg.totalSessions} total)
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {packages.filter((p) => p.isTemplate).length > 0 && (
                            <optgroup label="Package Templates">
                              {packages.filter((p) => p.isTemplate).map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.type} - {pkg.totalSessions} sessions (will be allocated)
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      )}
                      {form.packageId && packages.find((p) => p.id === form.packageId) && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {packages.find((p) => p.id === form.packageId)!.isTemplate
                            ? `Template will be allocated to client. ${packages.find((p) => p.id === form.packageId)!.totalSessions - 1} sessions will remain after creation.`
                            : (() => {
                                const pkg = packages.find((p) => p.id === form.packageId)!;
                                const remaining = pkg.sessionsRemaining - 1;
                                return remaining >= 0 
                                  ? `After creating: ${remaining} sessions will remain`
                                  : `After creating: ${Math.abs(remaining)} sessions over (negative balance)`;
                              })()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-status">
                      Session status
                    </label>
                    <select
                      id="session-status"
                      name="status"
                      value={form.status}
                      onChange={(event) => onChange("status", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-objectives">
                      Objectives (comma or newline separated)
                    </label>
                    <textarea
                      id="session-objectives"
                      name="objectives"
                      rows={2}
                      value={form.objectives}
                      onChange={(event) => onChange("objectives", event.target.value)}
                      placeholder="Loose leash, settle on mat, greet visitors…"
                      className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-secondary dark:text-slate-300" htmlFor="session-notes">
                      Notes (optional)
                    </label>
                    <textarea
                      id="session-notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={(event) => onChange("notes", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    Linked client: <span className="font-medium text-brand-secondary dark:text-slate-300">{linkedClientName}</span>
                  </p>

                  {error && <p className="text-sm text-rose-600">{error}</p>}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-neutral-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-600"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !hasDogs}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Saving…" : "Create session"}
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
