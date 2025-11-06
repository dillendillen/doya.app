import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
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
    const payload = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check if user has a password (passwordHash exists)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Account not set up. Please contact an administrator." },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("POST /api/auth/login failed", error);
    return NextResponse.json(
      { error: "Failed to login." },
      { status: 500 }
    );
  }
}

