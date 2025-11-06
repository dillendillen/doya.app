import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

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

    const note = await prisma.clientNote.update({
      where: { id: noteId },
      data: {
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

    console.error(`PATCH /api/clients/notes/${noteId} failed`, error);

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
    const note = await prisma.clientNote.findUnique({
      where: { id: noteId },
      select: { clientId: true, body: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.clientNote.delete({
      where: { id: noteId },
    });

    await createAuditLog({
      action: "CLIENT_NOTE_DELETED",
      entityType: "clientNote",
      entityId: noteId,
      summary: `Deleted note from client`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/clients/notes/${noteId} failed`, error);

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

