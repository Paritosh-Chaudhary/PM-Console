"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { BudgetLine } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function BudgetChart({ lines, currency }: { lines: BudgetLine[]; currency: string }) {
  const byCategory = new Map<string, { category: string; planned: number; actual: number }>();
  for (const l of lines) {
    const key = l.category || "Uncategorized";
    const entry = byCategory.get(key) ?? { category: key, planned: 0, actual: 0 };
    entry.planned += Number(l.plannedAmount) || 0;
    entry.actual += Number(l.actualAmount) || 0;
    byCategory.set(key, entry);
  }
  const data = Array.from(byCategory.values());

  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-ink-faint text-sm border border-base-border rounded-lg bg-base-surface/60">
        Add budget lines to see planned vs. actual spend by category.
      </div>
    );
  }

  return (
    <div className="h-64 border border-base-border rounded-lg bg-base-surface/60 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#20272C" vertical={false} />
          <XAxis dataKey="category" tick={{ fill: "#93A1A8", fontSize: 11 }} axisLine={{ stroke: "#293238" }} tickLine={false} />
          <YAxis tick={{ fill: "#93A1A8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#171D21", border: "1px solid #293238", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#E7ECEE" }}
            formatter={(value: number) => formatCurrency(value, currency)}
          />
          <Bar dataKey="planned" fill="#5B9DF9" radius={[3, 3, 0, 0]} name="Planned" />
          <Bar dataKey="actual" fill="#3FD6C4" radius={[3, 3, 0, 0]} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
