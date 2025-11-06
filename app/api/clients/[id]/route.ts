import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val && val.length > 0 ? val : undefined));

const updateClientSchema = z
  .object({
    name: optionalText,
    phone: optionalText,
    email: optionalText,
    address: optionalText,
    language: optionalText,
    referral: optionalText,
    vatId: optionalText,
    notes: optionalText,
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
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

  const clientId = params.id;
  if (!clientId) {
    return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateClientSchema.parse(body);

    const updateData: Record<string, string | null> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name;
    }
    if (payload.phone !== undefined) {
      updateData.phone = payload.phone ?? null;
    }
    if (payload.email !== undefined) {
      updateData.email = payload.email ?? null;
    }
    if (payload.address !== undefined) {
      updateData.address = payload.address ?? null;
    }
    if (payload.language !== undefined) {
      updateData.language = payload.language ?? null;
    }
    if (payload.referral !== undefined) {
      updateData.referral = payload.referral ?? null;
    }
    if (payload.vatId !== undefined) {
      updateData.vatId = payload.vatId ?? null;
    }
    if (payload.notes !== undefined) {
      updateData.notes = payload.notes ?? null;
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: { id: true },
    });

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error(`PATCH /api/clients/${clientId} failed`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update client.",
      },
      { status: 500 },
    );
  }
}
