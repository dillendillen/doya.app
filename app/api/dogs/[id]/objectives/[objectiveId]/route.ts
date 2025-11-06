import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const updateObjectiveSchema = z.object({
  skill: z.string().min(1, "Skill is required"),
  status: z.enum(["planned", "in_progress", "mastered"]),
  notes: z.string().nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string; objectiveId: string }>;
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; objectiveId: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const { id: dogId, objectiveId } = await params;

    // Find the objective (stored as DogLog entry)
    const objective = await prisma.dogLog.findFirst({
      where: {
        id: objectiveId,
        dogId,
        summary: { startsWith: "[OBJECTIVE]" },
      },
    });

    if (!objective) {
      return NextResponse.json({ error: "Objective not found." }, { status: 404 });
    }

    await prisma.dogLog.delete({
      where: { id: objectiveId },
    });

    await createAuditLog({
      action: "TRAINING_OBJECTIVE_DELETED",
      entityType: "dogLog",
      entityId: objectiveId,
      summary: `Deleted training objective for dog`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dogs/[id]/objectives/[objectiveId] failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete objective.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const { id: dogId, objectiveId } = await params;

  try {
    const body = await request.json();
    const data = updateObjectiveSchema.parse(body);

    // Store objective in DogLog with special format
    // Format: [OBJECTIVE] id:objectiveId, skill:skill, status:status, notes:notes\n
    const objectiveData = `[OBJECTIVE] id:${objectiveId}, skill:${data.skill}, status:${data.status}${data.notes ? `, notes:${data.notes}` : ""}\n${data.notes || ""}`;

    // Check if objective log exists
    const existingLog = await prisma.dogLog.findFirst({
      where: {
        dogId,
        summary: {
          startsWith: `[OBJECTIVE] id:${objectiveId}`,
        },
      },
    });

    if (existingLog) {
      await prisma.dogLog.update({
        where: { id: existingLog.id },
        data: {
          summary: objectiveData,
        },
      });
    } else {
      await prisma.dogLog.create({
        data: {
          dogId,
          summary: objectiveData,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Failed to update objective:", error);
    return NextResponse.json(
      { error: "Failed to update objective" },
      { status: 500 },
    );
  }
}

