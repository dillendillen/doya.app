"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { RevenueDataPoint, RevenueSummary } from "@/lib/data/revenue";

type RevenueOverviewProps = {
  weeklyData: RevenueDataPoint[];
  monthlyData: RevenueDataPoint[];
  summary: RevenueSummary;
};

export function RevenueOverview({ weeklyData, monthlyData, summary }: RevenueOverviewProps) {
  const [period, setPeriod] = useState<"week" | "month">("month");

  const data = period === "week" ? weeklyData : monthlyData;

  // Format currency
  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString("en-US", {
      style: "currency",
      currency: summary.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format period label
  const formatPeriod = (period: string) => {
    if (period.includes("W")) {
      // Week format: 2024-W01
      const [year, week] = period.split("-W");
      return `Week ${week}`;
    } else {
      // Month format: 2024-01
      const [year, month] = period.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
  };

  const chartData = data.map((point) => ({
    period: formatPeriod(point.period),
    Paid: point.paid / 100,
    Pending: point.pending / 100,
    Total: point.total / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/30 via-white to-white dark:from-emerald-900/10 dark:via-slate-800 dark:to-slate-800">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Total Paid
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(summary.totalPaid)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
              All-time revenue collected
            </p>
          </div>
        </Card>

        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/30 via-white to-white dark:from-amber-900/10 dark:via-slate-800 dark:to-slate-800">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Total Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(summary.totalPending)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
              Outstanding invoices
            </p>
          </div>
        </Card>

        <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/30 via-white to-white dark:from-blue-900/10 dark:via-slate-800 dark:to-slate-800">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              This Month
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(summary.thisMonthPaid)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
              {formatCurrency(summary.thisMonthPending)} pending
            </p>
          </div>
        </Card>

        <Card className="border-purple-200/60 bg-gradient-to-br from-purple-50/30 via-white to-white dark:from-purple-900/10 dark:via-slate-800 dark:to-slate-800">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
              This Week
            </p>
            <p className="mt-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(summary.thisWeekPaid)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
              {formatCurrency(summary.thisWeekPending)} pending
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card title="Revenue Trend">
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setPeriod("week")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === "week"
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === "month"
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              Monthly
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="period"
                className="text-xs text-neutral-600 dark:text-slate-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs text-neutral-600 dark:text-slate-400"
                tick={{ fill: "currentColor" }}
                tickFormatter={(value) => formatCurrency(value * 100)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value * 100)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Paid"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Pending"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card title="Revenue Breakdown">
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setPeriod("week")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === "week"
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === "month"
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              Monthly
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="period"
                className="text-xs text-neutral-600 dark:text-slate-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs text-neutral-600 dark:text-slate-400"
                tick={{ fill: "currentColor" }}
                tickFormatter={(value) => formatCurrency(value * 100)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value * 100)}
              />
              <Legend />
              <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

