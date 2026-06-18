"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet-draw";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/types";

interface Props {
  enabled: boolean;
  onShapeCreated: (latlngs: LatLng[]) => void;
  /** Receives an imperative undo() (pop last point) callback while drawing, or null when idle. */
  onUndoReady?: (undo: (() => void) | null) => void;
  /** Notified each time the in-progress vertex count changes (0 when idle). */
  onVertexCountChange?: (count: number) => void;
}

export function DrawControl({
  enabled,
  onShapeCreated,
  onUndoReady,
  onVertexCountChange,
}: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) {
      onUndoReady?.(null);
      onVertexCountChange?.(0);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LD = L as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let drawer: any = null;
    try {
      drawer = new LD.Draw.Polygon(map, {
        // Must be true: the country-mask polygon adds segments that Leaflet
        // Draw otherwise treats as intersections, silently rejecting clicks.
        allowIntersection: true,
        showArea: false,
        shapeOptions: {
          color: "#6366f1",
          weight: 3,
          opacity: 1,
          fillColor: "#6366f1",
          fillOpacity: 0.2,
          dashArray: "6 6",
        },
        guidelineDistance: 12,
      });
      drawer?.enable();
    } catch (err) {
      console.error("Failed to start polygon draw", err);
    }

    const reportCount = () => {
      const n: number = drawer?._markers?.length ?? 0;
      onVertexCountChange?.(n);
    };

    const undoLast = () => {
      try {
        drawer?.deleteLastVertex?.();
        reportCount();
      } catch (err) {
        console.error("undo failed", err);
      }
    };
    onUndoReady?.(undoLast);

    // Snapshot existing vertex positions, reset the drawer, and re-feed every
    // point except the one being removed. This is the most reliable way to
    // delete an arbitrary vertex from a Leaflet.draw in-progress polygon.
    const removeVertexAt = (index: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markers: any[] = drawer?._markers ?? [];
      if (index < 0 || index >= markers.length) return;
      const remaining = markers
        .map((m, i) => (i === index ? null : (m.getLatLng() as L.LatLng)))
        .filter((p): p is L.LatLng => !!p);
      try {
        // Tear down and rebuild the drawer with the remaining points.
        drawer.disable();
        drawer.enable();
        for (const ll of remaining) {
          // _markers gets reset; addVertex is the official internal helper
          // used by leaflet.draw's own click handler.
          drawer.addVertex?.(ll);
        }
      } catch (err) {
        console.error("vertex removal failed", err);
      }
      reportCount();
    };

    // Wire each marker that gets added so clicking it removes the vertex.
    const attachMarkerClick = (marker: L.Marker) => {
      // Don't fire the "close polygon" event meant for the FIRST marker click.
      // We only override clicks on intermediate vertices; clicking the first
      // marker still closes the shape (Leaflet.draw's default behaviour).
      marker.on("click", (ev: L.LeafletMouseEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const markers: any[] = drawer?._markers ?? [];
        const idx = markers.indexOf(marker);
        // First marker: let Leaflet.draw's own handler close the polygon.
        if (idx <= 0) return;
        L.DomEvent.stop(ev);
        removeVertexAt(idx);
      });
      // Help the user discover the interaction.
      const el = marker.getElement?.() as HTMLElement | null;
      if (el) {
        el.style.cursor = "pointer";
        el.title = "Click to remove this point";
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleVertex = (e: any) => {
      const layers = (e?.layers?.getLayers?.() ?? []) as L.Marker[];
      // The most recently added marker is the last one in the markers array.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: any[] = drawer?._markers ?? [];
      const last = all[all.length - 1];
      if (last) attachMarkerClick(last);
      onVertexCountChange?.(layers.length);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreated = (e: any) => {
      const layer = e.layer as L.Polygon;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      onShapeCreated(latlngs.map((l) => [l.lat, l.lng] as LatLng));
      map.removeLayer(layer);
      onVertexCountChange?.(0);
    };

    const handleKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (
        ev.key === "Backspace" ||
        ((ev.ctrlKey || ev.metaKey) && (ev.key === "z" || ev.key === "Z"))
      ) {
        ev.preventDefault();
        undoLast();
      }
    };

    map.on(LD.Draw.Event.DRAWVERTEX, handleVertex);
    map.on(LD.Draw.Event.CREATED, handleCreated);
    window.addEventListener("keydown", handleKey);

    return () => {
      try {
        drawer?.disable();
      } catch {}
      map.off(LD.Draw.Event.DRAWVERTEX, handleVertex);
      map.off(LD.Draw.Event.CREATED, handleCreated);
      window.removeEventListener("keydown", handleKey);
      onUndoReady?.(null);
      onVertexCountChange?.(0);
    };
  }, [enabled, map, onShapeCreated, onUndoReady, onVertexCountChange]);

  return null;
}
