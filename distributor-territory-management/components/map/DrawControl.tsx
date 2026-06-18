"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet-draw";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/types";

interface Props {
  enabled: boolean;
  onShapeCreated: (latlngs: LatLng[]) => void;
  /** Receives an imperative `undo()` callback while drawing, or null when idle. */
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
    let drawer: any = null;
    try {
      drawer = new LD.Draw.Polygon(map, {
        allowIntersection: false,
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

    const undo = () => {
      try {
        drawer?.deleteLastVertex?.();
        // Manually emit the vertex change since deleteLastVertex doesn't fire DRAWVERTEX.
        const len = drawer?._markers?.length ?? 0;
        onVertexCountChange?.(len);
      } catch (err) {
        console.error("undo failed", err);
      }
    };
    onUndoReady?.(undo);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleVertex = (e: any) => {
      const layers = e?.layers?.getLayers?.() ?? [];
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
      if (ev.key === "Backspace" || ((ev.ctrlKey || ev.metaKey) && (ev.key === "z" || ev.key === "Z"))) {
        // Only intercept when not focused inside an input/textarea.
        const target = ev.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
        ev.preventDefault();
        undo();
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
