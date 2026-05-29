"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Building2,
  Map as MapIcon,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesByTerritoryChart } from "@/components/dashboard/SalesByTerritoryChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { DistributorPerformanceChart } from "@/components/dashboard/DistributorPerformanceChart";
import { RecentTerritoriesList } from "@/components/dashboard/RecentTerritoriesList";
import { DynamicMap } from "@/components/map/DynamicMap";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { useAuthStore } from "@/store/authStore";
import { formatCompact, formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const territories = useTerritoryStore((s) => s.territories);
  const distributors = useDistributorStore((s) => s.distributors);
  const user = useAuthStore((s) => s.user);

  const stats = useMemo(() => {
    const monthlySales = territories.reduce((sum, t) => sum + t.monthlySales, 0);
    const target = territories.reduce((sum, t) => sum + t.targetSales, 0);
    const active = distributors.filter((d) => d.status === "active").length;
    const outlets = territories.reduce((sum, t) => sum + t.outlets, 0);
    const top = [...territories].sort((a, b) => b.monthlySales - a.monthlySales)[0];
    return { monthlySales, target, active, outlets, top };
  }, [territories, distributors]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Welcome back, {user?.name?.split(" ")[0] ?? "Operator"}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Territory command centre
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot of distributor coverage and field sales across {territories.length} active zones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/sales">
              View heatmap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/territories">
              Draw new territory
              <MapIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total territories"
          value={String(territories.length)}
          delta={12}
          hint={`${stats.outlets} outlets covered`}
          icon={MapIcon}
          accent="#6366f1"
        />
        <KpiCard
          label="Active distributors"
          value={String(stats.active)}
          delta={6}
          hint={`${distributors.length - stats.active} pending / inactive`}
          icon={Building2}
          accent="#22c55e"
        />
        <KpiCard
          label="Monthly sales"
          value={formatCurrency(stats.monthlySales)}
          delta={9}
          hint={`Target ${formatCompact(stats.target)}`}
          icon={Wallet}
          accent="#f59e0b"
        />
        <KpiCard
          label="Top territory"
          value={stats.top?.name ?? "—"}
          hint={stats.top ? `${formatCurrency(stats.top.monthlySales)} this month` : ""}
          icon={Target}
          accent="#ec4899"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Live territory map</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Click any territory to drill into distributor performance.
              </p>
            </div>
            <Badge variant="info" className="hidden md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_2px] shadow-teal-400/60" />
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[460px]">
              <DynamicMap />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top performing territories</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sorted by month-to-date revenue.
            </p>
          </CardHeader>
          <CardContent>
            <RecentTerritoriesList />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Monthly sales trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sales vs target across the last 12 months.
            </p>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distributor performance</CardTitle>
            <p className="text-sm text-muted-foreground">% of target achieved</p>
          </CardHeader>
          <CardContent>
            <DistributorPerformanceChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales by territory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution of revenue across active zones.
          </p>
        </CardHeader>
        <CardContent>
          <SalesByTerritoryChart />
        </CardContent>
      </Card>
    </div>
  );
}
