import { Prisma } from "@prisma/client";

import { isDatabaseConfigured, prisma } from "../prisma";

export type ClientListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  language: string;
  source: string;
};

export type ClientDetailDog = {
  id: string;
  name: string;
  breed: string | null;
  tags: string[];
  lastSessionDate: string | null;
};

export type ClientDetailPackage = {
  id: string;
  type: string;
  totalCredits: number;
  usedCredits: number;
  priceCents: number;
  currency: string;
  expiresOn: string | null;
};

export type ClientDetailInvoice = {
  id: string;
  status: string;
  total: number;
  currency: string;
  issuedOn: string | null;
  paidOn: string | null;
};

export type ClientDetailDocument = {
  id: string;
  name: string;
  uploadedAt: string;
};

export type ClientDetailNote = {
  id: string;
  body: string;
  createdAt: string;
  dogId: string | null;
  dogName: string | null;
  type?: "note" | "email";
};

export type ClientDetail = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  referral: string | null;
  vatId: string | null;
  notesText: string | null;
  dogs: ClientDetailDog[];
  packages: ClientDetailPackage[];
  invoices: ClientDetailInvoice[];
  documents: ClientDetailDocument[];
  notes: ClientDetailNote[];
  balance: number; // Balance in cents (payments - package costs)
  balanceCurrency: string; // Currency for the balance
};

export type ClientQuickPick = {
  id: string;
  name: string;
};

const FALLBACK_TEXT = "—";

type FallbackClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  language: string | null;
  referral: string | null;
  vatId: string | null;
  notes: string | null;
  dogs: ClientDetailDog[];
  packages: ClientDetailPackage[];
  invoices: ClientDetailInvoice[];
  documents: ClientDetailDocument[];
  notesLog: ClientDetailNote[];
};

const FALLBACK_CLIENTS: FallbackClient[] = [
  {
    id: "client-demo-1",
    name: "Oya Household",
    phone: "+1 (555) 012-3456",
    email: "oya.family@example.com",
    address: "123 Training Lane, Austin, TX",
    language: "en",
    referral: "Website",
    vatId: null,
    notes: "Prefers weekday evening sessions.",
    dogs: [
      {
        id: "dog-demo-oya",
        name: "Oya",
        breed: "Mixed Breed",
        tags: ["reactive", "puppy"],
        lastSessionDate: null,
      },
    ],
    packages: [],
    invoices: [],
    documents: [],
    notesLog: [
      {
        id: "note-demo-1",
        body: "Initial consult completed. Focus on leash manners.",
        createdAt: new Date().toISOString(),
        dogId: "dog-demo-oya",
        dogName: "Oya",
      },
    ],
  },
  {
    id: "client-demo-2",
    name: "River & Brooke",
    phone: null,
    email: "river.br@example.com",
    address: null,
    language: "en",
    referral: null,
    vatId: null,
    notes: null,
    dogs: [],
    packages: [],
    invoices: [],
    documents: [],
    notesLog: [],
  },
];

