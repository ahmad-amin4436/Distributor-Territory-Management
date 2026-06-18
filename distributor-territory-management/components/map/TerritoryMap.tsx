"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvent,
} from "react-leaflet";
import L from "leaflet";
import { DrawControl } from "./DrawControl";
import { HeatLayer } from "./HeatLayer";
import { PakistanMask } from "./PakistanMask";
import { TerritoryPopupCard } from "./TerritoryPopupCard";
import { DEMO_CITY } from "@/mock/distributors";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { centroid, findOverlappingPairs } from "@/lib/geo";
import type {
  BaseLayerId,
  HeatmapSettings,
  LatLng,
  MapFilters,
  SalesPoint,
  Territory,
} from "@/types";

function buildLabelIcon(name: string, color: string) {
  const safeName = name.replace(/[<>]/g, "");
  const html = `<span style="background:${color}cc;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;box-shadow:0 4px 12px rgba(0,0,0,0.4);text-shadow:0 1px 2px rgba(0,0,0,0.6);white-space:nowrap;">${safeName}</span>`;
  return L.divIcon({
    className: "territory-label",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface Props {
  drawing?: boolean;
  showHeatmap?: boolean;
  heatPoints?: SalesPoint[];
  heatSettings?: HeatmapSettings;
  onDraftCreated?: (coords: LatLng[]) => void;
  onDrawUndoReady?: (undo: (() => void) | null) => void;
  onDrawVertexCountChange?: (count: number) => void;
  onTerritoryClick?: (id: string) => void;
  focusTerritoryId?: string | null;
  height?: string;
  filters?: MapFilters;
  baseLayer?: BaseLayerId;
  showLabels?: boolean;
  highlightOverlaps?: boolean;
  pointPlacing?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  focusPlace?: {
    lat: number;
    lng: number;
    bounds?: [LatLng, LatLng];
    label?: string;
    tick: number;
  } | null;
}

function MapClickHandler({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvent("click", (e) => {
    if (!enabled) return;
    onClick(e.latlng.lat, e.latlng.lng);
  });
  return null;
}

// Pakistan bounding box (with a small buffer). Used to clamp panning and
// prevent zooming out to the rest of the world.
const PAKISTAN_BOUNDS = L.latLngBounds(
  L.latLng(23.0, 60.5),
  L.latLng(37.5, 78.0),
);
const PAKISTAN_MIN_ZOOM = 5;
const PAKISTAN_MAX_ZOOM = 18;

const BASE_LAYERS: Record<BaseLayerId, { url: string; dark: boolean }> = {
  dark: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: true,
  },
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: false,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    dark: false,
  },
};

function FocusController({
  territory,
  focusTick,
}: {
  territory?: Territory | null;
  focusTick: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!territory) return;
    const bounds = L.latLngBounds(territory.coordinates.map(([lat, lng]) => L.latLng(lat, lng)));
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [60, 60], duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territory?.id, focusTick, map]);
  return null;
}

