import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

type RouteContext = {
  params: { id: string };
};

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const mediaId = params.id;
  if (!mediaId) {
    return NextResponse.json({ error: "Media ID is required." }, { status: 400 });
  }

  try {
    await prisma.mediaAsset.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/media/${mediaId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete media.",
      },
      { status: 500 },
    );
  }
}

