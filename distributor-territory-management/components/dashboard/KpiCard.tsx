"use client";

import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, delta, hint, icon: Icon, accent = "#6366f1" }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="gradient-border relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-3xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div
          className="grid h-10 w-10 place-items-center rounded-lg border border-border"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
            positive
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400",
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? "+" : ""}
          {delta}% vs last month
        </div>
      )}
    </Card>
  );
}
