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
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/bookings");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`POST /api/bookings/${bookingId}/deny failed`, error);
    return NextResponse.json(
      { error: "Failed to deny booking." },
      { status: 500 },
    );
  }
}

