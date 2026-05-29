"use client";

import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";

const performanceLegend = [
  { key: "excellent", label: "Excellent", color: "#22c55e" },
  { key: "good", label: "Good", color: "#06b6d4" },
  { key: "average", label: "Average", color: "#f59e0b" },
  { key: "underperforming", label: "Underperforming", color: "#ef4444" },
];

interface Props {
  showHeatmap?: boolean;
  showOverlaps?: boolean;
}

export function MapLegend({ showHeatmap, showOverlaps }: Props) {
  const territories = useTerritoryStore((s) => s.territories);
  const setSelected = useTerritoryStore((s) => s.setSelected);
  const distributors = useDistributorStore((s) => s.distributors);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 z-[450] w-72 overflow-hidden rounded-xl border border-border bg-card/85 text-xs shadow-2xl shadow-black/40 backdrop-blur transition-all",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold uppercase tracking-wider text-foreground">
          {collapsed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          Map legend
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
        />
      </button>
      {!collapsed && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Territories ({territories.length})
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
              {territories.length === 0 && (
                <div className="text-muted-foreground">No territories yet.</div>
              )}
              {territories.map((t) => {
                const d = t.distributorId
                  ? distributors.find((x) => x.id === t.distributorId)
                  : undefined;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ background: t.color, boxShadow: `0 0 10px ${t.color}80` }}
                    />
                    <span className="min-w-0 truncate text-foreground">{t.name}</span>
                    <span className="ml-auto truncate text-[10px] text-muted-foreground">
                      {d?.name?.split(" ")[0] ?? "Unassigned"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Performance bands
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {performanceLegend.map((p) => (
                <div key={p.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: p.color, boxShadow: `0 0 8px ${p.color}80` }}
                  />
                  <span className="text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          {showHeatmap && (
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Sales activity
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" />
                  High
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px] shadow-amber-400/60" />
                  Medium
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px] shadow-rose-500/60" />
                  Low
                </div>
              </div>
            </div>
          )}
          {showOverlaps && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-amber-300">
              <span className="h-2 w-2 rounded-full border-2 border-amber-300 bg-transparent" />
              <span>Dashed orange outline = overlap detected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
