import { listUsers, getAvailabilitySettings } from "@/lib/data/settings";
import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavSettings } from "@/components/settings/nav-settings";

export default async function SettingsPage() {
  const [users, availability] = await Promise.all([
    listUsers(),
    getAvailabilitySettings(),
  ]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Settings"
        actions={[
          { label: "Invite User" },
          { label: "Edit Profile" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Users & Roles">
          <ul className="space-y-3 text-sm text-neutral-600">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 p-3"
              >
                <div>
                  <p className="font-semibold text-brand-secondary">
                    {user.name}
                  </p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <Badge variant="muted">{user.role}</Badge>
              </li>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-neutral-500">
                Invite team members to collaborate.
              </p>
            )}
          </ul>
        </Card>

        <Card title="Availability & Buffers">
          <div className="space-y-3 text-sm text-neutral-600">
            <p className="text-xs uppercase text-neutral-500">
              Travel buffer minutes
            </p>
            <p className="font-semibold text-brand-secondary">
              {availability.travelBufferMinutes} minutes
            </p>
            <p className="text-xs uppercase text-neutral-500">
              Weekly availability
            </p>
            <ul className="space-y-2">
              {availability.availability.map((slot) => (
                <li
                  key={`${slot.day}-${slot.from}`}
                  className="rounded-lg border border-neutral-200 p-3"
                >
                  <span className="font-medium text-brand-secondary">
                    {slot.day}
                  </span>{" "}
                  · {slot.from} — {slot.to}
                  {slot.location ? ` · ${slot.location}` : null}
                </li>
              ))}
              {availability.availability.length === 0 && (
                <li className="text-sm text-neutral-500">
                  Configure working hours to improve scheduling.
                </li>
              )}
            </ul>
          </div>
        </Card>
      </section>

      <Card title="Data Export">
        <div className="flex flex-col gap-3 text-sm text-neutral-600 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Export client or dog data on-demand. Generated files stay available
            for 7 days.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-brand-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-secondary/90"
          >
            Request Export
          </button>
        </div>
      </Card>

      <NavSettings />
    </div>
  );
}
