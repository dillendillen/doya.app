import { isDatabaseConfigured, prisma } from "./prisma";

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  summary?: string | null;
  actorId?: string | null;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.log("Audit log (not saved):", data);
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        summary: data.summary ?? null,
        actorId: data.actorId ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

