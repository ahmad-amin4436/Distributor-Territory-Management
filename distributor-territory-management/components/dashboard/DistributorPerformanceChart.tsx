"use client";

import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";

export function DistributorPerformanceChart() {
  const territories = useTerritoryStore((s) => s.territories);
  const distributors = useDistributorStore((s) => s.distributors);

  const data = useMemo(() => {
    return territories
      .filter((t) => t.distributorId)
      .map((t) => {
        const d = distributors.find((x) => x.id === t.distributorId);
        const ratio = t.targetSales ? Math.min(120, Math.round((t.monthlySales / t.targetSales) * 100)) : 0;
        return {
          name: d?.name.split(" ")[0] ?? t.name,
          fullName: d?.name ?? t.name,
          value: ratio,
          fill: t.color,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [territories, distributors]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius={40}
          outerRadius={120}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.05)" }} />
          <Tooltip
            contentStyle={{
              background: "#111729",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(value: number, _name, entry: any) => [
              `${value}% of target`,
              entry?.payload?.fullName,
            ]}
          />
          <Legend
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 11, paddingLeft: 12 }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
