import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const updateNoteSchema = z.object({
  body: z.string().min(1, "Note body is required"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const { id: noteId } = await params;
  if (!noteId) {
    return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateNoteSchema.parse(body);

    // Update the dog log entry
    const note = await prisma.dogLog.update({
      where: { id: noteId },
      data: {
        summary: payload.body,
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

    console.error(`PATCH /api/dogs/notes/${noteId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update note.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const { id: noteId } = await params;
  if (!noteId) {
    return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
  }

  try {
    // Check if note exists first
    const note = await prisma.dogLog.findUnique({
      where: { id: noteId },
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.dogLog.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/dogs/notes/${noteId} failed`, error);

    // Handle Prisma foreign key constraint errors
    if (error instanceof Error && error.message.includes("ForeignKeyConstraintError")) {
      return NextResponse.json(
        { error: "Cannot delete note because it is linked to other records." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete note.",
      },
      { status: 500 },
    );
  }
}
