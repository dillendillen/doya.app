import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const updateDogSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  clientId: z.string().min(1, "Client is required").optional(),
  breed: optionalText,
  sex: z.enum(["M", "F"]).optional(),
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
  tags: z.array(z.string().trim().min(1)).optional(),
  medicalFlags: z.array(z.string().trim().min(1)).optional(),
  triggers: z.array(z.string().trim().min(1)).optional(),
  consentInternal: z.boolean().optional(),
  consentShareLater: z.boolean().optional(),
  photo: optionalText,
  note: optionalText,
});

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const dogId = params.id;
  if (!dogId) {
    return NextResponse.json({ error: "Dog ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateDogSchema.parse(body);

    if (payload.clientId) {
      const clientExists = await prisma.client.count({ where: { id: payload.clientId } });
      if (clientExists === 0) {
        return NextResponse.json({ error: "Client not found." }, { status: 404 });
      }
    }

    const dog = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (payload.name) {
        updateData.name = payload.name;
      }

      if (payload.clientId) {
        updateData.clientId = payload.clientId;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "breed")) {
        updateData.breed = payload.breed ?? null;
      }

      if (payload.sex) {
        updateData.sex = payload.sex;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "dob")) {
        updateData.dob = payload.dob ? new Date(payload.dob) : null;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "weightKg")) {
        updateData.weightKg = payload.weightKg ?? null;
      }

      if (payload.tags !== undefined) {
        updateData.tags = { set: payload.tags };
      }

      if (payload.medicalFlags !== undefined) {
        updateData.medicalFlags = { set: payload.medicalFlags };
      }

      if (payload.triggers !== undefined) {
        updateData.triggers = { set: payload.triggers };
      }

      if (payload.consentInternal !== undefined) {
        updateData.consentInternal = payload.consentInternal;
      }

      if (payload.consentShareLater !== undefined) {
        updateData.consentShareLater = payload.consentShareLater;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "photo")) {
        updateData.photoUrl = payload.photo ?? null;
      }

      const hasUpdates = Object.keys(updateData).length > 0;

      const updatedDog = hasUpdates
        ? await tx.dog.update({
            where: { id: dogId },
            data: updateData,
            select: {
              id: true,
              name: true,
              clientId: true,
            },
          })
        : await tx.dog.findUnique({
            where: { id: dogId },
            select: {
              id: true,
              name: true,
              clientId: true,
            },
          });

      if (!updatedDog) {
        throw new Error("Dog not found.");
      }

      if (payload.note) {
        await tx.dogLog.create({
          data: {
            dogId,
            summary: payload.note,
          },
        });

        const noteClientId = payload.clientId ?? updatedDog.clientId;
        if (noteClientId) {
          await tx.clientNote.create({
            data: {
              clientId: noteClientId,
              body: payload.note,
            },
          });
        }
      }

      return updatedDog;
    });

    return NextResponse.json({ dog }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error(`PATCH /api/dogs/${dogId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update dog.",
      },
      { status: 500 },
    );
  }
}
