import { isDatabaseConfigured, prisma } from "../prisma";

export type PackageListItem = {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string | null;
  templateName: string;
  pricePaid: number; // Amount paid for this package
  priceRemaining: number; // Remaining balance in cents
  currency: string;
  sessionsRemaining: number; // Calculated based on price per session
  totalSessions: number; // Total sessions in the package
  expiresOn: string | null;
};

export type PackageTemplate = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  sessionCount: number;
  expiresInDays: number | null;
};

export type PaymentLogItem = {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  method: string;
  date: string;
  notes: string | null;
};

export type RevenueOverview = {
  currentMonth: number;
  averagePackagePrice: number;
  retentionRate: number;
  currency: string;
};

export async function listPackages(): Promise<PackageListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  // Get template client ID to exclude templates
  const templateClient = await prisma.client.findFirst({
    where: {
      name: "__TEMPLATES__",
    },
    select: { id: true },
  });

  // Only get packages linked to clients (not templates)
  const rows = await prisma.package.findMany({
    where: templateClient
      ? {
          clientId: {
            not: templateClient.id,
          },
        }
      : undefined,
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ expiresOn: "asc" }, { createdAt: "desc" }],
  });

  // Calculate remaining balance and sessions
  // For now, we'll use priceCents as the initial balance
  // and calculate sessions based on price per session from template
  return rows.map((pkg) => {
    // Calculate price per session (assume template price / sessionCount)
    // For now, use a default of price / totalCredits (repurposed as sessionCount)
    const pricePerSession = pkg.totalCredits > 0 ? pkg.priceCents / pkg.totalCredits : pkg.priceCents;
    const pricePaid = pkg.priceCents;
    const priceUsed = pkg.usedCredits * pricePerSession; // usedCredits repurposed as sessions used
    const priceRemaining = pricePaid - priceUsed; // Allow negative balances
    const sessionsRemaining = Math.floor(priceRemaining / pricePerSession);

    return {
      id: pkg.id,
      clientId: pkg.clientId!,
      clientName: pkg.client?.name ?? "Unknown Client",
      templateId: null, // TODO: Add templateId field
      templateName: pkg.type,
      pricePaid,
      priceRemaining,
      currency: pkg.currency,
      sessionsRemaining,
      totalSessions: pkg.totalCredits, // Add total sessions
      expiresOn: pkg.expiresOn?.toISOString() ?? null,
    };
  });
}

export async function listPackageTemplates(): Promise<PackageTemplate[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  // Get packages linked to the template client as templates
  // Find the special template client
  const templateClient = await prisma.client.findFirst({
    where: {
      name: "__TEMPLATES__",
    },
  });

  if (!templateClient) {
    return [];
  }

  const templates = await prisma.package.findMany({
    where: {
      clientId: templateClient.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.type,
    priceCents: t.priceCents,
    currency: t.currency,
    sessionCount: t.totalCredits, // Repurposing credits as session count
    expiresInDays: t.expiresOn
      ? Math.ceil((t.expiresOn.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export async function listPaymentLogs(): Promise<PaymentLogItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  // Get payments from Payment table
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { receivedOn: "desc" },
    take: 50, // Limit to recent payments
  });

  // Map enum values back to readable strings
  const methodDisplayMap: Record<string, string> = {
    "CASH": "Cash",
    "BANK_TRANSFER": "Bank Transfer",
    "CARD": "Card",
    "OTHER": "Other",
  };

  return payments.map((payment) => ({
    id: payment.id,
    clientId: payment.invoice?.clientId ?? "",
    clientName: payment.invoice?.client?.name ?? "Unknown Client",
    amount: payment.amountCents,
    currency: payment.invoice?.currency ?? "EUR",
    method: payment.method ? methodDisplayMap[payment.method] || payment.method : "Unknown",
    notes: payment.reference ?? null, // Use reference field for notes
    date: payment.receivedOn.toISOString(),
  }));
}

export async function getRevenueOverview(): Promise<RevenueOverview> {
  if (!isDatabaseConfigured()) {
    return {
      currentMonth: 0,
      averagePackagePrice: 0,
      retentionRate: 0,
      currency: "EUR",
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate current month revenue from payments
  const paymentsThisMonth = await prisma.payment.findMany({
    where: {
      receivedOn: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      invoice: {
        select: {
          currency: true,
        },
      },
    },
  });

  const currentMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amountCents, 0);
  const currency = paymentsThisMonth[0]?.invoice?.currency ?? "EUR";

  // Calculate average package price
  const packages = await prisma.package.findMany({
    select: {
      priceCents: true,
      currency: true,
    },
  });

  const averagePackagePrice =
    packages.length > 0
      ? packages.reduce((sum, p) => sum + p.priceCents, 0) / packages.length
      : 0;

  // Calculate retention rate (clients with multiple packages)
  const allPackages = await prisma.package.findMany({
    select: {
      clientId: true,
    },
  });

  const clientPackageCounts = new Map<string, number>();
  allPackages.forEach((pkg) => {
    clientPackageCounts.set(pkg.clientId, (clientPackageCounts.get(pkg.clientId) ?? 0) + 1);
  });

  const totalClients = clientPackageCounts.size;
  const repeatClients = Array.from(clientPackageCounts.values()).filter((count) => count > 1).length;
  const retentionRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;

  return {
    currentMonth,
    averagePackagePrice,
    retentionRate,
    currency,
  };
}
