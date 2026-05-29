"use client";

import { useMemo, useState } from "react";
import { Flame, Layers3, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicMap } from "@/components/map/DynamicMap";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesByTerritoryChart } from "@/components/dashboard/SalesByTerritoryChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { generateSalesPoints } from "@/mock/sales";
import { useTerritoryStore } from "@/store/territoryStore";
import { formatCompact, formatCurrency } from "@/lib/utils";

export default function SalesPage() {
  const territories = useTerritoryStore((s) => s.territories);
  const points = useMemo(() => generateSalesPoints(), []);
  const [view, setView] = useState<"heatmap" | "polygons">("heatmap");

  const totals = useMemo(() => {
    const totalSales = territories.reduce((s, t) => s + t.monthlySales, 0);
    const high = points.filter((p) => p.intensity >= 65).length;
    const low = points.filter((p) => p.intensity < 40).length;
    return { totalSales, high, low, mid: points.length - high - low };
  }, [territories, points]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sales coverage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize where revenue is generated and where coverage needs reinforcement.
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="heatmap">
              <Flame className="h-3.5 w-3.5" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="polygons">
              <Layers3 className="h-3.5 w-3.5" />
              Territories
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="High activity zones"
          value={String(totals.high)}
          delta={8}
          hint="Outlets generating > 65% intensity"
          icon={Flame}
          accent="#22c55e"
        />
        <KpiCard
          label="Mid activity zones"
          value={String(totals.mid)}
          delta={2}
          hint="40–65% intensity range"
          icon={MapPin}
          accent="#facc15"
        />
        <KpiCard
          label="Low activity zones"
          value={String(totals.low)}
          delta={-4}
          hint="Below 40% intensity — needs attention"
          icon={TrendingUp}
          accent="#ef4444"
        />
        <KpiCard
          label="Total field revenue"
          value={formatCurrency(totals.totalSales)}
          hint={`Across ${territories.length} territories`}
          icon={Layers3}
          accent="#6366f1"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="relative h-[60vh] min-h-[480px]">
              <DynamicMap
                showHeatmap={view === "heatmap"}
                heatPoints={points}
              />
              <div className="pointer-events-none absolute right-4 top-4 z-[400] flex flex-col gap-2 rounded-xl border border-border bg-card/85 px-4 py-3 text-xs backdrop-blur">
                <span className="font-semibold uppercase tracking-wider text-foreground">
                  Activity legend
                </span>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/40" />
                  High sales
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_2px] shadow-amber-400/40" />
                  Medium
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_2px] shadow-rose-500/40" />
                  Low / underperforming
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage health</CardTitle>
            <p className="text-sm text-muted-foreground">Quick scan of every zone’s health.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {territories.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color, boxShadow: `0 0 8px ${t.color}80` }}
                  />
                  <span className="font-medium">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">${formatCompact(t.monthlySales)}</span>
                  <Badge
                    variant={
                      t.performance === "excellent"
                        ? "success"
                        : t.performance === "good"
                          ? "info"
                          : t.performance === "average"
                            ? "warning"
                            : "danger"
                    }
                    className="text-[10px]"
                  >
                    {t.performance}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by territory</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByTerritoryChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trend (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