const CLIENT_DETAIL_INCLUDE_WITH_NOTE_DOG = Prisma.validator<Prisma.ClientInclude>()({
  dogs: {
    include: {
      sessions: {
        select: { startTime: true },
        orderBy: { startTime: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  },
  packages: {
    orderBy: { expiresOn: "asc" },
  },
  invoices: {
    orderBy: { issuedOn: "desc" },
  },
  documents: {
    orderBy: { uploadedAt: "desc" },
  },
  clientNotes: {
    orderBy: { createdAt: "desc" },
  },
});

const CLIENT_DETAIL_INCLUDE_WITHOUT_NOTE_DOG = Prisma.validator<Prisma.ClientInclude>()({
  dogs: {
    include: {
      sessions: {
        select: { startTime: true },
        orderBy: { startTime: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  },
  packages: {
    orderBy: { expiresOn: "asc" },
  },
  invoices: {
    orderBy: { issuedOn: "desc" },
  },
  documents: {
    orderBy: { uploadedAt: "desc" },
  },
  clientNotes: {
    orderBy: { createdAt: "desc" },
  },
});

type ClientWithNoteDog = Prisma.ClientGetPayload<{ include: typeof CLIENT_DETAIL_INCLUDE_WITH_NOTE_DOG }>;
type ClientWithoutNoteDog = Prisma.ClientGetPayload<{ include: typeof CLIENT_DETAIL_INCLUDE_WITHOUT_NOTE_DOG }>;
type LoadedClient = ClientWithNoteDog | ClientWithoutNoteDog;
type ClientNoteWithDog = ClientWithNoteDog["clientNotes"][number];
type ClientNoteWithoutDog = ClientWithoutNoteDog["clientNotes"][number];

function noteHasDog(note: ClientNoteWithDog | ClientNoteWithoutDog): note is ClientNoteWithDog {
  return Object.prototype.hasOwnProperty.call(note, "dog");
}

let clientNoteDogIncludeAvailable: boolean | null = null;
let hasWarnedMissingClientNoteDog = false;

async function loadClientRecord(
  id: string,
): Promise<{
  client: LoadedClient | null;
  notesIncludeDog: boolean;
}> {
  if (clientNoteDogIncludeAvailable === false) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: CLIENT_DETAIL_INCLUDE_WITHOUT_NOTE_DOG,
    });

    return { client, notesIncludeDog: false };
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: CLIENT_DETAIL_INCLUDE_WITH_NOTE_DOG,
    });

    clientNoteDogIncludeAvailable = true;
    return { client, notesIncludeDog: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientValidationError &&
      error.message.includes("Unknown field `dog` for include statement on model `ClientNote`")
    ) {
      clientNoteDogIncludeAvailable = false;

      if (!hasWarnedMissingClientNoteDog) {
        hasWarnedMissingClientNoteDog = true;
        console.warn(
          "loadClientRecord: Falling back to legacy client note shape without dog relation. Apply latest Prisma migrations to restore dog info on notes.",
        );
      }

      const client = await prisma.client.findUnique({
        where: { id },
        include: CLIENT_DETAIL_INCLUDE_WITHOUT_NOTE_DOG,
      });

      return { client, notesIncludeDog: false };
    }

    throw error;
  }
}

function ensureText(value: string | null | undefined, fallback = FALLBACK_TEXT) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? fallback : trimmed;
}

function formatLanguage(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? FALLBACK_TEXT : trimmed.toUpperCase();
}

export async function listClients(): Promise<ClientListItem[]> {
  if (!isDatabaseConfigured()) {
    return FALLBACK_CLIENTS.map((client) => ({
      id: client.id,
      name: client.name,
      phone: ensureText(client.phone),
      email: ensureText(client.email),
      language: formatLanguage(client.language),
      source: "manual",
    }));
  }

  try {
    const rows = await prisma.client.findMany({
      orderBy: { name: "asc" },
    });

    return rows.map((client) => ({
      id: client.id,
      name: client.name,
      phone: ensureText(client.phone),
      email: ensureText(client.email),
      language: formatLanguage(client.language),
      source: client.source ?? "manual",
    }));
  } catch (error) {
    console.error("listClients failed", error);
    return FALLBACK_CLIENTS.map((client) => ({
      id: client.id,
      name: client.name,
      phone: ensureText(client.phone),
      email: ensureText(client.email),
      language: formatLanguage(client.language),
      source: "manual",
    }));
  }
}

