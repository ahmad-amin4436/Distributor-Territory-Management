"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LatLng, PerformanceStatus, Territory } from "@/types";
import { mockTerritories, TERRITORY_COLORS } from "@/mock/territories";
import type { ImportedTerritory } from "@/lib/geo";

interface DraftTerritory {
  coordinates: LatLng[];
  color: string;
}

interface TerritoryState {
  territories: Territory[];
  draft: DraftTerritory | null;
  selectedId: string | null;
  focusTick: number;
  initialized: boolean;
  init: () => void;
  setDraft: (draft: DraftTerritory | null) => void;
  addTerritory: (input: Omit<Territory, "id" | "createdAt" | "monthlySales" | "targetSales" | "performance" | "outlets" | "color"> & { color?: string }) => Territory;
  addImportedTerritories: (items: ImportedTerritory[]) => number;
  updateTerritory: (id: string, patch: Partial<Territory>) => void;
  updateCoordinates: (id: string, coordinates: LatLng[]) => void;
  removeTerritory: (id: string) => void;
  setSelected: (id: string | null) => void;
  assignDistributor: (territoryId: string, distributorId: string | undefined) => void;
}

const performanceFromRatio = (sales: number, target: number): PerformanceStatus => {
  if (!target) return "average";
  const r = sales / target;
  if (r >= 1) return "excellent";
  if (r >= 0.85) return "good";
  if (r >= 0.65) return "average";
  return "underperforming";
};

export const useTerritoryStore = create<TerritoryState>()(
  persist(
    (set, get) => ({
      territories: [],
      draft: null,
      selectedId: null,
      focusTick: 0,
      initialized: false,

      init: () => {
        if (get().initialized) return;
        if (get().territories.length === 0) {
          set({ territories: mockTerritories, initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      setDraft: (draft) => set({ draft }),

      addTerritory: (input) => {
        const id = `t-${Date.now().toString(36)}`;
        const usedColors = new Set(get().territories.map((t) => t.color));
        const color =
          input.color ||
          TERRITORY_COLORS.find((c) => !usedColors.has(c)) ||
          TERRITORY_COLORS[get().territories.length % TERRITORY_COLORS.length];
        const monthlySales = Math.floor(100000 + Math.random() * 200000);
        const targetSales = Math.floor(monthlySales * (0.85 + Math.random() * 0.4));
        const territory: Territory = {
          id,
          name: input.name,
          coverageArea: input.coverageArea,
          notes: input.notes,
          color,
          coordinates: input.coordinates,
          distributorId: input.distributorId,
          createdAt: new Date().toISOString(),
          monthlySales,
          targetSales,
          performance: performanceFromRatio(monthlySales, targetSales),
          outlets: Math.floor(60 + Math.random() * 150),
        };
        set((s) => ({ territories: [...s.territories, territory], draft: null, selectedId: id }));
        return territory;
      },

      addImportedTerritories: (items) => {
        if (!items.length) return 0;
        let count = 0;
        set((s) => {
          const existing = [...s.territories];
          const usedColors = new Set(existing.map((t) => t.color));
          const usedDistributors = new Set(
            existing.map((t) => t.distributorId).filter(Boolean) as string[],
          );

          for (const item of items) {
            const baseColor = item.color && /^#?[0-9a-fA-F]{6}$/.test(item.color)
              ? item.color.startsWith("#")
                ? item.color
                : `#${item.color}`
              : TERRITORY_COLORS.find((c) => !usedColors.has(c)) ??
                TERRITORY_COLORS[(existing.length + count) % TERRITORY_COLORS.length];
            usedColors.add(baseColor);

            const distributorId =
              item.distributorId && !usedDistributors.has(item.distributorId)
                ? item.distributorId
                : undefined;
            if (distributorId) usedDistributors.add(distributorId);

            const monthlySales = Math.floor(100000 + Math.random() * 200000);
            const targetSales = Math.floor(monthlySales * (0.85 + Math.random() * 0.4));
            const id = `t-${Date.now().toString(36)}-${count}`;
            existing.push({
              id,
              name: item.name,
              coverageArea: item.coverageArea,
              notes: item.notes,
              color: baseColor,
              coordinates: item.coordinates,
              distributorId,
              createdAt: new Date().toISOString(),
              monthlySales,
              targetSales,
              performance: performanceFromRatio(monthlySales, targetSales),
              outlets: Math.floor(60 + Math.random() * 150),
            });
            count++;
          }
          return { territories: existing };
        });
        return count;
      },

      updateTerritory: (id, patch) =>
        set((s) => ({
          territories: s.territories.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      updateCoordinates: (id, coordinates) =>
        set((s) => ({
          territories: s.territories.map((t) => (t.id === id ? { ...t, coordinates } : t)),
        })),

      removeTerritory: (id) =>
        set((s) => ({
          territories: s.territories.filter((t) => t.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      setSelected: (id) => set((s) => ({ selectedId: id, focusTick: s.focusTick + 1 })),

      assignDistributor: (territoryId, distributorId) =>
        set((s) => ({
          territories: s.territories.map((t) =>
            t.id === territoryId ? { ...t, distributorId } : t,
          ),
        })),
    }),
    {
      name: "dtm.territories",
      partialize: (state) => ({ territories: state.territories }),
    },
  ),
);
