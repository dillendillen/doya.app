import { NextResponse } from "next/server";
import { sendEmail, verifyEmailConfig } from "@/lib/email";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  text: z.string().optional(),
  html: z.string().optional(),
  from: z.string().email().optional(),
  clientId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = sendEmailSchema.parse(body);

    // Verify email config first
    const isConfigured = await verifyEmailConfig();
    if (!isConfigured) {
      return NextResponse.json(
        { error: "Email server is not configured properly." },
        { status: 503 },
      );
    }

    await sendEmail({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      from: payload.from,
    });

    // Log email to communication log if clientId provided
    if (payload.clientId && isDatabaseConfigured()) {
      try {
        await prisma.clientNote.create({
          data: {
            clientId: payload.clientId,
            body: `Email sent: ${payload.subject}\n\n${payload.text || payload.html?.replace(/<[^>]*>/g, "") || ""}`,
          },
        });
      } catch (error) {
        console.error("Failed to log email to communication log", error);
        // Don't fail the request if logging fails
      }
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

    console.error("POST /api/email/send failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email.",
      },
      { status: 500 },
    );
  }
}

