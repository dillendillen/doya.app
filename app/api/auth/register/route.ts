import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const payload = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(payload.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.toLowerCase().trim(),
        passwordHash,
        role: "OWNER", // First user is owner
        locale: "en",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create session
    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("POST /api/auth/register failed", error);
    return NextResponse.json(
      { error: "Failed to register." },
      { status: 500 }
    );
  }
}