function FocusPlaceController({
  target,
}: {
  target?: {
    lat: number;
    lng: number;
    bounds?: [LatLng, LatLng];
    label?: string;
    tick: number;
  } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    if (target.bounds) {
      const b = L.latLngBounds(
        L.latLng(target.bounds[0][0], target.bounds[0][1]),
        L.latLng(target.bounds[1][0], target.bounds[1][1]),
      );
      if (b.isValid()) {
        map.flyToBounds(b, { padding: [60, 60], duration: 0.6 });
        return;
      }
    }
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.tick, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    let disposed = false;
    let rafId = 0;

    const safeInvalidate = () => {
      if (disposed) return;
      // Leaflet may have cleared internal state during unmount/teardown.
      const container = map.getContainer?.();
      if (!container || !container.isConnected) return;
      try {
        map.invalidateSize(false);
      } catch {
        // Swallow: Leaflet sometimes races teardown of internal panes.
      }
    };

    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(safeInvalidate);
    };

    window.addEventListener("resize", schedule);
    const initial = window.setTimeout(safeInvalidate, 80);

    const container = map.getContainer();
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    if (container.parentElement) observer.observe(container.parentElement);

    return () => {
      disposed = true;
      window.removeEventListener("resize", schedule);
      window.clearTimeout(initial);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

export function TerritoryMap({
  drawing = false,
  showHeatmap = false,
  heatPoints = [],
  heatSettings,
  onDraftCreated,
  onDrawUndoReady,
  onDrawVertexCountChange,
  onTerritoryClick,
  focusTerritoryId,
  height = "100%",
  filters,
  baseLayer = "dark",
  showLabels = true,
  highlightOverlaps = false,
  pointPlacing = false,
  onMapClick,
  focusPlace,
}: Props) {
  const territories = useTerritoryStore((s) => s.territories);
  const draft = useTerritoryStore((s) => s.draft);
  const selectedId = useTerritoryStore((s) => s.selectedId);
  const focusTick = useTerritoryStore((s) => s.focusTick);
  const setSelected = useTerritoryStore((s) => s.setSelected);
  const distributors = useDistributorStore((s) => s.distributors);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const distributorMap = useMemo(
    () => Object.fromEntries(distributors.map((d) => [d.id, d])),
    [distributors],
  );

  const filteredTerritories = useMemo(() => {
    if (!filters) return territories;
    const q = filters.query.trim().toLowerCase();
    return territories.filter((t) => {
      if (filters.performances.length && !filters.performances.includes(t.performance)) return false;
      if (filters.assignmentMode === "assigned" && !t.distributorId) return false;
      if (filters.assignmentMode === "unassigned" && t.distributorId) return false;
      if (q) {
        const d = t.distributorId ? distributorMap[t.distributorId] : undefined;
        const hay = `${t.name} ${t.coverageArea} ${d?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [territories, filters, distributorMap]);

  const visibleIds = useMemo(
    () => new Set(filteredTerritories.map((t) => t.id)),
    [filteredTerritories],
  );

  const overlapPairs = useMemo(
    () => (highlightOverlaps ? findOverlappingPairs(filteredTerritories) : []),
    [highlightOverlaps, filteredTerritories],
  );

  const overlapIds = useMemo(() => {
    const set = new Set<string>();
    overlapPairs.forEach((p) => {
      set.add(p.a.id);
      set.add(p.b.id);
    });
    return set;
  }, [overlapPairs]);

  const focusTerritory =
    territories.find((t) => t.id === focusTerritoryId) ||
    territories.find((t) => t.id === selectedId);

  const layer = BASE_LAYERS[baseLayer];

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl"
      style={{ height }}
      data-base-layer={baseLayer}
      data-point-placing={pointPlacing ? "true" : undefined}
    >
      <MapContainer
        center={DEMO_CITY.center}
        zoom={DEMO_CITY.zoom}
        minZoom={PAKISTAN_MIN_ZOOM}
        maxZoom={PAKISTAN_MAX_ZOOM}
        maxBounds={PAKISTAN_BOUNDS}
        maxBoundsViscosity={1}
        worldCopyJump={false}
        zoomControl
        scrollWheelZoom
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={baseLayer}
          url={layer.url}
          bounds={PAKISTAN_BOUNDS}
          noWrap
          minZoom={PAKISTAN_MIN_ZOOM}
          maxZoom={PAKISTAN_MAX_ZOOM}
        />

        <PakistanMask fill={layer.dark ? "#0b0f1a" : "#1a2030"} />

        {showHeatmap && <HeatLayer points={heatPoints} settings={heatSettings} />}
        <MapClickHandler enabled={pointPlacing && !!onMapClick} onClick={(lat, lng) => onMapClick?.(lat, lng)} />

        {heatSettings?.showTerritories === false ? null : filteredTerritories.map((t) => {
          const distributor = t.distributorId ? distributorMap[t.distributorId] : undefined;
          const isHover = hoverId === t.id;
          const isSelected = selectedId === t.id;
          const hasOverlap = overlapIds.has(t.id);
          const dimmed =
            !!filters &&
            visibleIds.size > 0 &&
            visibleIds.size < territories.length &&
            !visibleIds.has(t.id);
          if (dimmed) return null;
          return (
            <Polygon
              key={t.id}
              positions={t.coordinates}
              pathOptions={{
                color: hasOverlap ? "#f97316" : t.color,
                weight: isSelected ? 3.5 : hasOverlap ? 3 : 2,
                fillColor: t.color,
                fillOpacity: isHover ? 0.5 : isSelected ? 0.4 : 0.22,
                dashArray: hasOverlap ? "6 4" : undefined,
              }}
              eventHandlers={{
                mouseover: () => setHoverId(t.id),
                mouseout: () => setHoverId(null),
                click: () => {
                  setSelected(t.id);
                  onTerritoryClick?.(t.id);
                },
              }}
            >
              <Tooltip direction="top" sticky offset={[0, -8]}>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {distributor?.name ?? "Unassigned"}
                  </div>
                  {hasOverlap && (
                    <div className="text-[10px] text-amber-300">⚠ Overlaps another territory</div>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <TerritoryPopupCard territory={t} distributor={distributor} />
              </Popup>
            </Polygon>
          );
        })}

        {showLabels && heatSettings?.showTerritories !== false &&
          filteredTerritories.map((t) => {
            if (
              filters &&
              visibleIds.size > 0 &&
              visibleIds.size < territories.length &&
              !visibleIds.has(t.id)
            ) {
              return null;
            }
            const center = centroid(t.coordinates);
            return (
              <Marker
                key={`label-${t.id}`}
                position={center}
                interactive={false}
                keyboard={false}
                icon={buildLabelIcon(t.name, t.color)}
              />
            );
          })}

        {draft && draft.coordinates.length >= 3 && (
          <Polygon
            positions={draft.coordinates}
            pathOptions={{
              color: draft.color,
              weight: 3,
              dashArray: "8 6",
              fillColor: draft.color,
              fillOpacity: 0.2,
            }}
          />
        )}

        {draft && draft.coordinates.length === 2 && (
          <Polyline
            positions={draft.coordinates}
            pathOptions={{ color: draft.color, weight: 3, dashArray: "6 6" }}
          />
        )}

        {drawing && onDraftCreated && (
          <DrawControl
            enabled={drawing}
            onShapeCreated={onDraftCreated}
            onUndoReady={onDrawUndoReady}
            onVertexCountChange={onDrawVertexCountChange}
          />
        )}

        <FocusController territory={focusTerritory} focusTick={focusTick} />
        <FocusPlaceController target={focusPlace} />

        {focusPlace && focusPlace.bounds && (
          <Rectangle
            bounds={[focusPlace.bounds[0], focusPlace.bounds[1]]}
            pathOptions={{
              color: "#f59e0b",
              weight: 3,
              dashArray: "8 6",
              fillColor: "#f59e0b",
              fillOpacity: 0.08,
            }}
          >
            {focusPlace.label && (
              <Tooltip direction="top" sticky offset={[0, -4]}>
                <span className="text-xs font-semibold">{focusPlace.label}</span>
              </Tooltip>
            )}
          </Rectangle>
        )}

        {focusPlace && (
          <>
            <CircleMarker
              center={[focusPlace.lat, focusPlace.lng]}
              radius={14}
              pathOptions={{
                color: "#f59e0b",
                weight: 2,
                fillColor: "#f59e0b",
                fillOpacity: 0.25,
              }}
            />
            <CircleMarker
              center={[focusPlace.lat, focusPlace.lng]}
              radius={5}
              pathOptions={{
                color: "#fbbf24",
                weight: 2,
                fillColor: "#fbbf24",
                fillOpacity: 1,
              }}
            >
              {focusPlace.label && !focusPlace.bounds && (
                <Tooltip direction="top" offset={[0, -6]}>
                  <span className="text-xs font-semibold">{focusPlace.label}</span>
                </Tooltip>
              )}
            </CircleMarker>
          </>
        )}
        <MapResizer />
      </MapContainer>
    </div>
  );
}

export default TerritoryMap;
