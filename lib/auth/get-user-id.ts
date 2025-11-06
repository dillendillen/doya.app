import { getSession } from "./session";

/**
 * Get the current user's ID from the session.
 * Returns null if not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

