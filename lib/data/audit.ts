import { isDatabaseConfigured, prisma } from "../prisma";

export type AuditLogListItem = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string | null;
  createdAt: string;
};

export async function listAuditLogs(limit = 50): Promise<AuditLogListItem[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, name: true } } },
  });

  return rows.map((log) => {
    const actorName =
      (log as { actor?: { name?: string | null } }).actor?.name ?? null;

    return {
      id: log.id,
      actorId: actorName ?? log.actorId ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      summary: log.summary,
      createdAt: log.createdAt.toISOString(),
    };
  });
}
