import { isDatabaseConfigured, prisma } from "../prisma";

export type PackageTemplate = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  sessionCount: number; // How many sessions this package includes
  expiresInDays: number | null; // Days until expiration (null = no expiration)
};

// Store templates in a simple table or use Package model with a flag
// For now, we'll use a JSON approach stored in a settings table or use Package with clientId = null
export async function listPackageTemplates(): Promise<PackageTemplate[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  // Get packages with clientId = null as templates
  const templates = await prisma.package.findMany({
    where: {
      clientId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert to template format
  // Assume sessionCount is stored in totalCredits field (repurposing)
  return templates.map((t) => ({
    id: t.id,
    name: t.type,
    description: null,
    priceCents: t.priceCents,
    currency: t.currency,
    sessionCount: t.totalCredits, // Repurposing credits as session count
    expiresInDays: t.expiresOn
      ? Math.ceil((t.expiresOn.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export async function createPackageTemplate(data: {
  name: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  sessionCount: number;
  expiresInDays?: number | null;
}): Promise<PackageTemplate> {
  if (!isDatabaseConfigured()) {
    throw new Error("Database not configured");
  }

  const expiresOn = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const pkg = await prisma.package.create({
    data: {
      clientId: null, // null = template
      type: data.name,
      totalCredits: data.sessionCount, // Repurposing as session count
      usedCredits: 0,
      priceCents: data.priceCents,
      currency: data.currency,
      expiresOn,
    },
  });

  return {
    id: pkg.id,
    name: pkg.type,
    description: null,
    priceCents: pkg.priceCents,
    currency: pkg.currency,
    sessionCount: pkg.totalCredits,
    expiresInDays: data.expiresInDays,
  };
}

export async function getPackageTemplateById(id: string): Promise<PackageTemplate | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const template = await prisma.package.findUnique({
    where: { id },
  });

  if (!template || template.clientId !== null) {
    return null;
  }

  return {
    id: template.id,
    name: template.type,
    description: null,
    priceCents: template.priceCents,
    currency: template.currency,
    sessionCount: template.totalCredits,
    expiresInDays: template.expiresOn
      ? Math.ceil((template.expiresOn.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

