import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  due: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().optional(),
  relatedDogId: z.string().optional(),
  relatedClientId: z.string().optional(),
  relatedSessionId: z.string().optional(),
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
    const payload = createTaskSchema.parse(body);

    // Get first user as assignee (in a real app, use current user)
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return NextResponse.json({ error: "No users found." }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: payload.title,
        priority: payload.priority,
        due: payload.due,
        notes: payload.notes,
        assigneeId: firstUser.id,
        relatedDogId: payload.relatedDogId,
        relatedClientId: payload.relatedClientId,
        relatedSessionId: payload.relatedSessionId,
      },
    });

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error("POST /api/tasks failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create task.",
      },
      { status: 500 },
    );
  }
}

