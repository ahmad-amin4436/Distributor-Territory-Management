"use client";

import { useMemo, useRef } from "react";
import {
  Download,
  Eraser,
  Eye,
  EyeOff,
  Flame,
  MapPinned,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHeatmapStore } from "@/store/heatmapStore";
import { useTerritoryStore } from "@/store/territoryStore";
import { cn, formatCurrency } from "@/lib/utils";
import type { SalesPoint } from "@/types";

interface Props {
  placing: boolean;
  onTogglePlacing: () => void;
  onEditPoint: (point: SalesPoint) => void;
  onNotice: (msg: string, tone?: "success" | "danger" | "info") => void;
}

function downloadCsv(filename: string, rows: SalesPoint[]) {
  const header = "id,lat,lng,intensity,amount,territoryId,label,createdAt\n";
  const body = rows
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
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const [headerLine, ...rest] = lines;
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const idx = {
    lat: headers.indexOf("lat"),
    lng: headers.indexOf("lng"),
    intensity: headers.indexOf("intensity"),
    amount: headers.indexOf("amount"),
    territoryId: headers.indexOf("territoryid"),
    label: headers.indexOf("label"),
  };
  if (idx.lat < 0 || idx.lng < 0 || idx.intensity < 0) return [];
  const out: Omit<SalesPoint, "id" | "createdAt">[] = [];
  for (const line of rest) {
    const cols = line.split(",");
    const lat = Number(cols[idx.lat]);
    const lng = Number(cols[idx.lng]);
    const intensity = Number(cols[idx.intensity]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(intensity)) continue;
    out.push({
      lat,
      lng,
      intensity: Math.max(0, Math.min(100, intensity)),
      amount: idx.amount >= 0 ? Number(cols[idx.amount]) || 0 : 0,
      territoryId: idx.territoryId >= 0 ? cols[idx.territoryId] || undefined : undefined,
      label: idx.label >= 0 ? cols[idx.label] || undefined : undefined,
    });
  }
  return out;
}

export function HeatmapManager({ placing, onTogglePlacing, onEditPoint, onNotice }: Props) {
  const points = useHeatmapStore((s) => s.points);
  const settings = useHeatmapStore((s) => s.settings);
  const updateSettings = useHeatmapStore((s) => s.updateSettings);
  const resetSettings = useHeatmapStore((s) => s.resetSettings);
  const removePoint = useHeatmapStore((s) => s.removePoint);
  const clearPoints = useHeatmapStore((s) => s.clearPoints);
  const regenerateDemo = useHeatmapStore((s) => s.regenerateDemo);
  const importPoints = useHeatmapStore((s) => s.importPoints);
  const territories = useTerritoryStore((s) => s.territories);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visible = useMemo(
    () =>
      settings.territoryFilter
        ? points.filter((p) => p.territoryId === settings.territoryFilter)
        : points,
    [points, settings.territoryFilter],
  );

  const handleExport = () => {
    if (!visible.length) {
      onNotice("No hotspots to export.", "danger");
      return;
    }
    downloadCsv(`heatmap-${new Date().toISOString().slice(0, 10)}.csv`, visible);
    onNotice(`Exported ${visible.length} hotspots.`, "success");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (!parsed.length) {
        onNotice("CSV needs at least lat,lng,intensity columns.", "danger");
      } else {
        importPoints(parsed);
        onNotice(`Imported ${parsed.length} hotspots.`, "success");
      }
    } catch {
      onNotice("Failed to parse CSV.", "danger");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Heatmap controls
            </div>
            <div className="mt-1 text-sm font-semibold">Visual tuning</div>
          </div>
          <Button size="sm" variant="ghost" onClick={resetSettings} className="h-7 px-2 text-xs">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-[10px]">Radius scale</Label>
              <span className="text-muted-foreground">{settings.radiusScale.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2}
              step={0.05}
              value={settings.radiusScale}
              onChange={(e) => updateSettings({ radiusScale: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-[10px]">Opacity</Label>
              <span className="text-muted-foreground">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-[10px]">High ≥</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.highThreshold}
                onChange={(e) =>
                  updateSettings({
                    highThreshold: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-[10px]">Medium ≥</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.mediumThreshold}
                onChange={(e) =>
                  updateSettings({
                    mediumThreshold: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-[10px]">Filter by territory</Label>
            <Select
              value={settings.territoryFilter ?? "__all__"}
              onValueChange={(v) =>
                updateSettings({ territoryFilter: v === "__all__" ? null : v })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All territories</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ showTerritories: !settings.showTerritories })}
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5"
          >
            <span className="flex items-center gap-1.5">
              {settings.showTerritories ? (
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              Territory polygons
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                settings.showTerritories ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground",
              )}
            >
              {settings.showTerritories ? "Shown" : "Hidden"}
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <MapPinned className="h-3.5 w-3.5 text-indigo-400" />
              Hotspots
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="font-semibold">{visible.length}</span>
              <Badge variant="muted" className="text-[10px]">{points.length} total</Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant={placing ? "secondary" : "gradient"}
            onClick={onTogglePlacing}
            className="h-8"
          >
            {placing ? (
              <>
                <Eraser className="h-3.5 w-3.5" />
                Stop placing
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add on map
              </>
            )}
          </Button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="h-7 px-2 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="h-7 px-2 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={regenerateDemo} className="h-7 px-2 text-xs">
            <RefreshCcw className="h-3.5 w-3.5" />
            Seed demo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!points.length) return;
              clearPoints();
              onNotice("Cleared all hotspots.", "info");
            }}
            className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImport}
        />

        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {visible.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No hotspots yet — click <span className="font-medium text-foreground">Add on map</span> then click the map.
            </div>
          )}
          {visible.map((p) => {
            const tone =
              p.intensity >= settings.highThreshold
                ? "bg-emerald-500"
                : p.intensity >= settings.mediumThreshold
                  ? "bg-amber-400"
                  : "bg-rose-500";
            const territory = p.territoryId ? territories.find((t) => t.id === p.territoryId) : undefined;
            return (
              <div
                key={p.id}
                className="group flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2 text-xs"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_8px_2px]", tone)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {p.label ?? `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}`}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    Intensity {Math.round(p.intensity)} · {formatCurrency(p.amount)}
                    {territory ? ` · ${territory.name}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => onEditPoint(p)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px] text-rose-400 hover:text-rose-300"
                    onClick={() => removePoint(p.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-br from-rose-500/10 via-secondary/30 to-amber-400/5 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Flame className="h-4 w-4 text-rose-400" />
          Tip
        </div>
        <p className="mt-1 text-muted-foreground">
          Toggle <span className="text-foreground">Add on map</span>, then click anywhere on the map to drop a hotspot.
          Tune the bands above to set what counts as high / medium / low sales activity.
        </p>
      </div>
    </div>
  );
}
