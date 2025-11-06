import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
        },
      },
      { status: 200 }
    );
  }

  try {
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locale: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed", error);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}

