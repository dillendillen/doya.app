import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const arrayOfStrings = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

const createDogSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientId: z.string().min(1, "Client is required"),
  breed: optionalText,
  sex: z.enum(["M", "F"]).default("F"),
  dob: optionalText.refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    "Invalid date of birth.",
  ),
  weightKg: z
    .preprocess((value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }

      const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
      return Number.isFinite(numeric) ? numeric : value;
    }, z.number().min(0, "Weight must be zero or positive."))
    .optional(),
  tags: arrayOfStrings,
  medicalFlags: arrayOfStrings,
  triggers: arrayOfStrings,
  consentInternal: z.boolean().optional().default(true),
  consentShareLater: z.boolean().optional().default(false),
  photo: optionalText,
  note: optionalText,
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
    const payload = createDogSchema.parse(body);

    const clientExists = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { id: true },
    });

    if (!clientExists) {
      return NextResponse.json(
        { error: "Client not found." },
        { status: 404 },
      );
    }

    const dog = await prisma.$transaction(async (tx) => {
      const createdDog = await tx.dog.create({
        data: {
          name: payload.name,
          clientId: payload.clientId,
          breed: payload.breed ?? null,
          sex: payload.sex,
          dob: payload.dob ? new Date(payload.dob) : null,
          weightKg: payload.weightKg ?? null,
          medicalFlags: payload.medicalFlags,
          triggers: payload.triggers,
          tags: payload.tags,
          consentInternal: payload.consentInternal,
          consentShareLater: payload.consentShareLater,
          photoUrl: payload.photo ?? null,
        },
        select: {
          id: true,
          name: true,
          clientId: true,
        },
      });

      if (payload.note) {
        await tx.dogLog.create({
          data: {
            dogId: createdDog.id,
            summary: payload.note,
          },
        });

        await tx.clientNote.create({
          data: {
            clientId: payload.clientId,
            body: payload.note,
          },
        });
      }

      return createdDog;
    });

    return NextResponse.json({ dog }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error("POST /api/dogs failed", error);
    return NextResponse.json(
      { error: "Failed to create dog." },
      { status: 500 },
    );
  }
}
