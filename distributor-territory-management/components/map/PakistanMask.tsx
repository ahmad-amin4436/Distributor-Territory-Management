"use client";

import { useMemo } from "react";
import { Polygon, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { PAKISTAN_POLYGON } from "@/lib/pakistanBoundary";

// A huge ring covering the world (slightly outside ±90/±180 so Leaflet doesn't
// clip the edges during projection).
const WORLD_RING: LatLngExpression[] = [
  [-89.9, -179.9],
  [89.9, -179.9],
  [89.9, 179.9],
  [-89.9, 179.9],
];

// Flatten Pakistan's MultiPolygon outer rings into the inner-hole rings of the
// mask polygon. Each ring is reversed so Leaflet's even-odd fill cuts a clean
// donut hole at Pakistan's shape.
const HOLES: LatLngExpression[][] = PAKISTAN_POLYGON.map((poly) =>
  // Use only the outer ring of each polygon piece (poly[0]).
  [...poly[0]].reverse() as LatLngExpression[],
);

const MASK_RINGS: LatLngExpression[][] = [WORLD_RING, ...HOLES];

// The visible outline of Pakistan — draw every ring of every polygon piece so
// outer shores AND inner enclaves both get a border line.
const OUTLINE_RINGS: LatLngExpression[][] = PAKISTAN_POLYGON.flatMap(
  (poly) => poly.map((ring) => ring as LatLngExpression[]),
);

interface Props {
  /** Fill colour for the masked area (everything outside Pakistan). */
  fill?: string;
  /** Outline colour of the country border. */
  stroke?: string;
}

export function PakistanMask({ fill = "#0b0f1a", stroke = "rgba(99,102,241,0.55)" }: Props) {
  const positions = useMemo(() => MASK_RINGS, []);
  return (
    <>
      <Polygon
        positions={positions}
        interactive={false}
        pathOptions={{
          stroke: false,
          fillColor: fill,
          fillOpacity: 1,
          fillRule: "evenodd",
        }}
      />
      {OUTLINE_RINGS.map((ring, i) => (
        <Polyline
          key={i}
          positions={ring}
          interactive={false}
          pathOptions={{
            color: stroke,
            weight: 1.2,
            opacity: 0.9,
          }}
        />
      ))}
    </>
  );
}
