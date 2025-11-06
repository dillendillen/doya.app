import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const updatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("EUR"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
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
    const data = updatePaymentSchema.parse(body);

    const amountCents = Math.round(data.amount * 100);

    // Map UI payment method strings to Prisma PaymentMethod enum values
    const methodMap: Record<string, "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"> = {
      "Cash": "CASH",
      "Bank Transfer": "BANK_TRANSFER",
      "Credit Card": "CARD",
      "Debit Card": "CARD",
      "Card": "CARD",
      "PayPal": "CARD",
      "Stripe": "CARD",
      "Other": "OTHER",
    };

    // Convert UI method to enum value, default to OTHER if not found
    const paymentMethod = methodMap[data.method.trim()] || "OTHER";

    await prisma.payment.update({
      where: { id },
      data: {
        amountCents,
        method: paymentMethod,
        reference: data.notes?.trim() || null, // Use reference field for notes
      },
    });

    await createAuditLog({
      action: "PAYMENT_UPDATED",
      entityType: "payment",
      entityId: id,
      summary: `Updated payment: ${data.currency} ${(amountCents / 100).toFixed(2)}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }

    console.error("PATCH /api/payments/[id] failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update payment.",
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            packageId: true,
            _count: {
              select: {
                payments: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    // Delete payment and linked invoice in a transaction
    // Only delete invoice if it's a standalone payment invoice (not linked to a package)
    // and has no other payments
    const shouldDeleteInvoice = payment.invoice 
      && !payment.invoice.packageId 
      && payment.invoice._count.payments === 1; // This is the only payment

    await prisma.$transaction(async (tx) => {
      // Delete the payment
      await tx.payment.delete({
        where: { id },
      });

      // Delete the linked invoice if it's a standalone payment invoice with only this payment
      if (shouldDeleteInvoice && payment.invoiceId) {
        await tx.invoice.delete({
          where: { id: payment.invoiceId },
        });
      }
    });

    await createAuditLog({
      action: "PAYMENT_DELETED",
      entityType: "payment",
      entityId: id,
      summary: `Deleted payment: ${(payment.amountCents / 100).toFixed(2)}${payment.invoice && !payment.invoice.packageId ? ", standalone invoice deleted" : ""}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/payments/[id] failed", error);
    
    // Handle Prisma foreign key constraint errors
    if (error instanceof Error && error.message.includes("ForeignKeyConstraintError")) {
      return NextResponse.json(
        { error: "Cannot delete payment because it is linked to other records." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete payment.",
      },
      { status: 500 }
    );
  }
}

