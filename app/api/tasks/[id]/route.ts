import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const updateTaskSchema = z.object({
  status: z.enum(["INBOX", "DOING", "WAITING", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  title: z.string().min(1).optional(),
  due: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
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

  const taskId = params.id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateTaskSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (payload.status) updateData.status = payload.status;
    if (payload.priority) updateData.priority = payload.priority;
    if (payload.title) updateData.title = payload.title;
    if (Object.prototype.hasOwnProperty.call(payload, "due")) updateData.due = payload.due ?? null;
    if (Object.prototype.hasOwnProperty.call(payload, "notes")) updateData.notes = payload.notes ?? null;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error(`PATCH /api/tasks/${taskId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update task.",
      },
      { status: 500 },
    );
  }
}
