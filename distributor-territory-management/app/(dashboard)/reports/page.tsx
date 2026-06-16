"use client";

import { useMemo } from "react";
import { Download, FileText, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesByTerritoryChart } from "@/components/dashboard/SalesByTerritoryChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { DistributorPerformanceChart } from "@/components/dashboard/DistributorPerformanceChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { formatCurrency, percent } from "@/lib/utils";

export default function ReportsPage() {
  const territories = useTerritoryStore((s) => s.territories);
  const distributors = useDistributorStore((s) => s.distributors);

  const rows = useMemo(() => {
    return territories
      .map((t) => {
        const d = distributors.find((x) => x.id === t.distributorId);
        const pct = percent(t.monthlySales, t.targetSales);
        // Derive status from the live % achieved, not the stale DB field.
        const status =
          pct >= 100 ? "excellent"
          : pct >= 85 ? "good"
          : pct >= 65 ? "average"
          : "underperforming";
        return { ...t, distributorName: d?.name ?? "Unassigned", percentToTarget: pct, status };
      })
      .sort((a, b) => b.percentToTarget - a.percentToTarget);
  }, [territories, distributors]);

  const handleExport = () => {
    const header = "Territory,Distributor,Coverage Area,Outlets,Monthly Sales,Target,% to Target,Performance\n";
    const body = rows
      .map((r) =>
        [
          r.name,
          r.distributorName,
          `"${r.coverageArea}"`,
          r.outlets,
          r.monthlySales,
          r.targetSales,
          `${r.percentToTarget}%`,
          r.status,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "territory-performance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports & analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Executive view of territory performance, ready to share with stakeholders.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-400" />
              Monthly sales vs target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distributor performance</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributorPerformanceChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Territory league table</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked by % achievement against monthly target.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Territory</TableHead>
                <TableHead>Distributor</TableHead>
                <TableHead className="text-right">Outlets</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">% Achieved</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.distributorName}</TableCell>
                  <TableCell className="text-right text-sm">{r.outlets}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(r.monthlySales)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatCurrency(r.targetSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto flex w-32 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                          style={{ width: `${Math.min(100, r.percentToTarget)}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-semibold">{r.percentToTarget}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "excellent"
                          ? "success"
                          : r.status === "good"
                            ? "info"
                            : r.status === "average"
                              ? "warning"
                              : "danger"
                      }
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            Revenue distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesByTerritoryChart />
        </CardContent>
      </Card>
    </div>
  );
}
