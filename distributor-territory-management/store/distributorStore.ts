"use client";

import { create } from "zustand";
import type { Distributor } from "@/types";
import { distributorApi, territoryApi, type DistributorInput } from "@/lib/api";
import { useTerritoryStore } from "@/store/territoryStore";

interface DistributorState {
  distributors: Distributor[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
  /** Load distributors from the API. */
  load: () => Promise<void>;
  addDistributor: (input: Omit<Distributor, "id" | "code" | "joinedAt" | "avatarColor">) => Promise<Distributor>;
  updateDistributor: (id: string, patch: Partial<Distributor>) => Promise<void>;
  removeDistributor: (id: string) => Promise<void>;
  /** Assign (or clear with undefined) a territory to a distributor. */
  assignTerritory: (distributorId: string, territoryId: string | undefined) => Promise<void>;
  /** Replace a single distributor in local state (used by cross-store sync). */
  upsertLocal: (distributor: Distributor) => void;
}

function toInput(d: Partial<Distributor>): DistributorInput {
  return {
    name: d.name ?? "",
    contactPerson: d.contactPerson,
    email: d.email,
    phone: d.phone,
    address: d.address,
    city: d.city,
    status: d.status,
    code: d.code,
    joinedAt: d.joinedAt,
    avatarColor: d.avatarColor,
  };
}

export const useDistributorStore = create<DistributorState>()((set, get) => ({
  distributors: [],
  initialized: false,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const distributors = await distributorApi.list();
      set({ distributors, initialized: true, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  addDistributor: async (input) => {
    const created = await distributorApi.create(toInput(input as Partial<Distributor>));
    set((s) => ({ distributors: [...s.distributors, created] }));
    // A territory assignment supplied at creation is applied via the territory API.
    if (input.assignedTerritoryId) {
      await get().assignTerritory(created.id, input.assignedTerritoryId);
    }
    return created;
  },

  updateDistributor: async (id, patch) => {
    const current = get().distributors.find((d) => d.id === id);
    if (!current) return;
    const updated = await distributorApi.update(id, toInput({ ...current, ...patch }));
    set((s) => ({
      distributors: s.distributors.map((d) => (d.id === id ? updated : d)),
    }));
  },

  removeDistributor: async (id) => {
    await distributorApi.remove(id);
    set((s) => ({ distributors: s.distributors.filter((d) => d.id !== id) }));
    // The backend clears the territory link on delete; mirror that locally.
    useTerritoryStore.getState().clearDistributorLocal(id);
  },

  assignTerritory: async (distributorId, territoryId) => {
    const prev = get().distributors.find((d) => d.id === distributorId)?.assignedTerritoryId;

    // Clearing: unassign whatever territory this distributor currently holds.
    if (!territoryId) {
      if (prev) {
        const t = await territoryApi.assign(prev, null);
        useTerritoryStore.getState().upsertLocal(t);
      }
      set((s) => ({
        distributors: s.distributors.map((d) =>
          d.id === distributorId ? { ...d, assignedTerritoryId: undefined } : d,
        ),
      }));
      return;
    }

    // Assigning a territory to this distributor (source of truth = territory).
    const territory = await territoryApi.assign(territoryId, distributorId);
    useTerritoryStore.getState().upsertLocal(territory);

    set((s) => ({
      distributors: s.distributors.map((d) => {
        if (d.id === distributorId) return { ...d, assignedTerritoryId: territoryId };
        // The territory can belong to only one distributor — clear the old owner.
        if (d.assignedTerritoryId === territoryId) return { ...d, assignedTerritoryId: undefined };
        return d;
      }),
    }));
  },

  upsertLocal: (distributor) =>
    set((s) => ({
      distributors: s.distributors.some((d) => d.id === distributor.id)
        ? s.distributors.map((d) => (d.id === distributor.id ? distributor : d))
        : [...s.distributors, distributor],
    })),
}));
