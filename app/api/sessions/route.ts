import { NextResponse } from "next/server";
import { SessionStatus } from "@prisma/client";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const createSessionSchema = z.object({
  dogId: z.string().min(1, "Dog is required"),
  title: z
    .string()
    .trim()
    .optional(),
  trainerId: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  clientId: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  startTime: z.string().min(1, "Start time is required"),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute"),
  location: z.string().min(1, "Location is required"),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "DONE"])
    .optional()
    .default("SCHEDULED"),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  objectives: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),
  packageId: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid start time");
  }
  return date;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Database is not configured. Set DATABASE_URL to enable this action.",
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const payload = createSessionSchema.parse(body);

    const dog = await prisma.dog.findUnique({
      where: { id: payload.dogId },
      select: { id: true, clientId: true },
    });

    if (!dog) {
      return NextResponse.json({ error: "Dog not found." }, { status: 404 });
    }

    let trainerId = payload.trainerId ?? null;

    if (trainerId) {
      const trainer = await prisma.user.findUnique({
        where: { id: trainerId },
        select: { id: true },
      });

      if (!trainer) {
        return NextResponse.json({ error: "Trainer not found." }, { status: 404 });
      }
    } else {
      const fallbackTrainer = await prisma.user.findFirst({
        where: {
          role: {
            in: ["TRAINER", "OWNER"],
          },
        },
        select: { id: true },
        orderBy: { name: "asc" },
      });

      if (!fallbackTrainer) {
        const soloTrainer = await prisma.user.upsert({
          where: { email: "solo-trainer@doya.local" },
          update: {},
          create: {
            name: "Solo Trainer",
            email: "solo-trainer@doya.local",
            role: "OWNER",
          },
        });

        trainerId = soloTrainer.id;
      } else {
        trainerId = fallbackTrainer.id;
      }
    }

    const startTime = parseDate(payload.startTime);
    const endTime = new Date(startTime.getTime() + payload.durationMinutes * 60 * 1000);

    if (!trainerId) {
      throw new Error("Unable to assign trainer to session.");
    }

    const finalClientId = payload.clientId ?? dog.clientId;

    // Validate package if provided, and handle template packages
    let finalPackageId = payload.packageId ?? null;
    let packageType = null;
    
    // Find template client to check if package is a template
    const templateClient = await prisma.client.findFirst({
      where: { name: "__TEMPLATES__" },
      select: { id: true },
    });

    if (finalPackageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: finalPackageId },
        select: { 
          id: true, 
          clientId: true, 
          usedCredits: true, 
          totalCredits: true,
          priceCents: true,
          currency: true,
          type: true,
          expiresOn: true,
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Package not found." }, { status: 404 });
      }

      // If this is a template package (belongs to template client), create a client package from it
      if (templateClient && pkg.clientId === templateClient.id) {
        // Create a client package from the template
        const clientPackage = await prisma.package.create({
          data: {
            clientId: finalClientId,
            type: pkg.type,
            totalCredits: pkg.totalCredits,
            usedCredits: 0,
            priceCents: pkg.priceCents,
            currency: pkg.currency,
            expiresOn: pkg.expiresOn,
          },
        });
        
        finalPackageId = clientPackage.id;
        packageType = pkg.type;
      } else {
        // It's a client package - verify it belongs to the client
        if (pkg.clientId !== finalClientId) {
          return NextResponse.json({ error: "Package does not belong to this client." }, { status: 400 });
        }

        // Check if package has remaining sessions (allow negative for now - will be handled in billing todo)
        // Removed the check: if (pkg.usedCredits >= pkg.totalCredits)

        packageType = pkg.type;
      }
    }

    // Create session and reserve package slot in a transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.session.create({
        data: {
          dogId: payload.dogId,
          trainerId,
          clientId: finalClientId,
          packageId: finalPackageId,
          startTime,
          durationMinutes: payload.durationMinutes,
          location: payload.location,
          status: payload.status as SessionStatus,
          objectives: payload.objectives ?? [],
          // Save title in notes field with format: "Title\n\nnotes body"
          // Always ensure there's a blank line after title even if notes are empty
          notes: payload.title && payload.title.trim().length > 0
            ? payload.notes && payload.notes.trim().length > 0
              ? `${payload.title.trim()}\n\n${payload.notes.trim()}`
              : `${payload.title.trim()}\n\n`
            : payload.notes ?? null,
          travelMinutes: 0,
          bufferMinutes: 0,
        },
        select: {
          id: true,
          dogId: true,
          trainerId: true,
        },
      });

      // Reserve package slot immediately when session is created
      if (finalPackageId) {
        await tx.package.update({
          where: { id: finalPackageId },
          data: {
            usedCredits: {
              increment: 1,
            },
          },
        });

        // Log audit entry
        await createAuditLog({
          action: "SESSION_CREATED_PACKAGE_RESERVED",
          entityType: "session",
          entityId: newSession.id,
          summary: `Session created, package slot reserved: ${packageType || "Package"}`,
        });
      }

      return newSession;
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      );
    }

    console.error("POST /api/sessions failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create session.",
      },
      { status: 500 },
    );
  }
}
