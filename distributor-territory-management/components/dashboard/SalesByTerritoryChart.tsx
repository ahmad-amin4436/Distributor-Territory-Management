"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { useTerritoryStore } from "@/store/territoryStore";
import { formatCompact, formatCurrency } from "@/lib/utils";

export function SalesByTerritoryChart() {
  const territories = useTerritoryStore((s) => s.territories);

  const data = useMemo(
    () =>
      [...territories]
        .sort((a, b) => b.monthlySales - a.monthlySales)
        .map((t) => ({
          name: t.name,
          sales: t.monthlySales,
          target: t.targetSales,
          color: t.color,
        })),
    [territories],
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-12}
            dy={6}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.08)" }}
            contentStyle={{
              background: "#111729",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e6edf7" }}
            formatter={(v: number) => formatCurrency(v)}
          />
          <Bar dataKey="sales" radius={[10, 10, 4, 4]} maxBarSize={42}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
