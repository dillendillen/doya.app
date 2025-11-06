import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dogId = formData.get("dogId") as string | null;
    const clientId = formData.get("clientId") as string | null;

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
        dogId: dogId || undefined,
        clientId: clientId || undefined,
        tags: [],
        consentScope: "INTERNAL",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/media failed", error);

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

