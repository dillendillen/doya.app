import { listAuditLogs } from "@/lib/data/audit";
import { TopBar } from "@/components/layout/top-bar";
import { Table } from "@/components/ui/table";

export default function AuditLogPage() {
  const logs = listAuditLogs();

  return (
    <div className="space-y-6">
      <TopBar
        title="Audit Log"
        actions={[
          { label: "Export CSV" },
        ]}
      />

      <Table headers={["Timestamp", "Actor", "Action", "Entity", "Summary"]}>
        {logs.map((log) => (
          <tr key={log.id}>
            <td className="px-4 py-3 text-xs text-neutral-500">
              {new Date(log.createdAt).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {log.actorId}
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">{log.action}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {log.entityType} · {log.entityId}
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {log.summary || "—"}
            </td>
          </tr>
        ))}
      </Table>

      {logs.length === 0 && (
        <p className="text-sm text-neutral-500">
          No audit events yet. Changes will appear here.
        </p>
      )}
    </div>
  );
}
