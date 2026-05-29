import type { MonthlyTrendPoint, SalesPoint } from "@/types";
import { mockTerritories } from "./territories";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function centroid(points: [number, number][]) {
  let lat = 0;
  let lng = 0;
  for (const [a, b] of points) {
    lat += a;
    lng += b;
  }
  return [lat / points.length, lng / points.length] as [number, number];
}

export function generateSalesPoints(): SalesPoint[] {
  const rng = seededRandom(42);
  const points: SalesPoint[] = [];
  mockTerritories.forEach((t, idx) => {
    const [cLat, cLng] = centroid(t.coordinates);
    const count = 16 + Math.floor(rng() * 10);
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = rng() * 0.018;
      const intensity =
        t.performance === "excellent"
          ? 70 + rng() * 30
          : t.performance === "good"
            ? 55 + rng() * 30
            : t.performance === "average"
              ? 35 + rng() * 30
              : 10 + rng() * 30;
      points.push({
        id: `s-${idx}-${i}`,
        lat: cLat + Math.cos(angle) * radius,
        lng: cLng + Math.sin(angle) * radius,
        intensity,
        amount: Math.floor(1500 + rng() * 12000),
        territoryId: t.id,
      });
    }
  });
  return points;
}

export const monthlyTrend: MonthlyTrendPoint[] = [
  { month: "Jan", sales: 1180000, target: 1250000, orders: 4120 },
  { month: "Feb", sales: 1245000, target: 1280000, orders: 4380 },
  { month: "Mar", sales: 1320000, target: 1300000, orders: 4610 },
  { month: "Apr", sales: 1280000, target: 1320000, orders: 4480 },
  { month: "May", sales: 1410000, target: 1380000, orders: 4920 },
  { month: "Jun", sales: 1496000, target: 1450000, orders: 5180 },
  { month: "Jul", sales: 1538000, target: 1500000, orders: 5310 },
  { month: "Aug", sales: 1612000, target: 1540000, orders: 5520 },
  { month: "Sep", sales: 1574000, target: 1580000, orders: 5410 },
  { month: "Oct", sales: 1690000, target: 1620000, orders: 5760 },
  { month: "Nov", sales: 1742000, target: 1700000, orders: 5910 },
  { month: "Dec", sales: 1875000, target: 1800000, orders: 6280 },
];
