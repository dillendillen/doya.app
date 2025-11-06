import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { z } from "zod";

const auditLogSchema = z.object({
  sessionId: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  durationSeconds: z.number(),
  timestamps: z.array(
    z.object({
      action: z.string(),
      time: z.string(),
    }),
  ),
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
    const payload = auditLogSchema.parse(body);

    // Create audit log entry in database
    await prisma.auditLog.create({
      data: {
        action: "SESSION_COMPLETED",
        entityType: "session",
        entityId: payload.sessionId || "unknown",
        summary: `Session completed: ${payload.durationSeconds}s duration`,
        actorId: null, // TODO: Get from session/auth
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

    console.error("POST /api/audit-log failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save audit log.",
      },
      { status: 500 },
    );
  }
}

