import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

type RouteContext = {
  params: { id: string };
};

const createNoteSchema = z.object({
  body: z.string().min(1, "Note body is required"),
});

export async function POST(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const { id: dogId } = await params;
  if (!dogId) {
    return NextResponse.json({ error: "Dog ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = createNoteSchema.parse(body);

    await prisma.dogLog.create({
      data: {
        dogId,
        summary: payload.body,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      );
    }

    console.error(`POST /api/dogs/${dogId}/notes failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add note.",
      },
      { status: 500 },
    );
  }
}

