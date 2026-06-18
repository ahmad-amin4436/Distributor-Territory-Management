"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Loader2, MapPin, Pentagon, Search, X } from "lucide-react";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import { cn } from "@/lib/utils";
import type { LatLng } from "@/types";

interface BaseSuggestion {
  id: string;
  label: string;
  sub?: string;
  kind: "territory" | "distributor" | "place";
}

interface TerritorySuggestion extends BaseSuggestion {
  kind: "territory";
  territoryId: string;
}

interface DistributorSuggestion extends BaseSuggestion {
  kind: "distributor";
  territoryId?: string;
  position?: LatLng;
}

interface PlaceSuggestion extends BaseSuggestion {
  kind: "place";
  position: LatLng;
  bounds?: [LatLng, LatLng];
}

type Suggestion = TerritorySuggestion | DistributorSuggestion | PlaceSuggestion;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  boundingbox?: [string, string, string, string];
}

interface Props {
  onPick?: (target:
    | { type: "territory"; id: string }
    | { type: "place"; lat: number; lng: number; bounds?: [LatLng, LatLng]; label: string }
  ) => void;
  /** Restrict Nominatim results to a country code, e.g. "pk". Optional. */
  countryCode?: string;
  /** Bias Nominatim results around this lat/lng (viewbox). Optional. */
  viewBox?: { south: number; west: number; north: number; east: number };
  placeholder?: string;
}

function centroid(coords: LatLng[]): LatLng {
  let lat = 0;
  let lng = 0;
  for (const [a, b] of coords) {
    lat += a;
    lng += b;
  }
  return [lat / coords.length, lng / coords.length];
}

