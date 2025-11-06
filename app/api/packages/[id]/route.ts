import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const updatePackageSchema = z.object({
  type: z.string().min(1, "Package type is required"),
  totalCredits: z.number().int().positive("Session count must be positive"),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("EUR"),
  expiresOn: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updatePackageSchema.parse(body);

    const priceCents = Math.round(data.price * 100);
    const expiresOnDate = data.expiresOn ? new Date(data.expiresOn) : null;

    await prisma.package.update({
      where: { id },
      data: {
        type: data.type,
        totalCredits: data.totalCredits,
        priceCents,
        currency: data.currency,
        expiresOn: expiresOnDate,
      },
    });

    await createAuditLog({
      action: "PACKAGE_UPDATED",
      entityType: "package",
      entityId: id,
      summary: `Updated package: ${data.type}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("PATCH /api/packages/[id] failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update package.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id },
      select: { 
        type: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    // Check if package is in use (only check sessions as payments don't have direct relation)
    if (pkg._count.sessions > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete package "${pkg.type}" because it is linked to ${pkg._count.sessions} session(s). Please remove all associations first.` 
        },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id },
    });

    await createAuditLog({
      action: "PACKAGE_DELETED",
      entityType: "package",
      entityId: id,
      summary: `Deleted package: ${pkg.type}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/packages/[id] failed", error);
    
    // Handle Prisma foreign key constraint errors
    if (error instanceof Error && error.message.includes("ForeignKeyConstraintError")) {
      return NextResponse.json(
        { error: "Cannot delete package because it is linked to other records. Please remove all associations first." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete package.",
      },
      { status: 500 }
    );
  }
}

