"use client";

import {
  Building2,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Distributor, Territory } from "@/types";
import { formatCurrency, initials, percent } from "@/lib/utils";

const performanceMap: Record<
  Territory["performance"],
  { label: string; variant: "success" | "warning" | "danger" | "info" }
> = {
  excellent: { label: "Excellent", variant: "success" },
  good: { label: "Good", variant: "info" },
  average: { label: "Average", variant: "warning" },
  underperforming: { label: "Underperforming", variant: "danger" },
};

interface Props {
  territory: Territory;
  distributor?: Distributor;
}

export function TerritoryPopupCard({ territory, distributor }: Props) {
  const target = territory.targetSales || 0;
  const sales = territory.monthlySales || 0;
  const pct = percent(sales, target);
  const status = performanceMap[territory.performance];

  return (
    <div className="w-80 overflow-hidden rounded-xl">
      <div
        className="relative h-20 px-4 py-3 text-white"
        style={{
          background: `linear-gradient(135deg, ${territory.color}cc, ${territory.color}55)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-widest opacity-80">
          {territory.coverageArea.split(",")[0]}
        </div>
        <div className="mt-1 text-base font-semibold">{territory.name}</div>
        <Badge variant={status.variant} className="absolute right-3 top-3 backdrop-blur-sm">
          {status.label}
        </Badge>
      </div>

      <div className="space-y-3 bg-card p-4">
        {distributor ? (
          <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
            <Avatar
              className="h-10 w-10 ring-2 ring-offset-2 ring-offset-card"
              style={{ background: distributor.avatarColor, boxShadow: `0 0 0 2px ${distributor.avatarColor}30` }}
            >
              <AvatarFallback className="bg-transparent text-white text-xs">
                {initials(distributor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{distributor.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono">
                  {distributor.code}
                </span>
                <span className="truncate">{distributor.contactPerson}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-center text-xs text-muted-foreground">
            No distributor assigned yet
          </div>
        )}

        {distributor && (
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="text-foreground">{distributor.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate text-foreground">{distributor.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate text-foreground">{territory.coverageArea}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Monthly Sales
            </div>
            <div className="mt-1 text-base font-semibold">{formatCurrency(sales)}</div>
            <div className="text-[10px] text-muted-foreground">
              vs {formatCurrency(target)}
            </div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Target Coverage
            </div>
            <div className="mt-1 text-base font-semibold">{pct}%</div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Outlets covered
          </span>
          <span className="font-semibold">{territory.outlets}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Population
          </span>
          <span className="font-semibold">{territory.population.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
