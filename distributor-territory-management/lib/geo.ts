import type { LatLng, Territory } from "@/types";

const EARTH_RADIUS_M = 6378137;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function polygonAreaSqMeters(coords: LatLng[]): number {
  if (coords.length < 3) return 0;
  let total = 0;
  for (let i = 0, len = coords.length; i < len; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % len];
    total +=
      toRad(lng2 - lng1) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return (Math.abs(total) * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

export function polygonAreaKm2(coords: LatLng[]): number {
  return polygonAreaSqMeters(coords) / 1_000_000;
}

export function centroid(coords: LatLng[]): LatLng {
  if (!coords.length) return [0, 0];
  let lat = 0;
  let lng = 0;
  for (const [a, b] of coords) {
    lat += a;
    lng += b;
  }
  return [lat / coords.length, lng / coords.length];
}

export function bounds(coords: LatLng[]): { south: number; west: number; north: number; east: number } {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
}

export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersect) inside = !inside;
  }
  return inside;
}

function segmentsIntersect(a: LatLng, b: LatLng, c: LatLng, d: LatLng) {
  const ccw = (p: LatLng, q: LatLng, r: LatLng) =>
    (r[0] - p[0]) * (q[1] - p[1]) - (q[0] - p[0]) * (r[1] - p[1]);
  const d1 = ccw(c, d, a);
  const d2 = ccw(c, d, b);
  const d3 = ccw(a, b, c);
  const d4 = ccw(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function polygonsOverlap(a: LatLng[], b: LatLng[]): boolean {
  if (a.length < 3 || b.length < 3) return false;
  // Containment in either direction.
  if (a.some((p) => pointInPolygon(p, b))) return true;
  if (b.some((p) => pointInPolygon(p, a))) return true;
  // Edge intersections.
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export interface OverlapPair {
  a: Territory;
  b: Territory;
}

export function findOverlappingPairs(territories: Territory[]): OverlapPair[] {
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < territories.length; i++) {
    for (let j = i + 1; j < territories.length; j++) {
      if (polygonsOverlap(territories[i].coordinates, territories[j].coordinates)) {
        pairs.push({ a: territories[i], b: territories[j] });
      }
    }
  }
  return pairs;
}

// --- GeoJSON ---

export interface TerritoryGeoJson {
  type: "FeatureCollection";
  generator: "TerritoryOS";
  exportedAt: string;
  features: TerritoryFeature[];
}

export interface TerritoryFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    coverageArea: string;
    notes?: string;
    color: string;
    distributorId?: string;
    monthlySales: number;
    targetSales: number;
    performance: Territory["performance"];
    outlets: number;
    createdAt: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
}

export function territoriesToGeoJson(territories: Territory[]): TerritoryGeoJson {
  return {
    type: "FeatureCollection",
    generator: "TerritoryOS",
    exportedAt: new Date().toISOString(),
    features: territories.map((t) => ({
      type: "Feature",
      properties: {
        id: t.id,
        name: t.name,
        coverageArea: t.coverageArea,
        notes: t.notes,
        color: t.color,
        distributorId: t.distributorId,
        monthlySales: t.monthlySales,
        targetSales: t.targetSales,
        performance: t.performance,
        outlets: t.outlets,
        createdAt: t.createdAt,
      },
      geometry: {
        type: "Polygon",
        // GeoJSON uses [lng, lat] order, and rings must close (first === last).
        coordinates: [
          [...t.coordinates.map(([lat, lng]) => [lng, lat] as [number, number]), [
            t.coordinates[0][1],
            t.coordinates[0][0],
          ] as [number, number]],
        ],
      },
    })),
  };
}

function isFiniteCoord(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export interface ImportedTerritory {
  name: string;
  coverageArea: string;
  notes?: string;
  color?: string;
  coordinates: LatLng[];
  distributorId?: string;
}

export function geoJsonToTerritories(raw: unknown): ImportedTerritory[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid GeoJSON: not an object.");
  }
  const data = raw as { type?: string; features?: unknown };
  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Invalid GeoJSON: expected a FeatureCollection.");
  }
  const out: ImportedTerritory[] = [];
  data.features.forEach((feature, index) => {
    if (!feature || typeof feature !== "object") return;
    const f = feature as {
      properties?: Record<string, unknown>;
      geometry?: { type?: string; coordinates?: unknown };
    };
    if (!f.geometry || f.geometry.type !== "Polygon") return;
    const ring = (f.geometry.coordinates as unknown[])?.[0];
    if (!Array.isArray(ring)) return;

    const coords: LatLng[] = [];
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const [lng, lat] = pt;
      if (isFiniteCoord(lat) && isFiniteCoord(lng)) coords.push([lat, lng]);
    }
    if (coords.length < 3) return;
    // Drop the closing duplicate, if present.
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) coords.pop();
    if (coords.length < 3) return;

    const props = (f.properties ?? {}) as Record<string, unknown>;
    out.push({
      name: typeof props.name === "string" ? props.name : `Imported ${index + 1}`,
      coverageArea: typeof props.coverageArea === "string" ? props.coverageArea : "Imported area",
      notes: typeof props.notes === "string" ? props.notes : undefined,
      color: typeof props.color === "string" ? props.color : undefined,
      coordinates: coords,
      distributorId: typeof props.distributorId === "string" ? props.distributorId : undefined,
    });
  });
  return out;
}

export function downloadJson(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/geo+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
