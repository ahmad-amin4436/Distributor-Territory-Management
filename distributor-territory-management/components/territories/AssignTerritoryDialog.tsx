"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTerritoryStore } from "@/store/territoryStore";
import { useDistributorStore } from "@/store/distributorStore";
import type { LatLng } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  coverageArea: z.string().min(2, "Coverage area is required"),
  distributorId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draftCoordinates: LatLng[] | null;
  editingTerritoryId?: string | null;
}

export function AssignTerritoryDialog({
  open,
  onOpenChange,
  draftCoordinates,
  editingTerritoryId,
}: Props) {
  const territories = useTerritoryStore((s) => s.territories);
  const addTerritory = useTerritoryStore((s) => s.addTerritory);
  const updateTerritory = useTerritoryStore((s) => s.updateTerritory);
  const assignDistributor = useTerritoryStore((s) => s.assignDistributor);
  const setDraft = useTerritoryStore((s) => s.setDraft);
  const setSelected = useTerritoryStore((s) => s.setSelected);

  const distributors = useDistributorStore((s) => s.distributors);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = editingTerritoryId
    ? territories.find((t) => t.id === editingTerritoryId)
    : undefined;

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
      name: "",
      coverageArea: "",
      distributorId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset({
        name: editing?.name ?? `Territory ${territories.length + 1}`,
        coverageArea: editing?.coverageArea ?? "",
        distributorId: editing?.distributorId ?? "",
        notes: editing?.notes ?? "",
      });
    }
  }, [open, editing, reset, territories.length]);

  const usedDistributorIds = new Set(
    territories
      .filter((t) => t.id !== editingTerritoryId)
      .map((t) => t.distributorId)
      .filter(Boolean) as string[],
  );

  const availableDistributors = distributors.filter(
    (d) => d.status !== "inactive" && (!usedDistributorIds.has(d.id) || d.id === editing?.distributorId),
  );

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const nextDistributor = values.distributorId || undefined;
      if (editing) {
        await updateTerritory(editing.id, {
          name: values.name,
          coverageArea: values.coverageArea,
          notes: values.notes,
        });
        if (editing.distributorId !== nextDistributor) {
          await assignDistributor(editing.id, nextDistributor);
        }
      } else if (draftCoordinates && draftCoordinates.length >= 3) {
        const territory = await addTerritory({
          name: values.name,
          coverageArea: values.coverageArea,
          notes: values.notes,
          coordinates: draftCoordinates,
          distributorId: nextDistributor,
        });
        setSelected(territory.id);
      }
      setDraft(null);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || "Failed to save territory.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!editing) setDraft(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleCancel())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 text-white">
              <MapPin className="h-4 w-4" />
            </span>
            {editing ? "Edit territory" : "Assign distributor"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details and distributor assignment for this territory."
              : "Name your new territory and link it to a distributor on your network."}
          </DialogDescription>
        </DialogHeader>

        <form id="assign-territory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="territory-name">Territory name</Label>
            <Input id="territory-name" {...register("name")} placeholder="e.g. North Zone" />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage-area">Coverage area</Label>
            <Input
              id="coverage-area"
              {...register("coverageArea")}
              placeholder="Comma-separated neighbourhoods"
            />
            {errors.coverageArea && (
              <p className="text-xs text-rose-400">{errors.coverageArea.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Distributor</Label>
            <Select
              value={watch("distributorId") || "__none__"}
              onValueChange={(v) => setValue("distributorId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a distributor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {availableDistributors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: d.avatarColor }}
                      />
                      {d.name} · {d.code}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Already-assigned distributors are hidden to avoid conflicts.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              {...register("notes")}
              placeholder="Any context for the operations team…"
            />
          </div>
        </form>

        {error && (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="assign-territory-form" variant="gradient" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save changes" : "Save territory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
