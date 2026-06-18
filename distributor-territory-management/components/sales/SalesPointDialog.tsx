"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHeatmapStore } from "@/store/heatmapStore";
import { useTerritoryStore } from "@/store/territoryStore";
import type { SalesPoint } from "@/types";

const schema = z.object({
  label: z.string().optional(),
  intensity: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
  amount: z.coerce.number().min(0, "Min 0"),
  territoryId: z.string().optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draftPosition?: { lat: number; lng: number } | null;
  editing?: SalesPoint | null;
}

export function SalesPointDialog({ open, onOpenChange, draftPosition, editing }: Props) {
  const addPoint = useHeatmapStore((s) => s.addPoint);
  const updatePoint = useHeatmapStore((s) => s.updatePoint);
  const territories = useTerritoryStore((s) => s.territories);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      intensity: 60,
      amount: 5000,
      territoryId: "",
      lat: 0,
      lng: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      label: editing?.label ?? "",
      intensity: editing?.intensity ?? 60,
      amount: editing?.amount ?? 5000,
      territoryId: editing?.territoryId ?? "",
      lat: editing?.lat ?? draftPosition?.lat ?? 0,
      lng: editing?.lng ?? draftPosition?.lng ?? 0,
    });
  }, [open, editing, draftPosition, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      label: values.label?.trim() ? values.label.trim() : undefined,
      intensity: values.intensity,
      amount: values.amount,
      territoryId: values.territoryId || undefined,
      lat: values.lat,
      lng: values.lng,
    };
    if (editing) {
      updatePoint(editing.id, payload);
    } else {
      addPoint(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-400 text-white">
              <Flame className="h-4 w-4" />
            </span>
            {editing ? "Edit sales hotspot" : "New sales hotspot"}
          </DialogTitle>
          <DialogDescription>
            Drop a sales activity reading on the map. Intensity drives the heatmap colour and radius.
          </DialogDescription>
        </DialogHeader>

        <form id="sales-point-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sp-label">Label (optional)</Label>
            <Input id="sp-label" {...register("label")} placeholder="e.g. Defence Phase 5 cluster" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-intensity">Intensity (0–100)</Label>
            <Input id="sp-intensity" type="number" min={0} max={100} {...register("intensity")} />
            {errors.intensity && <p className="text-xs text-rose-400">{errors.intensity.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-amount">Amount</Label>
            <Input id="sp-amount" type="number" min={0} {...register("amount")} />
            {errors.amount && <p className="text-xs text-rose-400">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-lat">Latitude</Label>
            <Input id="sp-lat" type="number" step="any" {...register("lat")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-lng">Longitude</Label>
            <Input id="sp-lng" type="number" step="any" {...register("lng")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Territory (optional)</Label>
            <Select
              value={watch("territoryId") || "__none__"}
              onValueChange={(v) => setValue("territoryId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standalone (no territory)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Standalone</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="sales-point-form" type="submit" variant="gradient">
            {editing ? "Save changes" : "Add hotspot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
