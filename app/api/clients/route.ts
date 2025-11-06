import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().trim().optional().transform((val) => (val && val.length > 0 ? val : undefined)),
  email: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  address: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  language: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  referral: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  vatId: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

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
    const payload = createClientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        name: payload.name,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        address: payload.address ?? null,
        language: payload.language ?? null,
        notes: payload.notes ?? null,
        referral: payload.referral ?? null,
        vatId: payload.vatId ?? null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      );
    }

    console.error("POST /api/clients failed", error);
    return NextResponse.json(
      {
        error: "Failed to create client.",
      },
      { status: 500 },
    );
  }
}
