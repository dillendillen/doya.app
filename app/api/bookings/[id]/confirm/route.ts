import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: { id: string };
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const bookingId = params.id;
  if (!bookingId) {
    return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    // Update booking status and set client source to "website" if not already set
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      }),
      ...(booking.client.source !== "website"
        ? [
            prisma.client.update({
              where: { id: booking.clientId },
              data: { source: "website" },
            }),
          ]
        : []),
    ]);

    revalidatePath("/bookings");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`POST /api/bookings/${bookingId}/confirm failed`, error);
    return NextResponse.json(
      { error: "Failed to confirm booking." },
      { status: 500 },
    );
  }
}

