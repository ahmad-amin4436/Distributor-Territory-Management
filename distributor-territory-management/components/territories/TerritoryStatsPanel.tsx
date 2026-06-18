"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Compass,
  Flag,
  Globe2,
  Map as MapIcon,
  Ruler,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import {
  findOverlappingPairs,
  PAKISTAN_TOTAL_AREA_KM2,
  polygonAreaKm2,
} from "@/lib/geo";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils";

const performanceColor: Record<string, string> = {
  excellent: "#22c55e",
  good: "#06b6d4",
  average: "#f59e0b",
  underperforming: "#ef4444",
};

export function TerritoryStatsPanel() {
  const territories = useTerritoryStore((s) => s.territories);
  const distributors = useDistributorStore((s) => s.distributors);

  const stats = useMemo(() => {
    const coveredArea = territories.reduce(
      (acc, t) => acc + polygonAreaKm2(t.coordinates),
      0,
    );
    const totalCountryArea = PAKISTAN_TOTAL_AREA_KM2;
    const remainingArea = Math.max(0, totalCountryArea - coveredArea);
    const coveragePct = totalCountryArea
      ? Math.min(100, (coveredArea / totalCountryArea) * 100)
      : 0;

    const totalSales = territories.reduce((acc, t) => acc + t.monthlySales, 0);
    const totalTarget = territories.reduce((acc, t) => acc + t.targetSales, 0);
    const totalOutlets = territories.reduce((acc, t) => acc + t.outlets, 0);
    const assigned = territories.filter((t) => !!t.distributorId).length;
    const unassigned = territories.length - assigned;
    const buckets = territories.reduce<Record<string, number>>(
      (acc, t) => ({ ...acc, [t.performance]: (acc[t.performance] ?? 0) + 1 }),
      {},
    );
    const overlaps = findOverlappingPairs(territories);
    const avgArea = territories.length ? coveredArea / territories.length : 0;
    const attainment = totalTarget ? Math.round((totalSales / totalTarget) * 100) : 0;
    const activeDistributors = distributors.filter((d) => d.status === "active").length;
    return {
      coveredArea,
      totalCountryArea,
      remainingArea,
      coveragePct,
      totalSales,
      totalTarget,
      totalOutlets,
      assigned,
      unassigned,
      buckets,
      overlaps,
      avgArea,
      attainment,
      activeDistributors,
    };
  }, [territories, distributors]);

  const tiles = [
    {
      label: "Total coverage area",
      icon: Ruler,
      value: `${formatNumber(Math.round(stats.coveredArea))} km²`,
      hint: `Avg ${stats.avgArea.toFixed(1)} km² per territory`,
      accent: "#6366f1",
    },
    {
      label: "Pakistan total",
      icon: Globe2,
      value: `${formatNumber(stats.totalCountryArea)} km²`,
      hint: "Includes AJK, Gilgit-Baltistan & J&K",
      accent: "#22c55e",
    },
    {
      label: "Remaining area",
      icon: Flag,
      value: `${formatNumber(Math.round(stats.remainingArea))} km²`,
      hint: `${(100 - stats.coveragePct).toFixed(1)}% of Pakistan uncovered`,
      accent: "#f59e0b",
    },
    {
      label: "Monthly revenue",
      icon: Wallet,
      value: formatCurrency(stats.totalSales),
      hint: `Target ${formatCompact(stats.totalTarget)} · ${stats.attainment}% attained`,
      accent: "#a855f7",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Compass className="h-3.5 w-3.5 text-indigo-400" />
              Territory intelligence
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              Network overview
            </div>
          </div>
          <Badge variant="muted">{territories.length} zones</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {tiles.map(({ label, icon: Icon, value, hint, accent }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl"
                style={{ background: accent }}
              />
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                {label}
              </div>
              <div className="mt-1 text-base font-semibold tracking-tight">{value}</div>
              <div className="text-[11px] text-muted-foreground">{hint}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Pakistan coverage</span>
            <span className="font-semibold text-foreground">
              {stats.coveragePct.toFixed(2)}%
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-secondary/60">
            <span
              className="block bg-gradient-to-r from-indigo-500 to-teal-400"
              style={{ width: `${stats.coveragePct}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" />
              <span className="text-muted-foreground">Covered</span>
              <span className="ml-auto font-semibold">
                {formatNumber(Math.round(stats.coveredArea))} km²
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary/60 ring-1 ring-border" />
              <span className="text-muted-foreground">Remaining</span>
              <span className="ml-auto font-semibold">
                {formatNumber(Math.round(stats.remainingArea))} km²
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Performance mix</span>
            <span>{territories.length} total</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-secondary/60">
            {(["excellent", "good", "average", "underperforming"] as const).map((key) => {
              const count = stats.buckets[key] ?? 0;
              if (!count) return null;
              const pct = (count / Math.max(1, territories.length)) * 100;
              return (
                <span
                  key={key}
                  title={`${key}: ${count}`}
                  style={{ width: `${pct}%`, background: performanceColor[key] }}
                />
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            {(["excellent", "good", "average", "underperforming"] as const).map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: performanceColor[key] }}
                />
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="ml-auto font-semibold">{stats.buckets[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              Distributor coverage
            </span>
            <span className="font-semibold">
              {stats.activeDistributors} active · {Math.round((stats.assigned / Math.max(1, territories.length)) * 100)}% mapped
            </span>
          </div>

          {stats.overlaps.length > 0 ? (
            <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                {stats.overlaps.length} overlap{stats.overlaps.length === 1 ? "" : "s"} detected
              </div>
              <ul className="space-y-0.5 text-[11px] text-amber-100/80">
                {stats.overlaps.slice(0, 3).map((p) => (
                  <li key={`${p.a.id}-${p.b.id}`} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    {p.a.name} <span className="opacity-60">↔</span> {p.b.name}
                  </li>
                ))}
                {stats.overlaps.length > 3 && (
                  <li className="opacity-70">+ {stats.overlaps.length - 3} more…</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <MapIcon className="h-3.5 w-3.5" />
              No overlaps detected — coverage is clean.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
