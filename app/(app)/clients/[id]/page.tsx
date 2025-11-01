import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getClientById } from "@/lib/data/clients";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type ClientDetailPageProps = {
  params: { id: string };
};

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const client = getClientById(params.id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <TopBar
        title={client.name}
        actions={[
          { label: "New Package" },
          { label: "Add Note" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card title="Contact">
          <dl className="space-y-3 text-sm text-neutral-600">
            <div>
              <dt className="text-xs uppercase text-neutral-500">Phone</dt>
              <dd>{client.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Email</dt>
              <dd>{client.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Address</dt>
              <dd>{client.address}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">Language</dt>
              <dd>
                <Badge variant="muted">{client.language}</Badge>
              </dd>
            </div>
            {client.vatId && (
              <div>
                <dt className="text-xs uppercase text-neutral-500">VAT</dt>
                <dd>{client.vatId}</dd>
              </div>
            )}
            {client.referral && (
              <div>
                <dt className="text-xs uppercase text-neutral-500">Referral</dt>
                <dd>{client.referral}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card title="Dogs">
            {client.dogs.length === 0 ? (
              <p className="text-sm text-neutral-500">No dogs assigned yet.</p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {client.dogs.map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-brand-secondary">
                        {dog.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {dog.breed} ·{" "}
                        {dog.lastSessionDate
                          ? format(parseISO(dog.lastSessionDate), "MMM d, yyyy")
                          : "No sessions yet"}
                      </p>
                    </div>
                    <Link
                      href={`/dogs/${dog.id}`}
                      className="text-xs font-medium text-brand-secondary"
                    >
                      View →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Packages">
            {client.packages.length === 0 ? (
              <p className="text-sm text-neutral-500">No packages.</p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {client.packages.map((pkg) => (
                  <li
                    key={pkg.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-brand-secondary">
                        {pkg.type}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Credits left: {pkg.totalCredits - pkg.usedCredits} /{" "}
                        {pkg.totalCredits}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Expires{" "}
                      {pkg.expiresOn
                        ? format(parseISO(pkg.expiresOn), "MMM d, yyyy")
                        : "No expiry"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Invoices">
            {client.invoices.length === 0 ? (
              <p className="text-sm text-neutral-500">No invoices yet.</p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {client.invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-brand-secondary">
                        #{invoice.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {invoice.status} ·{" "}
                        {invoice.issuedOn
                          ? format(parseISO(invoice.issuedOn), "MMM d, yyyy")
                          : "Draft"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-secondary">
                      {(invoice.total / 100).toFixed(2)} {invoice.currency}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Documents">
            {client.documents.length === 0 ? (
              <p className="text-sm text-neutral-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2 text-sm text-neutral-600">
                {client.documents.map((doc) => (
                  <li key={doc.id} className="flex justify-between">
                    <span>{doc.name}</span>
                    <span className="text-xs text-neutral-500">
                      {format(parseISO(doc.uploadedAt), "MMM d, yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Communication Log">
            {client.notes.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Notes will appear here.
              </p>
            ) : (
              <ul className="space-y-3 text-sm text-neutral-600">
                {client.notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs uppercase text-neutral-500">
                      {format(parseISO(note.createdAt), "MMM d, HH:mm")}
                    </p>
                    <p>{note.body}</p>
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
