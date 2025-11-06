import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { z } from "zod";

const receiveEmailSchema = z.object({
  from: z.string().email("Invalid from email"),
  to: z.string().email("Invalid to email"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().optional(),
  html: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const payload = receiveEmailSchema.parse(body);

    // Find client by email
    const client = await prisma.client.findFirst({
      where: {
        email: {
          equals: payload.to,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (client) {
      // Log received email to communication log
      await prisma.clientNote.create({
        data: {
          clientId: client.id,
          body: `Email received from: ${payload.from}\nSubject: ${payload.subject}\n\n${payload.text || payload.html?.replace(/<[^>]*>/g, "") || ""}`,
        },
      });
    }

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

    console.error("POST /api/email/receive failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process received email.",
      },
      { status: 500 },
    );
  }
}


