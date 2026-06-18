"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet-draw";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/types";

interface Props {
  enabled: boolean;
  onShapeCreated: (latlngs: LatLng[]) => void;
}

export function DrawControl({ enabled, onShapeCreated }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    let drawer: L.Draw.Polygon | null = null;
    try {
      drawer = new (L as any).Draw.Polygon(map, {
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

    const handleCreated = (e: any) => {
      const layer = e.layer as L.Polygon;
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      onShapeCreated(latlngs.map((l) => [l.lat, l.lng] as LatLng));
      map.removeLayer(layer);
    };

    map.on((L as any).Draw.Event.CREATED, handleCreated);

    return () => {
      try {
        drawer?.disable();
      } catch {}
      map.off((L as any).Draw.Event.CREATED, handleCreated);
    };
  }, [enabled, map, onShapeCreated]);

  return null;
}
