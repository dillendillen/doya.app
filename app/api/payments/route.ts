import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getUserId } from "@/lib/auth/get-user-id";

const createPaymentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("EUR"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    
    // Validate and parse payload
    const payload = createPaymentSchema.parse(body);
    
    // Additional validation: ensure method is not empty after trimming
    if (!payload.method || !payload.method.trim()) {
      return NextResponse.json(
        { error: "Payment method is required and cannot be empty." },
        { status: 400 },
      );
    }

    // Map UI payment method strings to Prisma PaymentMethod enum values
    const methodMap: Record<string, "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"> = {
      "Cash": "CASH",
      "Bank Transfer": "BANK_TRANSFER",
      "Credit Card": "CARD",
      "Debit Card": "CARD",
      "Card": "CARD",
      "PayPal": "CARD", // PayPal is treated as card payment
      "Stripe": "CARD", // Stripe is treated as card payment
      "Other": "OTHER",
    };

    // Convert UI method to enum value, default to OTHER if not found
    const paymentMethod = methodMap[payload.method.trim()] || "OTHER";

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    // Convert amount to cents
    const amountCents = Math.round(payload.amount * 100);

    // Verify client exists and belongs to user
    const client = await prisma.client.findUnique({
      where: { id: payload.clientId },
      select: { id: true, userId: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    if (client.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    // If invoiceId provided, verify it exists and link payment to invoice
    // Otherwise, create a new invoice for this payment
    let payment;
    
      if (payload.invoiceId) {
      // Verify invoice exists and get currency
      const invoice = await prisma.invoice.findUnique({
        where: { id: payload.invoiceId },
        select: { id: true, clientId: true, currency: true, userId: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
      }

      // Verify invoice belongs to the client and user
      if (invoice.clientId !== payload.clientId || invoice.userId !== userId) {
        return NextResponse.json({ error: "Invoice does not belong to this client." }, { status: 400 });
      }

      // Link payment to existing invoice and mark invoice as PAID
      payment = await prisma.$transaction(async (tx) => {
        // Update invoice status to PAID
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidOn: new Date(),
          },
        });

        // Create payment with currency from invoice
        return await tx.payment.create({
          data: {
            userId,
            invoiceId: invoice.id,
            amountCents,
            method: paymentMethod,
            reference: payload.notes?.trim() || null, // Use reference field for notes
            receivedOn: new Date(),
            currency: invoice.currency,
          },
        });
      });
    } else {
      // Standalone payment without invoice (for general payments/adjustments)
      // This creates a minimal invoice just for record-keeping
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          clientId: payload.clientId,
          currency: payload.currency,
          totalCents: amountCents,
          status: "PAID",
          issuedOn: new Date(),
          paidOn: new Date(),
        },
      });

      // Create payment linked to the new invoice
      payment = await prisma.payment.create({
        data: {
          userId,
          invoiceId: invoice.id,
          amountCents,
          method: paymentMethod,
          reference: payload.notes?.trim() || null, // Use reference field for notes
          receivedOn: new Date(),
          currency: payload.currency,
        },
      });
    }

    // Log payment
    await createAuditLog({
      action: "PAYMENT_RECORDED",
      entityType: "payment",
      entityId: payment.id,
      summary: `Payment received: ${payload.currency} ${(amountCents / 100).toFixed(2)} via ${payload.method}`,
    });

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment.id,
          amount: amountCents,
          currency: payload.currency,
          method: payload.method,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error("POST /api/payments failed", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to record payment.",
      },
      { status: 500 },
    );
  }
}


