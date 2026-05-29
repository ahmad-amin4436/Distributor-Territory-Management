"use client";

import { Circle } from "react-leaflet";
import type { SalesPoint } from "@/types";

function colorFor(intensity: number) {
  if (intensity >= 65) return { fill: "#22c55e", stroke: "#16a34a" };
  if (intensity >= 40) return { fill: "#facc15", stroke: "#ca8a04" };
  return { fill: "#ef4444", stroke: "#b91c1c" };
}

export function HeatLayer({ points }: { points: SalesPoint[] }) {
  return (
    <>
      {points.map((p) => {
        const c = colorFor(p.intensity);
        const radius = 110 + p.intensity * 4;
        return (
          <Circle
            key={p.id}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color: c.stroke,
              weight: 0,
              fillColor: c.fill,
              fillOpacity: 0.22 + (p.intensity / 100) * 0.18,
            }}
          />
        );
      })}
    </>
  );
}
