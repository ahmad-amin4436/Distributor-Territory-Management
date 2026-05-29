"use client";

import {
  Download,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Ruler,
  ShieldAlert,
  Tag,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { BaseLayerId } from "@/types";

interface Props {
  baseLayer: BaseLayerId;
  onBaseLayerChange: (id: BaseLayerId) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  highlightOverlaps: boolean;
  onToggleOverlaps: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onExport: () => void;
  onImportClick: () => void;
}

const layers: { id: BaseLayerId; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "streets", label: "Streets" },
  { id: "satellite", label: "Satellite" },
];

export function MapToolbar({
  baseLayer,
  onBaseLayerChange,
  showLabels,
  onToggleLabels,
  highlightOverlaps,
  onToggleOverlaps,
  fullscreen,
  onToggleFullscreen,
  onExport,
  onImportClick,
}: Props) {
  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-[450] flex items-center gap-1.5 rounded-xl border border-border bg-card/85 p-1.5 shadow-xl shadow-black/30 backdrop-blur">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            {layers.find((l) => l.id === baseLayer)?.label ?? "Base"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Base layer</DropdownMenuLabel>
          {layers.map((l) => (
            <DropdownMenuItem key={l.id} onClick={() => onBaseLayerChange(l.id)}>
              <MapIcon className="h-3.5 w-3.5" />
              {l.label}
              {baseLayer === l.id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleLabels}>
            <Tag className="h-3.5 w-3.5" />
            {showLabels ? "Hide labels" : "Show labels"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleOverlaps}>
            <ShieldAlert className="h-3.5 w-3.5" />
            {highlightOverlaps ? "Hide overlap warnings" : "Detect overlaps"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="h-5 w-px bg-border" />

      <Button
        size="sm"
        variant={showLabels ? "secondary" : "ghost"}
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={onToggleLabels}
      >
        <Tag className="h-3.5 w-3.5" />
        Labels
      </Button>

      <Button
        size="sm"
        variant={highlightOverlaps ? "secondary" : "ghost"}
        className={cn(
          "h-8 gap-1.5 px-2 text-xs",
          highlightOverlaps && "text-amber-300 hover:text-amber-200",
        )}
        onClick={onToggleOverlaps}
      >
        <Ruler className="h-3.5 w-3.5" />
        Overlaps
      </Button>

      <span className="h-5 w-px bg-border" />

      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs" onClick={onExport}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-xs" onClick={onImportClick}>
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>

      <span className="h-5 w-px bg-border" />

      <Button
        size="sm"
        variant="ghost"
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={onToggleFullscreen}
        aria-label="Toggle fullscreen"
      >
        {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        {fullscreen ? "Exit" : "Fullscreen"}
      </Button>
    </div>
  );
}
