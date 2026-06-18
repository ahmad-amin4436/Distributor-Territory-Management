"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Flame, Layers3, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicMap } from "@/components/map/DynamicMap";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesByTerritoryChart } from "@/components/dashboard/SalesByTerritoryChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { HeatmapManager } from "@/components/sales/HeatmapManager";
import { SalesPointDialog } from "@/components/sales/SalesPointDialog";
import { useTerritoryStore } from "@/store/territoryStore";
import { useHeatmapStore } from "@/store/heatmapStore";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import type { SalesPoint } from "@/types";

export default function SalesPage() {
  const territories = useTerritoryStore((s) => s.territories);
  const points = useHeatmapStore((s) => s.points);
  const settings = useHeatmapStore((s) => s.settings);
  const [view, setView] = useState<"heatmap" | "polygons">("heatmap");
  const [placing, setPlacing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftPos, setDraftPos] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<SalesPoint | null>(null);
  const [toast, setToast] = useState<{
    tone: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!placing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlacing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placing]);

  const totals = useMemo(() => {
    const totalSales = territories.reduce((s, t) => s + t.monthlySales, 0);
    const visible = settings.territoryFilter
      ? points.filter((p) => p.territoryId === settings.territoryFilter)
      : points;
    const high = visible.filter((p) => p.intensity >= settings.highThreshold).length;
    const low = visible.filter((p) => p.intensity < settings.mediumThreshold).length;
    return { totalSales, high, low, mid: visible.length - high - low, totalPoints: visible.length };
  }, [territories, points, settings]);

  const handleMapClick = (lat: number, lng: number) => {
    setDraftPos({ lat, lng });
    setEditing(null);
    setDialogOpen(true);
    setPlacing(false);
  };

  const notice = (text: string, tone: "success" | "danger" | "info" = "info") =>
    setToast({ text, tone });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sales coverage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the live heatmap of sales activity across every territory.
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
          hint={`> ${settings.highThreshold}% intensity`}
          icon={Flame}
          accent="#22c55e"
        />
        <KpiCard
          label="Mid activity zones"
          value={String(totals.mid)}
          delta={2}
          hint={`${settings.mediumThreshold}–${settings.highThreshold}% intensity`}
          icon={MapPin}
          accent="#facc15"
        />
        <KpiCard
          label="Low activity zones"
          value={String(totals.low)}
          delta={-4}
          hint={`Below ${settings.mediumThreshold}% — needs attention`}
          icon={TrendingUp}
          accent="#ef4444"
        />
        <KpiCard
          label="Total field revenue"
          value={formatCurrency(totals.totalSales)}
          hint={`${totals.totalPoints} hotspots tracked`}
          icon={Layers3}
          accent="#6366f1"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="relative h-[64vh] min-h-[500px]">
              <DynamicMap
                showHeatmap={view === "heatmap"}
                heatPoints={points}
                heatSettings={settings}
                pointPlacing={placing}
                onMapClick={handleMapClick}
              />
              <div className="pointer-events-none absolute right-4 top-4 z-[400] flex flex-col gap-2 rounded-xl border border-border bg-card/85 px-4 py-3 text-xs backdrop-blur">
                <span className="font-semibold uppercase tracking-wider text-foreground">
                  Activity legend
                </span>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/40" />
                  High sales · ≥ {settings.highThreshold}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_2px] shadow-amber-400/40" />
                  Medium · ≥ {settings.mediumThreshold}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_2px] shadow-rose-500/40" />
                  Low / underperforming
                </div>
              </div>

              {placing && (
                <div className="pointer-events-none absolute left-1/2 top-4 z-[450] -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur animate-fade-in">
                  Click the map to drop a sales hotspot · Esc to cancel
                </div>
              )}

              {toast && (
                <div
                  className={cn(
                    "pointer-events-auto absolute bottom-4 left-1/2 z-[460] -translate-x-1/2 rounded-full border px-4 py-2 text-xs shadow-lg backdrop-blur animate-fade-in",
                    toast.tone === "success" && "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
                    toast.tone === "danger" && "border-rose-500/30 bg-rose-500/15 text-rose-200",
                    toast.tone === "info" && "border-indigo-500/30 bg-indigo-500/15 text-indigo-200",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {toast.tone === "danger" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {toast.text}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <HeatmapManager
          placing={placing}
          onTogglePlacing={() => setPlacing((v) => !v)}
          onEditPoint={(p) => {
            setEditing(p);
            setDraftPos(null);
            setDialogOpen(true);
          }}
          onNotice={notice}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage health</CardTitle>
          <p className="text-sm text-muted-foreground">Quick scan of every zone’s health.</p>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                <span className="text-xs text-muted-foreground">{formatCompact(t.monthlySales)}</span>
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

      <SalesPointDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) {
            setEditing(null);
            setDraftPos(null);
          }
        }}
        draftPosition={draftPos}
        editing={editing}
      />
    </div>
  );
}
