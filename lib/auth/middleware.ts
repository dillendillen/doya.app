import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./session";

export async function requireAuth(request: NextRequest): Promise<{ userId: string; email: string; name: string; role: string } | null> {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  return session;
}

export function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

