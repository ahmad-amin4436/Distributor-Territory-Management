"use client";

import { Filter, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MapFilters, PerformanceStatus } from "@/types";

const performanceOptions: { key: PerformanceStatus; label: string; color: string }[] = [
  { key: "excellent", label: "Excellent", color: "#22c55e" },
  { key: "good", label: "Good", color: "#06b6d4" },
  { key: "average", label: "Average", color: "#f59e0b" },
  { key: "underperforming", label: "Underperforming", color: "#ef4444" },
];

const assignmentOptions: { key: MapFilters["assignmentMode"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "assigned", label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
];

interface Props {
  filters: MapFilters;
  onChange: (next: MapFilters) => void;
  total: number;
  visible: number;
}

export function MapFilterBar({ filters, onChange, total, visible }: Props) {
  const togglePerformance = (key: PerformanceStatus) => {
    const next = filters.performances.includes(key)
      ? filters.performances.filter((p) => p !== key)
      : [...filters.performances, key];
    onChange({ ...filters, performances: next });
  };

  const hasActiveFilters =
    filters.query.length > 0 ||
    filters.performances.length > 0 ||
    filters.assignmentMode !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 backdrop-blur sm:flex-row sm:items-center sm:gap-2">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search territory, area, distributor…"
          className="h-9 pl-9 text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3 w-3" />
          Performance
        </span>
        {performanceOptions.map((opt) => {
          const active = filters.performances.includes(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => togglePerformance(opt.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: opt.color }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Users className="h-3 w-3" />
          Coverage
        </span>
        {assignmentOptions.map((opt) => {
          const active = filters.assignmentMode === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange({ ...filters, assignmentMode: opt.key })}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <Badge variant="muted" className="ml-auto self-center text-[10px]">
        {visible} / {total} visible
      </Badge>

      {hasActiveFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-[11px]"
          onClick={() => onChange({ query: "", performances: [], assignmentMode: "all" })}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