export async function getClientById(id: string): Promise<ClientDetail | null> {
  if (!isDatabaseConfigured()) {
    const fallback = FALLBACK_CLIENTS.find((client) => client.id === id);
    return fallback ? buildClientDetail(fallback) : null;
  }

  try {
    const { client, notesIncludeDog } = await loadClientRecord(id);

    if (!client) {
      return null;
    }

    const dogs: ClientDetailDog[] = client.dogs.map((dog) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      tags: dog.tags,
      lastSessionDate: dog.sessions[0]?.startTime?.toISOString() ?? null,
    }));

    const packages: ClientDetailPackage[] = client.packages.map((pkg) => ({
      id: pkg.id,
      type: pkg.type,
      totalCredits: pkg.totalCredits,
      usedCredits: pkg.usedCredits,
      priceCents: pkg.priceCents,
      currency: pkg.currency,
      expiresOn: pkg.expiresOn?.toISOString() ?? null,
    }));

    // Get all payments for this client to calculate balance
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          clientId: id,
        },
      },
      select: {
        amountCents: true,
        currency: true,
      },
    });

    // Calculate balance: sum of payments minus actual cost of sessions used
    // When packages go negative, we need to calculate the actual cost based on sessions used
    const totalPayments = payments.reduce((sum, p) => sum + p.amountCents, 0);
    
    // Calculate actual cost per package based on sessions used
    // If usedCredits > totalCredits, client owes more than the package price
    const actualPackageCosts = packages.reduce((sum, pkg) => {
      const pricePerSession = pkg.totalCredits > 0 ? pkg.priceCents / pkg.totalCredits : pkg.priceCents;
      const actualCost = pkg.usedCredits * pricePerSession;
      return sum + actualCost;
    }, 0);
    
    const balance = totalPayments - actualPackageCosts;
    
    // Use the most common currency from payments/packages, or default to EUR
    const allCurrencies = [
      ...payments.map((p) => p.currency),
      ...packages.map((p) => p.currency),
    ];
    const currencyCounts = allCurrencies.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const balanceCurrency =
      Object.keys(currencyCounts).length > 0
        ? Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "EUR";

    // Filter invoices: only show invoices that are linked to packages (package purchases)
    // Exclude auto-generated payment invoices (invoices that don't have a corresponding package)
    // We can identify package invoices by checking if invoice total matches a package price
    const packageInvoiceIds = new Set(
      packages.map((pkg) => {
        // Find invoice with matching total and currency
        const matchingInvoice = client.invoices.find(
          (inv) => inv.totalCents === pkg.priceCents && inv.currency === pkg.currency,
        );
        return matchingInvoice?.id;
      }).filter((id): id is string => id !== undefined),
    );

    const invoices: ClientDetailInvoice[] = client.invoices
      .filter((invoice) => packageInvoiceIds.has(invoice.id))
      .map((invoice) => ({
        id: invoice.id,
        status: invoice.status.toLowerCase(),
        total: invoice.totalCents,
        currency: invoice.currency,
        issuedOn: invoice.issuedOn?.toISOString() ?? null,
        paidOn: invoice.paidOn?.toISOString() ?? null,
      }));

    const documents: ClientDetailDocument[] = client.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      uploadedAt: doc.uploadedAt.toISOString(),
    }));

    const notes: ClientDetailNote[] = client.clientNotes.map((note) => {
      const typedNote = note as ClientNoteWithDog | ClientNoteWithoutDog;
      const dogInfo = notesIncludeDog && noteHasDog(typedNote) ? typedNote.dog : null;
      const isEmail = typedNote.body.startsWith("Email sent:") || typedNote.body.startsWith("Email received:");

      return {
        id: typedNote.id,
        body: typedNote.body,
        createdAt: typedNote.createdAt.toISOString(),
        dogId: dogInfo?.id ?? null,
        dogName: dogInfo?.name ?? null,
        type: isEmail ? "email" : "note",
      };
    });

    return {
      id: client.id,
      name: client.name,
      phone: ensureText(client.phone),
      email: ensureText(client.email),
      address: ensureText(client.address),
      language: formatLanguage(client.language),
      referral: client.referral,
      vatId: client.vatId,
      notesText: client.notes,
      dogs,
      packages,
      invoices,
      documents,
      notes,
      balance,
      balanceCurrency,
    };
  } catch (error) {
    console.error(`getClientById failed for id=${id}`, error);
    const fallback = FALLBACK_CLIENTS.find((client) => client.id === id);
    return fallback ? buildClientDetail(fallback) : null;
  }
}

export async function listClientsForQuickCreate(): Promise<ClientQuickPick[]> {
  if (!isDatabaseConfigured()) {
    return FALLBACK_CLIENTS.map((client) => ({ id: client.id, name: client.name }));
  }

  try {
    const rows = await prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return rows.map((client) => ({ id: client.id, name: client.name }));
  } catch (error) {
    console.error("listClientsForQuickCreate failed", error);
    return FALLBACK_CLIENTS.map((client) => ({ id: client.id, name: client.name }));
  }
}

function buildClientDetail(client: FallbackClient): ClientDetail {
  // Calculate balance for fallback clients (0 for demo data)
  const balance = 0;
  const balanceCurrency = "EUR";
  
  return {
    id: client.id,
    name: client.name,
    phone: ensureText(client.phone),
    email: ensureText(client.email),
    address: ensureText(client.address),
    language: formatLanguage(client.language),
    referral: client.referral,
    vatId: client.vatId,
    notesText: client.notes,
    dogs: client.dogs,
    packages: client.packages,
    invoices: client.invoices,
    documents: client.documents,
    notes: client.notesLog,
    balance,
    balanceCurrency,
  };
}
