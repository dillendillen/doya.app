import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const createNoteSchema = z.object({
  body: z.string().min(1, "Note body is required"),
});

type RouteContext = {
  params: { id: string };
};

export async function POST(request: Request, { params }: RouteContext) {
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
    const payload = createNoteSchema.parse(body);

    const note = await prisma.clientNote.create({
      data: {
        clientId,
        body: payload.body,
      },
    });

    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error(`POST /api/clients/${clientId}/notes failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create note.",
      },
      { status: 500 },
    );
  }
}

