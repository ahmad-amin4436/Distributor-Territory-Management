"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type TerritoryMap from "./TerritoryMap";

const Map = dynamic(() => import("./TerritoryMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[400px] w-full place-items-center rounded-xl border border-border bg-secondary/30 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse-glow rounded-full bg-indigo-400" />
        Loading interactive map…
      </div>
    </div>
  ),
});

export function DynamicMap(props: ComponentProps<typeof TerritoryMap>) {
  return <Map {...props} />;
}
