"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Distributor } from "@/types";
import { mockDistributors } from "@/mock/distributors";

const PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6", "#ef4444"];

interface DistributorState {
  distributors: Distributor[];
  initialized: boolean;
  init: () => void;
  addDistributor: (input: Omit<Distributor, "id" | "code" | "joinedAt" | "avatarColor">) => Distributor;
  updateDistributor: (id: string, patch: Partial<Distributor>) => void;
  removeDistributor: (id: string) => void;
  assignTerritory: (distributorId: string, territoryId: string | undefined) => void;
}

export const useDistributorStore = create<DistributorState>()(
  persist(
    (set, get) => ({
      distributors: [],
      initialized: false,

      init: () => {
        if (get().initialized) return;
        if (get().distributors.length === 0) {
          set({ distributors: mockDistributors, initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      addDistributor: (input) => {
        const id = `d-${Date.now().toString(36)}`;
        const seq = get().distributors.length + 1;
        const code = `DST-${seq.toString().padStart(3, "0")}`;
        const avatarColor = PALETTE[get().distributors.length % PALETTE.length];
        const distributor: Distributor = {
          ...input,
          id,
          code,
          joinedAt: new Date().toISOString().slice(0, 10),
          avatarColor,
        };
        set((s) => ({ distributors: [...s.distributors, distributor] }));
        return distributor;
      },

      updateDistributor: (id, patch) =>
        set((s) => ({
          distributors: s.distributors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      removeDistributor: (id) =>
        set((s) => ({
          distributors: s.distributors.filter((d) => d.id !== id),
        })),

      assignTerritory: (distributorId, territoryId) =>
        set((s) => ({
          distributors: s.distributors.map((d) =>
            d.id === distributorId ? { ...d, assignedTerritoryId: territoryId } : d,
          ),
        })),
    }),
    {
      name: "dtm.distributors",
      partialize: (state) => ({ distributors: state.distributors }),
    },
  ),
);
