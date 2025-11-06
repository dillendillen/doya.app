import Link from "next/link";
import { format } from "date-fns";
import { TopBar } from "@/components/layout/top-bar";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

async function getBookings() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "REQUESTED",
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        dog: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      clientId: booking.client.id,
      dogName: booking.dog?.name ?? "N/A",
      dogId: booking.dog?.id,
      serviceName: booking.service?.name ?? "N/A",
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      location: booking.location,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch bookings", error);
    return [];
  }
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className="space-y-6">
      <TopBar
        title="Bookings"
        actions={[]}
      />

      <Table
        headers={[
          "Client",
          "Dog",
          "Service",
          "Date & Time",
          "Location",
          "Status",
          "Actions",
        ]}
      >
        {bookings.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
              No pending bookings at this time.
            </td>
          </tr>
        ) : (
          bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="px-4 py-3">
                <div>
                  <Link
                    href={`/clients/${booking.clientId}`}
                    className="font-medium text-brand-secondary"
                  >
                    {booking.clientName}
                  </Link>
                  <p className="text-xs text-neutral-500">{booking.clientEmail}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {booking.dogId ? (
                  <Link
                    href={`/dogs/${booking.dogId}`}
                    className="text-brand-secondary"
                  >
                    {booking.dogName}
                  </Link>
                ) : (
                  booking.dogName
                )}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {booking.serviceName}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                <div>
                  {format(new Date(booking.startTime), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-neutral-500">
                  {format(new Date(booking.startTime), "HH:mm")} -{" "}
                  {format(new Date(booking.endTime), "HH:mm")}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {booking.location ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant="warning">Requested</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <form action={`/api/bookings/${booking.id}/confirm`} method="POST">
                    <button
                      type="submit"
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Confirm
                    </button>
                  </form>
                  <form action={`/api/bookings/${booking.id}/deny`} method="POST">
                    <button
                      type="submit"
                      className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      Deny
                    </button>
                  </form>
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="rounded bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}

