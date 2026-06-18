"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Flame, Layers3, MapPin, TrendingUp, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicMap } from "@/components/map/DynamicMap";
import { MapLegend } from "@/components/map/MapLegend";
import { MapToolbar } from "@/components/map/MapToolbar";
import { MapSearch } from "@/components/map/MapSearch";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesByTerritoryChart } from "@/components/dashboard/SalesByTerritoryChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { HeatmapManager } from "@/components/sales/HeatmapManager";
import { SalesPointDialog } from "@/components/sales/SalesPointDialog";
import { useTerritoryStore } from "@/store/territoryStore";
import { useHeatmapStore } from "@/store/heatmapStore";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import type { BaseLayerId, LatLng, SalesPoint } from "@/types";

export default function SalesPage() {
  const territories = useTerritoryStore((s) => s.territories);
  const points = useHeatmapStore((s) => s.points);
  const settings = useHeatmapStore((s) => s.settings);
  const updateSettings = useHeatmapStore((s) => s.updateSettings);
  const importPoints = useHeatmapStore((s) => s.importPoints);

  const [view, setView] = useState<"heatmap" | "polygons">("heatmap");
  const [placing, setPlacing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftPos, setDraftPos] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<SalesPoint | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>("dark");
  const [focusPlace, setFocusPlace] = useState<{
    lat: number;
    lng: number;
    bounds?: [LatLng, LatLng];
    label?: string;
    tick: number;
  } | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [highlightOverlaps, setHighlightOverlaps] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

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

  const handleExport = () => {
    const visible = settings.territoryFilter
      ? points.filter((p) => p.territoryId === settings.territoryFilter)
      : points;
    if (!visible.length) {
      notice("No hotspots to export.", "danger");
      return;
    }
    const header = "id,lat,lng,intensity,amount,territoryId,label,createdAt\n";
    const body = visible
      .map((p) =>
        [
          p.id,
          p.lat,
          p.lng,
          p.intensity,
          p.amount,
          p.territoryId ?? "",
          (p.label ?? "").replace(/"/g, '""'),
          p.createdAt ?? "",
        ]
          .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heatmap-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notice(`Exported ${visible.length} hotspots.`, "success");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
      if (lines.length < 2) {
        notice("CSV needs a header row and at least one data row.", "danger");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = {
        lat: headers.indexOf("lat"),
        lng: headers.indexOf("lng"),
        intensity: headers.indexOf("intensity"),
        amount: headers.indexOf("amount"),
        territoryId: headers.indexOf("territoryid"),
        label: headers.indexOf("label"),
      };
      if (idx.lat < 0 || idx.lng < 0 || idx.intensity < 0) {
        notice("CSV needs at least lat, lng, intensity columns.", "danger");
        return;
      }
      const parsed: Omit<SalesPoint, "id" | "createdAt">[] = [];
      for (const line of lines.slice(1)) {
        const cols = line.split(",");
        const lat = Number(cols[idx.lat]);
        const lng = Number(cols[idx.lng]);
        const intensity = Number(cols[idx.intensity]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(intensity)) continue;
        parsed.push({
          lat,
          lng,
          intensity: Math.max(0, Math.min(100, intensity)),
          amount: idx.amount >= 0 ? Number(cols[idx.amount]) || 0 : 0,
          territoryId: idx.territoryId >= 0 ? cols[idx.territoryId] || undefined : undefined,
          label: idx.label >= 0 ? cols[idx.label] || undefined : undefined,
        });
      }
      if (!parsed.length) {
        notice("No valid hotspots found in the CSV.", "danger");
      } else {
        const added = importPoints(parsed);
        notice(`Imported ${added} hotspots.`, "success");
      }
    } catch (err) {
      console.error(err);
      notice(err instanceof Error ? err.message : "Failed to parse CSV.", "danger");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className={cn("grid gap-4", fullscreen ? "" : "lg:grid-cols-[1fr_360px]")}>
        <Card
          className={cn(
            "overflow-hidden p-0 transition-all",
            fullscreen &&
              "fixed inset-0 z-[900] m-0 w-screen max-w-none rounded-none border-0 shadow-none",
          )}
        >
          <CardContent className="h-full p-0">
            <div
              className={cn(
                "relative w-full",
                fullscreen ? "h-screen" : "h-[64vh] min-h-[500px]",
              )}
            >
              <DynamicMap
                showHeatmap={view === "heatmap"}
                heatPoints={points}
                heatSettings={
                  view === "heatmap"
                    ? settings
                    : { ...settings, showTerritories: true }
                }
                pointPlacing={placing}
                onMapClick={handleMapClick}
                baseLayer={baseLayer}
                showLabels={showLabels}
                highlightOverlaps={highlightOverlaps}
                focusPlace={focusPlace}
              />

              <MapSearch
                countryCode="pk"
                onPick={(target) => {
                  if (target.type === "place") {
                    setFocusPlace({
                      lat: target.lat,
                      lng: target.lng,
                      bounds: target.bounds,
                      label: target.label,
                      tick: Date.now(),
                    });
                  } else if (target.type === "territory") {
                    setFocusPlace(null);
                  }
                }}
              />

              {focusPlace && (
                <button
                  type="button"
                  onClick={() => setFocusPlace(null)}
                  className="pointer-events-auto absolute right-4 top-20 z-[460] inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur transition-colors hover:bg-amber-500/25"
                >
                  <X className="h-3 w-3" />
                  Clear {focusPlace.label ? `“${focusPlace.label}”` : "highlight"}
                </button>
              )}

              <MapToolbar
                baseLayer={baseLayer}
                onBaseLayerChange={setBaseLayer}
                showLabels={showLabels}
                onToggleLabels={() => setShowLabels((v) => !v)}
                highlightOverlaps={highlightOverlaps}
                onToggleOverlaps={() => setHighlightOverlaps((v) => !v)}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((v) => !v)}
                onExport={handleExport}
                onImportClick={handleImportClick}
              />

              <MapLegend showHeatmap={view === "heatmap"} showOverlaps={highlightOverlaps} />

              {placing && (
                <div className="pointer-events-none absolute bottom-20 left-1/2 z-[450] -translate-x-1/2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur animate-fade-in">
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

        {!fullscreen && (
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
        )}
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
