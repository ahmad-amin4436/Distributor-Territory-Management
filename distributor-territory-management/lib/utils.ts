import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PerformanceStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Compact currency, e.g. "Rs 1.9M". */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function derivePerformance(monthlySales: number, targetSales: number): PerformanceStatus {
  if (!targetSales) return "average";
  const ratio = monthlySales / targetSales;
  if (ratio >= 1) return "excellent";
  if (ratio >= 0.85) return "good";
  if (ratio >= 0.65) return "average";
  return "underperforming";
}
