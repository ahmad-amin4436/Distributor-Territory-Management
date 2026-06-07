"use client";

import { useMemo } from "react";
import { MapPin, Pencil, Ruler, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { polygonAreaKm2 } from "@/lib/geo";
import { cn, formatCompact, percent } from "@/lib/utils";
import type { MapFilters } from "@/types";

const variantMap: Record<string, "success" | "info" | "warning" | "danger"> = {
  excellent: "success",
  good: "info",
  average: "warning",
  underperforming: "danger",
};

interface Props {
  onEdit: (id: string) => void;
  filters?: MapFilters;
}

export function TerritorySidebar({ onEdit, filters }: Props) {
  const territories = useTerritoryStore((s) => s.territories);
  const selectedId = useTerritoryStore((s) => s.selectedId);
  const setSelected = useTerritoryStore((s) => s.setSelected);
  const removeTerritory = useTerritoryStore((s) => s.removeTerritory);
  const distributors = useDistributorStore((s) => s.distributors);

  const filtered = useMemo(() => {
    if (!filters) return territories;
    const q = filters.query.trim().toLowerCase();
    return territories.filter((t) => {
      if (filters.performances.length && !filters.performances.includes(t.performance)) return false;
      if (filters.assignmentMode === "assigned" && !t.distributorId) return false;
      if (filters.assignmentMode === "unassigned" && t.distributorId) return false;
      if (q) {
        const d = t.distributorId ? distributors.find((x) => x.id === t.distributorId) : undefined;
        const hay = `${t.name} ${t.coverageArea} ${d?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [territories, filters, distributors]);

  return (
    <div className="space-y-2">
      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {territories.length === 0
            ? "No territories yet — start drawing on the map."
            : "No territories match the current filters."}
        </div>
      )}
      {filtered.map((t) => {
        const d = distributors.find((x) => x.id === t.distributorId);
        const pct = percent(t.monthlySales, t.targetSales);
        const area = polygonAreaKm2(t.coordinates);
        return (
          <div
            role="button"
            tabIndex={0}
            key={t.id}
            onClick={() => setSelected(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(t.id);
              }
            }}
            className={cn(
              "group block w-full cursor-pointer rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedId === t.id
                ? "border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/30 shadow-inner shadow-primary/10"
                : "border-border bg-secondary/30 hover:border-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-7 w-1.5 rounded-full"
                  style={{ background: t.color, boxShadow: `0 0 12px ${t.color}55` }}
                />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{t.coverageArea.split(",")[0]}</span>
                  </div>
                </div>
              </div>
              <Badge variant={variantMap[t.performance]} className="text-[10px]">
                {pct}%
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="truncate">{d?.name ?? "Unassigned"}</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {area.toFixed(1)} km²
                </span>
                <span>{formatCompact(t.monthlySales)}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(t.id);
                  onEdit(t.id);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300"
                onClick={(e) => {
                  e.stopPropagation();
                  // Deleting clears the distributor link server-side and in-store.
                  removeTerritory(t.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
