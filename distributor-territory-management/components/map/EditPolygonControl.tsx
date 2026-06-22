"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import { useMap } from "react-leaflet";
import type { LatLng, Territory } from "@/types";

export interface EditPolygonHandle {
  getCoords: () => LatLng[];
}

interface Props {
  territory: Territory;
}

/**
 * Renders the territory polygon in leaflet-draw's vertex-edit mode.
 * Yellow handles appear on each vertex — drag them to reshape the polygon.
 * Call getCoords() via the forwarded ref to read the updated coordinates.
 */
export const EditPolygonControl = forwardRef<EditPolygonHandle, Props>(
  function EditPolygonControl({ territory }, ref) {
    const map = useMap();
    const polyRef = useRef<L.Polygon | null>(null);

    useImperativeHandle(ref, () => ({
      getCoords: () => {
        if (!polyRef.current) return [];
        const latlngs = polyRef.current.getLatLngs()[0] as L.LatLng[];
        return latlngs.map((ll) => [ll.lat, ll.lng] as LatLng);
      },
    }));

    useEffect(() => {
      const poly = L.polygon(territory.coordinates as L.LatLngExpression[], {
        color: territory.color,
        weight: 3,
        fillColor: territory.color,
        fillOpacity: 0.35,
      }).addTo(map);

      try {
        (poly as any).editing.enable();
      } catch (err) {
        console.error("Could not enable polygon vertex editing:", err);
      }

      polyRef.current = poly;

      return () => {
        try {
          (poly as any).editing.disable();
        } catch {}
        map.removeLayer(poly);
        polyRef.current = null;
      };
    }, [map, territory.id]);

    return null;
  },
);