export function MapSearch({
  onPick,
  countryCode,
  viewBox,
  placeholder = "Search territories, distributors, or places…",
}: Props) {
  const territories = useTerritoryStore((s) => s.territories);
  const setSelected = useTerritoryStore((s) => s.setSelected);
  const distributors = useDistributorStore((s) => s.distributors);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const localSuggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tHits: TerritorySuggestion[] = territories
      .filter((t) =>
        `${t.name} ${t.coverageArea}`.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((t) => ({
        id: `t-${t.id}`,
        kind: "territory",
        territoryId: t.id,
        label: t.name,
        sub: t.coverageArea,
      }));

    const dHits: DistributorSuggestion[] = distributors
      .filter((d) =>
        `${d.name} ${d.contactPerson ?? ""} ${d.code ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((d) => {
        const territory = d.assignedTerritoryId
          ? territories.find((t) => t.id === d.assignedTerritoryId)
          : undefined;
        const pos = territory ? centroid(territory.coordinates) : undefined;
        return {
          id: `d-${d.id}`,
          kind: "distributor",
          label: d.name,
          sub: territory ? `${territory.name} · ${d.code ?? ""}` : d.code ?? "Unassigned",
          territoryId: territory?.id,
          position: pos,
        };
      });

    return [...tHits, ...dHits];
  }, [query, territories, distributors]);

  const allSuggestions = useMemo<Suggestion[]>(
    () => [...localSuggestions, ...places],
    [localSuggestions, places],
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [allSuggestions.length]);

  // Debounced Nominatim fetch.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setPlaces([]);
      setLoadingPlaces(false);
      abortRef.current?.abort();
      return;
    }
    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoadingPlaces(true);
      const params = new URLSearchParams({
        q,
        format: "json",
        addressdetails: "0",
        limit: "5",
      });
      if (countryCode) params.set("countrycodes", countryCode);
      if (viewBox) {
        params.set(
          "viewbox",
          `${viewBox.west},${viewBox.north},${viewBox.east},${viewBox.south}`,
        );
        params.set("bounded", "1");
      }
      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          // Nominatim requests a descriptive UA / Referer for polite use.
          Accept: "application/json",
        },
      })
        .then((r) => (r.ok ? (r.json() as Promise<NominatimResult[]>) : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((rows) => {
          const mapped: PlaceSuggestion[] = rows.map((r) => {
            const lat = Number(r.lat);
            const lng = Number(r.lon);
            const [labelMain, ...rest] = r.display_name.split(", ");
            const bb = r.boundingbox?.map(Number) as
              | [number, number, number, number]
              | undefined;
            return {
              id: `p-${r.place_id}`,
              kind: "place",
              label: labelMain,
              sub: rest.join(", "),
              position: [lat, lng],
              bounds:
                bb && bb.length === 4
                  ? ([
                      [bb[0], bb[2]] as LatLng,
                      [bb[1], bb[3]] as LatLng,
                    ] as [LatLng, LatLng])
                  : undefined,
            };
          });
          setPlaces(mapped);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name !== "AbortError") {
            // Network or rate-limit issue — fail silently, local hits still work.
            setPlaces([]);
          }
        })
        .finally(() => setLoadingPlaces(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, countryCode, viewBox]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const choose = (s: Suggestion) => {
    setOpen(false);
    setQuery(s.label);
    if (s.kind === "territory") {
      setSelected(s.territoryId);
      onPick?.({ type: "territory", id: s.territoryId });
    } else if (s.kind === "distributor") {
      if (s.territoryId) {
        setSelected(s.territoryId);
        onPick?.({ type: "territory", id: s.territoryId });
      } else if (s.position) {
        onPick?.({
          type: "place",
          lat: s.position[0],
          lng: s.position[1],
          label: s.label,
        });
      }
    } else {
      onPick?.({
        type: "place",
        lat: s.position[0],
        lng: s.position[1],
        bounds: s.bounds,
        label: s.label,
      });
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(allSuggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (allSuggestions[activeIdx]) {
        e.preventDefault();
        choose(allSuggestions[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const clear = () => {
    setQuery("");
    setPlaces([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown =
    open &&
    (allSuggestions.length > 0 || loadingPlaces || (query.trim().length >= 3 && !loadingPlaces));

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-auto absolute left-1/2 top-4 z-[470] w-[min(640px,calc(100%-7rem))] -translate-x-1/2"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-border bg-card/90 pl-10 pr-10 text-sm text-foreground shadow-xl shadow-black/40 backdrop-blur transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
        />
        {(query || loadingPlaces) && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loadingPlaces && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {query && (
              <button
                type="button"
                onClick={clear}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl shadow-black/50 backdrop-blur animate-fade-in">
          {localSuggestions.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 pt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                In this workspace
              </div>
              <ul className="py-1">
                {localSuggestions.map((s, idx) => (
                  <SuggestionRow
                    key={s.id}
                    s={s}
                    active={activeIdx === idx}
                    onSelect={() => choose(s)}
                    onHover={() => setActiveIdx(idx)}
                  />
                ))}
              </ul>
            </div>
          )}
          {places.length > 0 && (
            <div>
              <div className="px-3 pt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Places (OpenStreetMap)
              </div>
              <ul className="py-1">
                {places.map((s, idx) => {
                  const globalIdx = localSuggestions.length + idx;
                  return (
                    <SuggestionRow
                      key={s.id}
                      s={s}
                      active={activeIdx === globalIdx}
                      onSelect={() => choose(s)}
                      onHover={() => setActiveIdx(globalIdx)}
                    />
                  );
                })}
              </ul>
            </div>
          )}
          {!loadingPlaces && allSuggestions.length === 0 && query.trim().length >= 3 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No matches for “{query.trim()}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  s,
  active,
  onSelect,
  onHover,
}: {
  s: Suggestion;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon =
    s.kind === "territory"
      ? Pentagon
      : s.kind === "distributor"
        ? Building2
        : MapPin;
  return (
    <li>
      <button
        type="button"
        onMouseEnter={onHover}
        onMouseDown={(e) => {
          // Prevent the input's blur from closing the menu before click fires.
          e.preventDefault();
          onSelect();
        }}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-2 text-left text-sm transition-colors",
          active ? "bg-secondary text-foreground" : "text-foreground/90 hover:bg-secondary/60",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border",
            s.kind === "territory" && "bg-indigo-500/15 text-indigo-300",
            s.kind === "distributor" && "bg-teal-500/15 text-teal-300",
            s.kind === "place" && "bg-amber-500/15 text-amber-300",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{s.label}</span>
          {s.sub && (
            <span className="block truncate text-[11px] text-muted-foreground">
              {s.sub}
            </span>
          )}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {s.kind === "place" ? "Place" : s.kind}
        </span>
      </button>
    </li>
  );
}
