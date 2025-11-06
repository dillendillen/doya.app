import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

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

  const { id: sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`POST /api/sessions/${sessionId}/start failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start session.",
      },
      { status: 500 },
    );
  }
}

