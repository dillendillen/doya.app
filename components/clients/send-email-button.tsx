/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@/components/ui/icons";
import { getEmailTemplate } from "@/lib/email-templates";

type SendEmailButtonProps = {
  clientId: string;
  clientEmail: string;
  clientName: string;
};

export function SendEmailButton({ clientId, clientEmail, clientName }: SendEmailButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>("");

  const templates = [
    {
      name: "Session Reminder",
      subject: "Reminder: Upcoming Training Session",
      body: `Hi ${clientName},\n\nThis is a reminder about your upcoming training session.\n\nBest regards,\nDOYA Training`,
    },
    {
      name: "Session Follow-up",
      subject: "Follow-up: Training Session",
      body: `Hi ${clientName},\n\nThank you for today's session. Here's a brief summary:\n\n[Add your session notes here]\n\nBest regards,\nDOYA Training`,
    },
    {
      name: "General Inquiry",
      subject: "Inquiry from DOYA Training",
      body: `Hi ${clientName},\n\n[Your message here]\n\nBest regards,\nDOYA Training`,
    },
  ];

  const handleTemplateChange = (templateName: string) => {
    const selected = templates.find((t) => t.name === templateName);
    if (selected) {
      const templateData = getEmailTemplate(templateName === "Session Reminder" ? "session-reminder" : templateName === "Session Follow-up" ? "session-followup" : "general", {
        clientName,
        dogName: "",
        subject: selected.subject,
        message: selected.body,
      });
      setSubject(templateData.subject);
      setBody(templateData.text);
      setTemplate(templateName);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }

    if (!clientEmail || clientEmail === "—") {
      setError("Client email is not available.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const templateKey = template === "Session Reminder" ? "session-reminder" : template === "Session Follow-up" ? "session-followup" : "general";
      const templateData = getEmailTemplate(templateKey, {
        clientName,
        dogName: "",
        subject: subject.trim(),
        message: body.trim(),
        sessionDate: "",
        location: "",
        sessionNotes: "",
      });

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: clientEmail,
          subject: templateData.subject,
          text: templateData.text,
          html: templateData.html,
          clientId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Failed to send email." }));
        throw new Error(payload.error ?? "Failed to send email.");
      }

      setIsSubmitting(false);
      setIsOpen(false);
      setSubject("");
      setBody("");
      setTemplate("");
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to send email.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-brand-primary hover:text-brand-primary"
      >
        <PlusIcon className="h-4 w-4 text-brand-primary" />
        Send Email
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
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-brand-secondary">
                    Send Email to {clientName}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-neutral-500">
                    {clientEmail}
                  </Dialog.Description>

                  <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Email Template
                      </label>
                      <select
                        value={template}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      >
                        <option value="">Select a template (optional)</option>
                        {templates.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="email-subject"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Subject
                      </label>
                      <input
                        id="email-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        placeholder="Email subject"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="email-body"
                        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
                      >
                        Message
                      </label>
                      <textarea
                        id="email-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        placeholder="Email message..."
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setSubject("");
                          setBody("");
                          setTemplate("");
                        }}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !subject.trim() || !body.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Sending…" : "Send Email"}
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

