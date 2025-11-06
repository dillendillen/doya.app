import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { listPackages } from "@/lib/data/billing";

const createPackageSchema = z.object({
  clientId: z.string().nullable().optional(), // null = template, string = client package
  type: z.string().min(1, "Package type is required"),
  totalCredits: z.number().int().positive("Session count must be a positive number"), // Repurposed as session count
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("EUR"),
  expiresInDays: z.number().int().positive().nullable().optional(),
  expiresOn: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? new Date(val) : undefined)),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const payload = createPackageSchema.parse(body);

    // Convert price to cents
    const priceCents = Math.round(payload.price * 100);

    // If clientId is provided, verify client exists
    if (payload.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: payload.clientId },
        select: { id: true },
      });

      if (!client) {
        return NextResponse.json({ error: "Client not found." }, { status: 404 });
      }
    }

    // Calculate expiration date
    let expiresOn: Date | undefined = payload.expiresOn;
    if (!expiresOn && payload.expiresInDays) {
      expiresOn = new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000);
    }
    // If expiresOn is provided but invalid, set to undefined
    if (expiresOn && Number.isNaN(expiresOn.getTime())) {
      expiresOn = undefined;
    }

    // For templates (clientId is null), we need to create or find a template client
    // Since Prisma requires clientId, we'll use a special approach
    let finalClientId = payload.clientId;
    
    if (!finalClientId) {
      // Find or create a special "Templates" client for package templates
      let templateClient = await prisma.client.findFirst({
        where: {
          name: "__TEMPLATES__", // Special marker name
        },
      });

      if (!templateClient) {
        templateClient = await prisma.client.create({
          data: {
            name: "__TEMPLATES__",
            email: "templates@doya.dog",
          },
        });
      }

      finalClientId = templateClient.id;
    }

    const isTemplate = !payload.clientId;

    // Create package and invoice (if not a template) in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the package
      const pkg = await tx.package.create({
        data: {
          clientId: finalClientId,
          type: payload.type,
          totalCredits: payload.totalCredits, // Repurposed as session count
          usedCredits: 0,
          priceCents,
          currency: payload.currency,
          expiresOn,
        },
      });

      // Create invoice for client packages (not templates)
      // Link invoice to package and allow negative balances (no balance check)
      if (!isTemplate && payload.clientId) {
        await tx.invoice.create({
          data: {
            clientId: payload.clientId,
            packageId: pkg.id, // Link invoice to the package
            currency: payload.currency,
            totalCents: priceCents,
            status: "UNPAID", // Invoice starts as UNPAID until payment is recorded
            issuedOn: new Date(),
            paidOn: null,
          },
        });
      }

      return pkg;
    });

    const pkg = result;

    // Log audit entry
    await createAuditLog({
      action: isTemplate ? "PACKAGE_TEMPLATE_CREATED" : "PACKAGE_CREATED",
      entityType: "package",
      entityId: pkg.id,
      summary: `Created ${isTemplate ? "template" : "package"}: ${payload.type} (${payload.totalCredits} sessions, ${payload.currency} ${payload.price})`,
    });

    return NextResponse.json(
      {
        success: true,
        package: {
          id: pkg.id,
          type: pkg.type,
          totalCredits: pkg.totalCredits,
          usedCredits: pkg.usedCredits,
          price: priceCents,
          currency: pkg.currency,
          isTemplate: isTemplate,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error("POST /api/packages failed", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create package.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const packages = await listPackages();

    // Filter by clientId if provided
    const filteredPackages = clientId
      ? packages.filter((pkg) => pkg.clientId === clientId)
      : packages;

    return NextResponse.json({
      packages: filteredPackages,
    });
  } catch (error) {
    console.error("GET /api/packages failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch packages.",
      },
      { status: 500 },
    );
  }
}


