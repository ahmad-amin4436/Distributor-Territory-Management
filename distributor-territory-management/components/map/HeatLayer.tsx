"use client";

import { Circle, Tooltip } from "react-leaflet";
import type { HeatmapSettings, SalesPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  points: SalesPoint[];
  settings?: HeatmapSettings;
}

const DEFAULTS: HeatmapSettings = {
  radiusScale: 1,
  opacity: 0.4,
  highThreshold: 65,
  mediumThreshold: 40,
  showTerritories: true,
  territoryFilter: null,
};

function colorFor(intensity: number, high: number, medium: number) {
  if (intensity >= high) return { fill: "#22c55e", stroke: "#16a34a" };
  if (intensity >= medium) return { fill: "#facc15", stroke: "#ca8a04" };
  return { fill: "#ef4444", stroke: "#b91c1c" };
}

export function HeatLayer({ points, settings = DEFAULTS }: Props) {
  const filtered = settings.territoryFilter
    ? points.filter((p) => p.territoryId === settings.territoryFilter)
    : points;
  return (
    <>
      {filtered.map((p) => {
        const c = colorFor(p.intensity, settings.highThreshold, settings.mediumThreshold);
        const radius = (110 + p.intensity * 4) * settings.radiusScale;
        const fillOpacity = Math.min(1, settings.opacity * (0.6 + p.intensity / 200));
        return (
          <Circle
            key={p.id}
            center={[p.lat, p.lng]}
            radius={radius}
            pathOptions={{
              color: c.stroke,
              weight: 0,
              fillColor: c.fill,
              fillOpacity,
            }}
          >
            <Tooltip direction="top" sticky offset={[0, -4]}>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold">
                  {p.label ?? "Sales hotspot"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Intensity {Math.round(p.intensity)} · {formatCurrency(p.amount)}
                </div>
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}
