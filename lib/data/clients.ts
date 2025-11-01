import {
  clientDocuments,
  clientNotes,
  clients,
  dogs,
  invoices,
  packages,
} from "../mock-data";
import type { Client, Dog, Invoice, Package } from "../types";

export type ClientListItem = Pick<
  Client,
  "id" | "name" | "phone" | "email" | "language"
> & {
  packages: number;
  balanceCredits: number;
};

export type ClientDetail = Client & {
  dogs: Array<Pick<Dog, "id" | "name" | "breed" | "tags" | "lastSessionDate">>;
  packages: Package[];
  invoices: Invoice[];
  documents: Array<{ id: string; name: string; uploadedAt: string }>;
  notes: Array<{ id: string; body: string; createdAt: string }>;
};

export function listClients(): ClientListItem[] {
  return clients
    .map<ClientListItem>((client) => {
      const clientPackages = packages.filter(
        (pkg) => pkg.clientId === client.id,
      );
      const balanceCredits = clientPackages.reduce(
        (sum, pkg) => sum + (pkg.totalCredits - pkg.usedCredits),
        0,
      );
      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        language: client.language,
        packages: clientPackages.length,
        balanceCredits,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getClientById(id: string): ClientDetail | null {
  const client = clients.find((item) => item.id === id);
  if (!client) return null;

  const clientDogs = dogs
    .filter((dog) => dog.clientId === id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((dog) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      tags: dog.tags,
      lastSessionDate: dog.lastSessionDate,
    }));

  const clientPackages = packages
    .filter((pkg) => pkg.clientId === id)
    .sort((a, b) => (a.expiresOn ?? "").localeCompare(b.expiresOn ?? ""));

  const clientInvoices = invoices
    .filter((invoice) => invoice.clientId === id)
    .sort((a, b) => (b.issuedOn ?? "").localeCompare(a.issuedOn ?? ""));

  const documents = clientDocuments
    .filter((doc) => doc.clientId === id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const notes = clientNotes
    .filter((note) => note.clientId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ...client,
    referral: client.referral ?? null,
    vatId: client.vatId ?? null,
    notes: client.notes ?? null,
    dogs: clientDogs,
    packages: clientPackages,
    invoices: clientInvoices,
    documents,
    notes,
  };
}
