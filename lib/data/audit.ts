import { auditLogs } from "../mock-data";
import type { AuditLog } from "../types";

export function listAuditLogs(limit = 50): AuditLog[] {
  return auditLogs
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
