import { isDatabaseConfigured, prisma } from "../prisma";

export type RevenueDataPoint = {
  period: string;
  paid: number;
  pending: number;
  total: number;
};

export type RevenueByPeriod = {
  weekly: RevenueDataPoint[];
  monthly: RevenueDataPoint[];
  currency: string;
};

export type RevenueSummary = {
  totalPaid: number;
  totalPending: number;
  totalRevenue: number;
  thisMonthPaid: number;
  thisMonthPending: number;
  thisWeekPaid: number;
  thisWeekPending: number;
  currency: string;
};

export async function getRevenueByPeriod(): Promise<RevenueByPeriod> {
  if (!isDatabaseConfigured()) {
    return {
      weekly: [],
      monthly: [],
      currency: "EUR",
    };
  }

  const now = new Date();
  const currency = "EUR"; // Default currency

  // Get all payments (paid revenue)
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        select: {
          currency: true,
        },
      },
    },
    orderBy: { receivedOn: "asc" },
  });

  // Get all invoices (pending revenue) - status is DRAFT or ISSUED (not PAID)
  const invoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["DRAFT", "ISSUED"],
      },
    },
    orderBy: { issuedOn: "asc" },
  });

  // Group by month (last 12 months)
  const monthlyData: Map<string, { paid: number; pending: number }> = new Map();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData.set(key, { paid: 0, pending: 0 });
  }

  // Group payments by month
  payments.forEach((payment) => {
    const date = new Date(payment.receivedOn);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData.has(key)) {
      monthlyData.get(key)!.paid += payment.amountCents;
    }
  });

  // Group invoices by month
  invoices.forEach((invoice) => {
    if (invoice.issuedOn) {
      const date = new Date(invoice.issuedOn);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData.has(key)) {
        monthlyData.get(key)!.pending += invoice.totalCents;
      }
    }
  });

  const monthly = Array.from(monthlyData.entries()).map(([period, data]) => ({
    period,
    paid: data.paid,
    pending: data.pending,
    total: data.paid + data.pending,
  }));

  // Helper function to get week key
  const getWeekKey = (date: Date): string => {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const year = weekStart.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (weekStart.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, "0")}`;
  };

  // Group by week (last 12 weeks)
  const weeklyData: Map<string, { paid: number; pending: number }> = new Map();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const key = getWeekKey(date);
    weeklyData.set(key, { paid: 0, pending: 0 });
  }

  // Group payments by week
  payments.forEach((payment) => {
    const key = getWeekKey(new Date(payment.receivedOn));
    if (weeklyData.has(key)) {
      weeklyData.get(key)!.paid += payment.amountCents;
    }
  });

  // Group invoices by week
  invoices.forEach((invoice) => {
    if (invoice.issuedOn) {
      const key = getWeekKey(new Date(invoice.issuedOn));
      if (weeklyData.has(key)) {
        weeklyData.get(key)!.pending += invoice.totalCents;
      }
    }
  });

  const weekly = Array.from(weeklyData.entries()).map(([period, data]) => ({
    period,
    paid: data.paid,
    pending: data.pending,
    total: data.paid + data.pending,
  }));

  return {
    weekly,
    monthly,
    currency,
  };
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  if (!isDatabaseConfigured()) {
    return {
      totalPaid: 0,
      totalPending: 0,
      totalRevenue: 0,
      thisMonthPaid: 0,
      thisMonthPending: 0,
      thisWeekPaid: 0,
      thisWeekPending: 0,
      currency: "EUR",
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Week start (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Get all payments
  const allPayments = await prisma.payment.findMany({
    include: {
      invoice: {
        select: {
          currency: true,
        },
      },
    },
  });

  // Get all unpaid invoices - status is DRAFT or ISSUED (not PAID)
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["DRAFT", "ISSUED"],
      },
    },
  });

  // Total paid
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amountCents, 0);
  
  // Total pending
  const totalPending = unpaidInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);

  // This month payments
  const thisMonthPayments = allPayments.filter(
    (p) => p.receivedOn >= monthStart && p.receivedOn <= monthEnd
  );
  const thisMonthPaid = thisMonthPayments.reduce((sum, p) => sum + p.amountCents, 0);

  // This month pending
  const thisMonthPending = unpaidInvoices
    .filter((inv) => inv.issuedOn && inv.issuedOn >= monthStart && inv.issuedOn <= monthEnd)
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  // This week payments
  const thisWeekPayments = allPayments.filter(
    (p) => p.receivedOn >= weekStart && p.receivedOn <= weekEnd
  );
  const thisWeekPaid = thisWeekPayments.reduce((sum, p) => sum + p.amountCents, 0);

  // This week pending
  const thisWeekPending = unpaidInvoices
    .filter((inv) => inv.issuedOn && inv.issuedOn >= weekStart && inv.issuedOn <= weekEnd)
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const currency = allPayments[0]?.invoice?.currency ?? "EUR";

  return {
    totalPaid,
    totalPending,
    totalRevenue: totalPaid + totalPending,
    thisMonthPaid,
    thisMonthPending,
    thisWeekPaid,
    thisWeekPending,
    currency,
  };
}

