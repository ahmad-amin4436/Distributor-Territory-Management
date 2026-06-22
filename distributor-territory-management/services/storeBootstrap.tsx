"use client";

import { useEffect } from "react";
import { useDistributorStore } from "@/store/distributorStore";
import { useTerritoryStore } from "@/store/territoryStore";
import { useAuthStore } from "@/store/authStore";
import { useHeatmapStore } from "@/store/heatmapStore";

export function StoreBootstrap({ children }: { children: React.ReactNode }) {
  const loadTerritories = useTerritoryStore((s) => s.load);
  const loadDistributors = useDistributorStore((s) => s.load);
  const initHeatmap = useHeatmapStore((s) => s.init);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initHeatmap();
  }, [initHeatmap]);

  useEffect(() => {
    // Data endpoints require auth, so only load once a session exists.
    if (!user) return;
    // Distributors first so territory→distributor assignment sync has data.
    loadDistributors().then(() => loadTerritories());
  }, [user, loadDistributors, loadTerritories]);

  return <>{children}</>;
}
