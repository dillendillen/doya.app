import { isDatabaseConfigured, prisma } from "../prisma";
import { getSession } from "../auth/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Get session from cookie
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!isDatabaseConfigured()) {
    // Return session data if database is not configured
    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      locale: "en",
    };
  }

  try {
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locale: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      locale: user.locale,
    };
  } catch (error) {
    console.error("getCurrentUser failed", error);
    return null;
  }
}

