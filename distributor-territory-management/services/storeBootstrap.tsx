"use client";

import { useEffect } from "react";
import { useDistributorStore } from "@/store/distributorStore";
import { useTerritoryStore } from "@/store/territoryStore";

export function StoreBootstrap({ children }: { children: React.ReactNode }) {
  const initTerritories = useTerritoryStore((s) => s.init);
  const initDistributors = useDistributorStore((s) => s.init);

  useEffect(() => {
    initTerritories();
    initDistributors();
  }, [initTerritories, initDistributors]);

  return <>{children}</>;
}
