"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { formatCurrency, initials, percent } from "@/lib/utils";

const variantMap: Record<string, "success" | "info" | "warning" | "danger"> = {
  excellent: "success",
  good: "info",
  average: "warning",
  underperforming: "danger",
};

export function RecentTerritoriesList() {
  const territories = useTerritoryStore((s) => s.territories);
  const distributors = useDistributorStore((s) => s.distributors);
  const rows = [...territories]
    .sort((a, b) => b.monthlySales - a.monthlySales)
    .slice(0, 6);

  return (
    <div className="space-y-2">
      {rows.map((t) => {
        const d = distributors.find((x) => x.id === t.distributorId);
        const pct = percent(t.monthlySales, t.targetSales);
        return (
          <Link
            href={`/territories?focus=${t.id}`}
            key={t.id}
            className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-primary/40 hover:bg-secondary/60"
          >
            <span
              className="h-9 w-1.5 rounded-full"
              style={{ background: t.color, boxShadow: `0 0 12px ${t.color}55` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">{t.name}</span>
                <Badge variant={variantMap[t.performance]} className="text-[10px]">
                  {t.performance}
                </Badge>
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {d?.name ?? "Unassigned"} · {t.outlets} outlets
              </div>
            </div>
            {d && (
              <Avatar className="h-8 w-8" style={{ background: d.avatarColor }}>
                <AvatarFallback className="bg-transparent text-[10px] text-white">
                  {initials(d.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold">{formatCurrency(t.monthlySales)}</div>
              <div className="text-[10px] text-muted-foreground">{pct}% of target</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        );
      })}
    </div>
  );
}
