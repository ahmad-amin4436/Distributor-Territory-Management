"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CircleHelp,
  Pencil,
  Pentagon,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicMap } from "@/components/map/DynamicMap";
import { MapToolbar } from "@/components/map/MapToolbar";
import { MapLegend } from "@/components/map/MapLegend";
import { MapFilterBar } from "@/components/map/MapFilterBar";
import { TerritorySidebar } from "@/components/territories/TerritorySidebar";
import { AssignTerritoryDialog } from "@/components/territories/AssignTerritoryDialog";
import { TerritoryStatsPanel } from "@/components/territories/TerritoryStatsPanel";
import { useTerritoryStore } from "@/store/territoryStore";
import { TERRITORY_COLORS } from "@/mock/territories";
import { downloadJson, geoJsonToTerritories, territoriesToGeoJson } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { BaseLayerId, LatLng, MapFilters } from "@/types";

const DEFAULT_FILTERS: MapFilters = {
  query: "",
  performances: [],
  assignmentMode: "all",
};

export default function TerritoriesPage() {
  const searchParams = useSearchParams();
  const focusFromQuery = searchParams.get("focus");

  const territories = useTerritoryStore((s) => s.territories);
  const setSelected = useTerritoryStore((s) => s.setSelected);
  const setDraft = useTerritoryStore((s) => s.setDraft);
  const addImportedTerritories = useTerritoryStore((s) => s.addImportedTerritories);

  const [drawing, setDrawing] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<LatLng[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>("dark");
  const [showLabels, setShowLabels] = useState(true);
  const [highlightOverlaps, setHighlightOverlaps] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState<{
    tone: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusFromQuery) setSelected(focusFromQuery);
  }, [focusFromQuery, setSelected]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  const visibleCount = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return territories.filter((t) => {
      if (filters.performances.length && !filters.performances.includes(t.performance)) return false;
      if (filters.assignmentMode === "assigned" && !t.distributorId) return false;
      if (filters.assignmentMode === "unassigned" && t.distributorId) return false;
      if (q) {
        const hay = `${t.name} ${t.coverageArea}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).length;
  }, [filters, territories]);

  const startDrawing = () => {
    const usedColors = new Set(territories.map((t) => t.color));
    const color =
      TERRITORY_COLORS.find((c) => !usedColors.has(c)) ||
      TERRITORY_COLORS[territories.length % TERRITORY_COLORS.length];
    setDraft({ coordinates: [], color });
    setDrawing(true);
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setDraft(null);
    setPendingCoords(null);
  };

  const handleShapeCreated = (coords: LatLng[]) => {
    if (coords.length < 3) {
      cancelDrawing();
      return;
    }
    setPendingCoords(coords);
    setDrawing(false);
    setDraft({
      coordinates: coords,
      color:
        TERRITORY_COLORS.find((c) => !new Set(territories.map((t) => t.color)).has(c)) ||
        TERRITORY_COLORS[territories.length % TERRITORY_COLORS.length],
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (territories.length === 0) {
      setToast({ tone: "danger", text: "No territories to export yet." });
      return;
    }
    downloadJson(`territories-${new Date().toISOString().slice(0, 10)}.geojson`, territoriesToGeoJson(territories));
    setToast({ tone: "success", text: `Exported ${territories.length} territories as GeoJSON.` });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items = geoJsonToTerritories(data);
      if (!items.length) {
        setToast({ tone: "danger", text: "No valid polygon features found in that GeoJSON." });
      } else {
        const added = await addImportedTerritories(items);
        setToast({ tone: "success", text: `Imported ${added} territor${added === 1 ? "y" : "ies"}.` });
      }
    } catch (err) {
      console.error(err);
      setToast({
        tone: "danger",
        text: err instanceof Error ? err.message : "Could not parse the file.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Territory designer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draw, edit, and assign distributor coverage zones on the city map.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {drawing ? (
            <>
              <Badge variant="warning" className="animate-pulse-glow">
                <Pentagon className="h-3 w-3" />
                Drawing mode
              </Badge>
              <Button variant="outline" onClick={cancelDrawing}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="gradient" onClick={startDrawing}>
              <Plus className="h-4 w-4" />
              Draw new territory
            </Button>
          )}
        </div>
      </div>

      <MapFilterBar
        filters={filters}
        onChange={setFilters}
        total={territories.length}
        visible={visibleCount}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,application/geo+json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className={cn("grid gap-4", fullscreen ? "" : "lg:grid-cols-[1fr_360px]")}>
        <Card
          className={cn(
            "overflow-hidden p-0 transition-all",
            fullscreen &&
              "fixed inset-0 z-[900] m-0 w-screen max-w-none rounded-none border-0 shadow-none",
          )}
        >
          <CardContent className="h-full p-0">
            <div
              className={cn(
                "relative w-full",
                fullscreen ? "h-screen" : "h-[70vh] min-h-[520px]",
              )}
            >
              <DynamicMap
                drawing={drawing}
                onDraftCreated={handleShapeCreated}
                onTerritoryClick={(id) => setSelected(id)}
                focusTerritoryId={focusFromQuery}
                filters={filters}
                baseLayer={baseLayer}
                showLabels={showLabels}
                highlightOverlaps={highlightOverlaps}
              />

              <MapToolbar
                baseLayer={baseLayer}
                onBaseLayerChange={setBaseLayer}
                showLabels={showLabels}
                onToggleLabels={() => setShowLabels((v) => !v)}
                highlightOverlaps={highlightOverlaps}
                onToggleOverlaps={() => setHighlightOverlaps((v) => !v)}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((v) => !v)}
                onExport={handleExport}
                onImportClick={handleImportClick}
              />

              <MapLegend showOverlaps={highlightOverlaps} />

              {drawing && (
                <div className="pointer-events-none absolute right-4 top-20 z-[450] max-w-xs space-y-2 rounded-xl border border-border bg-card/90 p-4 text-xs shadow-xl backdrop-blur animate-fade-in">
                  <div className="flex items-center gap-2 text-foreground">
                    <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-semibold uppercase tracking-wider">How to draw</span>
                  </div>
                  <p className="text-muted-foreground">
                    Click on the map to drop vertices. Click the first point or double-click to finish the polygon.
                    A modal will open to assign a distributor.
                  </p>
                </div>
              )}

              {toast && (
                <div
                  className={cn(
                    "pointer-events-auto absolute bottom-4 left-1/2 z-[460] -translate-x-1/2 rounded-full border px-4 py-2 text-xs shadow-lg backdrop-blur animate-fade-in",
                    toast.tone === "success" && "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
                    toast.tone === "danger" && "border-rose-500/30 bg-rose-500/15 text-rose-200",
                    toast.tone === "info" && "border-indigo-500/30 bg-indigo-500/15 text-indigo-200",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {toast.tone === "danger" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {toast.text}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!fullscreen && (
          <div className="space-y-4">
            <TerritoryStatsPanel />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Territories
                  <Badge variant="muted">
                    {visibleCount}/{territories.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TerritorySidebar onEdit={handleEdit} filters={filters} />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/10 via-secondary/30 to-teal-400/5">
              <CardContent className="space-y-2 p-5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CircleHelp className="h-4 w-4 text-indigo-400" />
                  Pro tip
                </div>
                <p className="text-muted-foreground">
                  Toggle <span className="font-medium text-foreground">Overlaps</span> in the map toolbar to surface
                  any zones with conflicting coverage — they’ll outline in dashed orange.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AssignTerritoryDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) {
            setEditingId(null);
            setPendingCoords(null);
          }
        }}
        draftCoordinates={pendingCoords}
        editingTerritoryId={editingId}
      />
    </div>
  );
}
