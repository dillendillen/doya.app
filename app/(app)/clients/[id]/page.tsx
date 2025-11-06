import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getClientById } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EditClientButton } from "@/components/clients/edit-client-button";
import { AddClientNoteButton } from "@/components/clients/add-client-note-button";
import { EditClientNoteButton } from "@/components/clients/edit-client-note-button";
import { DeleteClientNoteButton } from "@/components/clients/delete-client-note-button";
import { EditPackageButton } from "@/components/clients/edit-package-button";
import { DeletePackageButton } from "@/components/clients/delete-package-button";
import { NewPackageButton } from "@/components/billing/new-package-button";
import { SendEmailButton } from "@/components/clients/send-email-button";

type ClientDetailPageProps = {
  params: { id: string };
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const editClient = {
    id: client.id,
    name: client.name,
    phone: client.phone === "—" ? "" : client.phone,
    email: client.email === "—" ? "" : client.email,
    address: client.address === "—" ? "" : client.address,
    language: client.language === "—" ? "" : client.language,
    referral: client.referral ?? "",
    vatId: client.vatId ?? "",
    notes: client.notesText ?? "",
  };

  return (
    <div className="space-y-6">
      <TopBar
        title={client.name}
        actions={[
          { key: "edit-client", node: <EditClientButton client={editClient} /> },
          { key: "add-note", node: <AddClientNoteButton clientId={client.id} /> },
          { 
            key: "send-email", 
            node: <SendEmailButton 
              clientId={client.id} 
              clientEmail={client.email === "—" ? "" : client.email}
              clientName={client.name}
            /> 
          },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className="space-y-6">
          <Card title="Contact" className="border-brand-secondary/20 bg-gradient-to-br from-brand-secondary/5 via-white to-blue-50/30">
          <dl className="space-y-4 text-sm">
            <div className="rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1.5">Phone</dt>
              <dd className="text-neutral-700 font-semibold">{client.phone}</dd>
            </div>
            <div className="rounded-lg border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1.5">Email</dt>
              <dd className="text-neutral-700 font-semibold break-all">{client.email}</dd>
            </div>
            <div className="rounded-lg border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-1.5">Address</dt>
              <dd className="text-neutral-700 font-semibold">{client.address}</dd>
            </div>
            <div className="rounded-lg border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1.5">Language</dt>
              <dd>
                <Badge variant="muted" className="bg-amber-100 text-amber-700 border-amber-200 font-semibold">{client.language}</Badge>
              </dd>
            </div>
            {client.vatId && (
              <div className="rounded-lg border border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-1.5">VAT</dt>
                <dd className="text-neutral-700 font-semibold">{client.vatId}</dd>
              </div>
            )}
            {client.referral && (
              <div className="rounded-lg border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-rose-700 mb-1.5">Referral</dt>
                <dd className="text-neutral-700 font-semibold">{client.referral}</dd>
              </div>
            )}
            {client.notesText && (
              <div className="rounded-lg border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-1.5">Notes</dt>
                <dd className="text-neutral-700 leading-relaxed">{client.notesText}</dd>
              </div>
            )}
          </dl>
        </Card>

          <Card title="Account Balance" className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/30 via-white to-white">
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${client.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(client.balance / 100).toFixed(2)} {client.balanceCurrency}
              </div>
              <p className="text-xs text-neutral-500">
                {client.balance >= 0 
                  ? "Client has credit" 
                  : `Client owes ${Math.abs(client.balance / 100).toFixed(2)} ${client.balanceCurrency}`}
              </p>
              <div className="text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-200">
                <p>Total payments: {(client.balance + client.packages.reduce((sum, p) => sum + p.priceCents, 0)) / 100} {client.balanceCurrency}</p>
                <p>Total packages: {client.packages.reduce((sum, p) => sum + p.priceCents, 0) / 100} {client.balanceCurrency}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Dogs" className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/30 via-white to-white">
            {client.dogs.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center">
                <p className="text-sm font-medium text-emerald-700">No dogs assigned yet.</p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {client.dogs.map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between rounded-xl border-2 border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 via-white to-white p-4 transition-all hover:border-emerald-300 hover:shadow-md"
                  >
                    <div>
                      <p className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {dog.name}
                      </p>
                      <p className="text-xs font-semibold text-neutral-600 mt-1">
                        {dog.breed} ·{" "}
                        {dog.lastSessionDate
                          ? format(parseISO(dog.lastSessionDate), "MMM d, yyyy")
                          : "No sessions yet"}
                      </p>
                    </div>
                    <Link
                      href={`/dogs/${dog.id}`}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card 
            title="Packages" 
            className="border-amber-200/60 bg-gradient-to-br from-amber-50/30 via-white to-white"
            actions={[{
              key: "add-package",
              node: <NewPackageButton clients={[{ id: client.id, name: client.name }]} />
            }]}
          >
            {client.packages.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-6 text-center">
                <p className="text-sm font-medium text-amber-700">No packages.</p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {client.packages.map((pkg) => {
                  const creditsLeft = pkg.totalCredits - pkg.usedCredits;
                  const isLow = creditsLeft <= 1;
                  const isFinished = creditsLeft <= 0;
                  return (
                    <li
                      key={pkg.id}
                      className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                        isFinished
                          ? "border-gray-200/60 bg-gradient-to-r from-gray-50/50 via-white to-white"
                          : isLow
                            ? "border-rose-200/60 bg-gradient-to-r from-rose-50/50 via-white to-white"
                            : "border-amber-200/60 bg-gradient-to-r from-amber-50/50 via-white to-white"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-base bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {pkg.type}
                        </p>
                        <p className="text-xs font-semibold text-neutral-600 mt-1">
                          <span className={isFinished ? "text-gray-500" : isLow ? "text-rose-600 font-bold" : "text-neutral-600"}>
                            Sessions remaining: {creditsLeft} / {pkg.totalCredits}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <EditPackageButton pkg={pkg} clientId={client.id} />
                        <DeletePackageButton packageId={pkg.id} packageType={pkg.type} />
                        <p className="text-xs font-semibold text-neutral-600">
                          {pkg.expiresOn
                            ? `Expires ${format(parseISO(pkg.expiresOn), "MMM d, yyyy")}`
                            : "No expiry"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Invoices" className="border-teal-200/60 bg-gradient-to-br from-teal-50/30 via-white to-white">
            {client.invoices.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30 p-6 text-center">
                <p className="text-sm font-medium text-teal-700">No invoices yet.</p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {client.invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border-2 border-teal-200/60 bg-gradient-to-r from-teal-50/50 via-white to-white p-4 transition-all hover:border-teal-300 hover:shadow-md"
                  >
                    <div>
                      <p className="font-bold text-base text-teal-700">
                        #{invoice.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-xs font-semibold text-neutral-600 mt-1">
                        {invoice.status} ·{" "}
                        {invoice.issuedOn
                          ? format(parseISO(invoice.issuedOn), "MMM d, yyyy")
                          : "Draft"}
                      </p>
                    </div>
                    <p className="text-base font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      {(invoice.total / 100).toFixed(2)} {invoice.currency}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Documents" className="border-violet-200/60 bg-gradient-to-br from-violet-50/30 via-white to-white">
            {client.documents.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
                <p className="text-sm font-medium text-violet-700">No documents uploaded.</p>
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {client.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between rounded-lg border border-violet-200/60 bg-gradient-to-r from-violet-50/30 to-white px-3 py-2.5 transition-all hover:border-violet-300 hover:shadow-sm">
                    <span className="font-semibold text-violet-700">{doc.name}</span>
                    <span className="text-xs font-medium text-neutral-600">
                      {format(parseISO(doc.uploadedAt), "MMM d, yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Notes" className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/30 via-white to-white">
            {client.notes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-6 text-center">
                <p className="text-sm font-medium text-indigo-700">
                  No notes added yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {client.notes.map((note) => (
                  <li key={note.id} className="group rounded-xl border-2 border-indigo-200/60 bg-gradient-to-r from-indigo-50/50 via-white to-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:scale-[1.01]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">
                          {format(parseISO(note.createdAt), "MMM d, HH:mm")}
                        </p>
                        <p className="text-neutral-700 leading-relaxed">{note.body}</p>
                        {note.dogId && (
                          <p className="mt-3 text-xs font-semibold text-indigo-600">
                            Linked to{" "}
                            <Link
                              href={`/dogs/${note.dogId}`}
                              className="font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
                            >
                              {note.dogName ?? "view dog"}
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <EditClientNoteButton noteId={note.id} initialBody={note.body} />
                        <DeleteClientNoteButton noteId={note.id} noteType={note.type} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Communication Log" className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/30 via-white to-white">
            {client.notes.filter((note) => note.type === "email").length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-cyan-200 bg-cyan-50/30 p-6 text-center">
                <p className="text-sm font-medium text-cyan-700">
                  Email communications will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {client.notes
                  .filter((note) => note.type === "email")
                  .map((note) => (
                    <li key={note.id} className="group rounded-xl border-2 border-cyan-200/60 bg-gradient-to-r from-cyan-50/50 via-blue-50/30 to-white p-4 transition-all hover:border-cyan-300 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase text-cyan-700 bg-gradient-to-r from-cyan-100 to-blue-100 border border-cyan-200 px-3 py-1 rounded-full">
                              ✉ Email
                            </span>
                            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                              {format(parseISO(note.createdAt), "MMM d, HH:mm")}
                            </p>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-neutral-700 leading-relaxed">{note.body}</p>
                        </div>
                        <DeleteClientNoteButton noteId={note.id} noteType="email" />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
