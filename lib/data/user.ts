import { isDatabaseConfigured, prisma } from "../prisma";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isDatabaseConfigured()) {
    // Return a default user for demo
    return {
      id: "demo-user",
      name: "Demo User",
      email: "demo@doya.dog",
      role: "OWNER",
      locale: "en",
    };
  }

  try {
    // Get the first owner/admin user, or first user if no owner
    const user = await prisma.user.findFirst({
      where: {
        role: {
          in: ["OWNER", "ADMIN"],
        },
      },
      orderBy: { createdAt: "asc" },
    }) || await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
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

