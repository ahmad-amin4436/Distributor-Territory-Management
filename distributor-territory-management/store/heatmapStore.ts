"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HeatmapSettings, SalesPoint } from "@/types";
import { generateSalesPoints } from "@/mock/sales";

interface HeatmapState {
  points: SalesPoint[];
  settings: HeatmapSettings;
  initialized: boolean;
  init: () => void;
  addPoint: (input: Omit<SalesPoint, "id" | "createdAt">) => SalesPoint;
  updatePoint: (id: string, patch: Partial<SalesPoint>) => void;
  removePoint: (id: string) => void;
  clearPoints: () => void;
  regenerateDemo: () => void;
  importPoints: (points: Omit<SalesPoint, "id" | "createdAt">[]) => number;
  updateSettings: (patch: Partial<HeatmapSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: HeatmapSettings = {
  radiusScale: 1,
  opacity: 0.4,
  highThreshold: 65,
  mediumThreshold: 40,
  showTerritories: true,
  territoryFilter: null,
};

function makeId() {
  return `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useHeatmapStore = create<HeatmapState>()(
  persist(
    (set, get) => ({
      points: [],
      settings: DEFAULT_SETTINGS,
      initialized: false,

      init: () => {
        if (get().initialized) return;
        if (get().points.length === 0) {
          const seeded = generateSalesPoints().map((p) => ({
            ...p,
            createdAt: new Date().toISOString(),
          }));
          set({ points: seeded, initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      addPoint: (input) => {
        const point: SalesPoint = {
          ...input,
          id: makeId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ points: [...s.points, point] }));
        return point;
      },

      updatePoint: (id, patch) =>
        set((s) => ({
          points: s.points.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePoint: (id) => set((s) => ({ points: s.points.filter((p) => p.id !== id) })),

      clearPoints: () => set({ points: [] }),

      regenerateDemo: () => {
        const seeded = generateSalesPoints().map((p) => ({
          ...p,
          createdAt: new Date().toISOString(),
        }));
        set({ points: seeded });
      },

      importPoints: (incoming) => {
        if (!incoming.length) return 0;
        const created = incoming.map((p) => ({
          ...p,
          id: makeId(),
          createdAt: new Date().toISOString(),
        }));
        set((s) => ({ points: [...s.points, ...created] }));
        return created.length;
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "dtm.heatmap",
      partialize: (state) => ({ points: state.points, settings: state.settings }),
    },
  ),
);
