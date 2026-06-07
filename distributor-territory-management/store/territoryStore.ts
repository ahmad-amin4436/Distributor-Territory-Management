"use client";

import { create } from "zustand";
import type { LatLng, Territory } from "@/types";
import type { ImportedTerritory } from "@/lib/geo";
import { territoryApi, type TerritoryInput } from "@/lib/api";
import { useDistributorStore } from "@/store/distributorStore";

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
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setDraft: (draft: DraftTerritory | null) => void;
  addTerritory: (
    input: Omit<Territory, "id" | "createdAt" | "monthlySales" | "targetSales" | "performance" | "outlets" | "population" | "color"> & {
      color?: string;
      monthlySales?: number;
      targetSales?: number;
      population?: number;
    },
  ) => Promise<Territory>;
  addImportedTerritories: (items: ImportedTerritory[]) => Promise<number>;
  updateTerritory: (id: string, patch: Partial<Territory>) => Promise<void>;
  updateCoordinates: (id: string, coordinates: LatLng[]) => Promise<void>;
  removeTerritory: (id: string) => Promise<void>;
  setSelected: (id: string | null) => void;
  assignDistributor: (territoryId: string, distributorId: string | undefined) => Promise<void>;
  /** Replace a single territory in local state (used by cross-store sync). */
  upsertLocal: (territory: Territory) => void;
  /** Clear any territory linked to a deleted distributor (local mirror). */
  clearDistributorLocal: (distributorId: string) => void;
}

function toInput(t: Partial<Territory>): TerritoryInput {
  return {
    name: t.name ?? "",
    coverageArea: t.coverageArea ?? "",
    notes: t.notes,
    color: t.color,
    coordinates: t.coordinates,
    distributorId: t.distributorId ?? null,
    monthlySales: t.monthlySales,
    targetSales: t.targetSales,
    performance: t.performance,
    outlets: t.outlets,
    population: t.population,
  };
}

/** Recompute distributors' assignedTerritoryId from the territory list. */
function syncDistributorAssignments(territories: Territory[]) {
  const byDistributor = new Map<string, string>();
  for (const t of territories) {
    if (t.distributorId) byDistributor.set(t.distributorId, t.id);
  }
  const dStore = useDistributorStore.getState();
  dStore.distributors.forEach((d) => {
    const next = byDistributor.get(d.id);
    if (d.assignedTerritoryId !== next) {
      dStore.upsertLocal({ ...d, assignedTerritoryId: next });
    }
  });
}

export const useTerritoryStore = create<TerritoryState>()((set, get) => ({
  territories: [],
  draft: null,
  selectedId: null,
  focusTick: 0,
  initialized: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const territories = await territoryApi.list();
      set({ territories, initialized: true, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  setDraft: (draft) => set({ draft }),

  addTerritory: async (input) => {
    const created = await territoryApi.create(toInput(input as Partial<Territory>));
    set((s) => ({ territories: [...s.territories, created], draft: null, selectedId: created.id }));
    if (created.distributorId) syncDistributorAssignments(get().territories);
    return created;
  },

  addImportedTerritories: async (items) => {
    if (!items.length) return 0;
    let count = 0;
    for (const item of items) {
      const created = await territoryApi.create({
        name: item.name,
        coverageArea: item.coverageArea,
        notes: item.notes,
        color: item.color,
        coordinates: item.coordinates,
        distributorId: item.distributorId ?? null,
      });
      set((s) => ({ territories: [...s.territories, created] }));
      count++;
    }
    syncDistributorAssignments(get().territories);
    return count;
  },

  updateTerritory: async (id, patch) => {
    const current = get().territories.find((t) => t.id === id);
    if (!current) return;
    const updated = await territoryApi.update(id, toInput({ ...current, ...patch }));
    set((s) => ({ territories: s.territories.map((t) => (t.id === id ? updated : t)) }));
    syncDistributorAssignments(get().territories);
  },

  updateCoordinates: async (id, coordinates) => {
    const updated = await territoryApi.updateCoordinates(id, coordinates);
    set((s) => ({ territories: s.territories.map((t) => (t.id === id ? updated : t)) }));
  },

  removeTerritory: async (id) => {
    await territoryApi.remove(id);
    set((s) => ({
      territories: s.territories.filter((t) => t.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    syncDistributorAssignments(get().territories);
  },

  setSelected: (id) => set((s) => ({ selectedId: id, focusTick: s.focusTick + 1 })),

  assignDistributor: async (territoryId, distributorId) => {
    const updated = await territoryApi.assign(territoryId, distributorId ?? null);
    set((s) => ({ territories: s.territories.map((t) => (t.id === territoryId ? updated : t)) }));
    syncDistributorAssignments(get().territories);
  },

  upsertLocal: (territory) =>
    set((s) => ({
      territories: s.territories.some((t) => t.id === territory.id)
        ? s.territories.map((t) => (t.id === territory.id ? territory : t))
        : [...s.territories, territory],
    })),

  clearDistributorLocal: (distributorId) =>
    set((s) => ({
      territories: s.territories.map((t) =>
        t.distributorId === distributorId ? { ...t, distributorId: undefined } : t,
      ),
    })),
}));
