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

  const { id: dogId } = await params;
  if (!dogId) {
    return NextResponse.json({ error: "Dog ID is required." }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    // Convert file to base64 for storage (in production, use S3/Cloudinary)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const fileUrl = `data:${file.type};base64,${base64}`;
    
    // Create thumbUrl for images
    let thumbUrl: string | null = null;
    if (file.type.startsWith("image/")) {
      thumbUrl = fileUrl; // Use same URL for thumbnails
    }

    await prisma.mediaAsset.create({
      data: {
        url: fileUrl,
        thumbUrl,
        dogId,
        tags: [],
        consentScope: "INTERNAL",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`POST /api/dogs/${dogId}/media failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload media.",
      },
      { status: 500 },
    );
  }
}

