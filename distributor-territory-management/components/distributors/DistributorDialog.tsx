"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useDistributorStore } from "@/store/distributorStore";
import { useTerritoryStore } from "@/store/territoryStore";
import type { Distributor } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a phone number"),
  address: z.string().min(2, "Enter an address"),
  city: z.string().min(2, "Enter a city"),
  status: z.enum(["active", "inactive", "pending"]),
  assignedTerritoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Distributor | null;
}

export function DistributorDialog({ open, onOpenChange, editing }: Props) {
  const addDistributor = useDistributorStore((s) => s.addDistributor);
  const updateDistributor = useDistributorStore((s) => s.updateDistributor);
  const assignTerritory = useDistributorStore((s) => s.assignTerritory);
  const distributors = useDistributorStore((s) => s.distributors);
  const territories = useTerritoryStore((s) => s.territories);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "Karachi",
      status: "active",
      assignedTerritoryId: "",
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset({
        name: editing?.name ?? "",
        contactPerson: editing?.contactPerson ?? "",
        email: editing?.email ?? "",
        phone: editing?.phone ?? "",
        address: editing?.address ?? "",
        city: editing?.city ?? "Karachi",
        status: editing?.status ?? "active",
        assignedTerritoryId: editing?.assignedTerritoryId ?? "",
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const nextTerritory = values.assignedTerritoryId || undefined;
      if (editing) {
        const prevTerritory = editing.assignedTerritoryId;
        await updateDistributor(editing.id, {
          name: values.name,
          contactPerson: values.contactPerson,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          status: values.status,
        });
        if (prevTerritory !== nextTerritory) {
          // assignTerritory routes through the territory API and keeps both
          // stores in sync (clearing the previous link when needed).
          await assignTerritory(editing.id, nextTerritory);
        }
      } else {
        await addDistributor({
          ...values,
          assignedTerritoryId: nextTerritory,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || "Failed to save distributor.");
    } finally {
      setSubmitting(false);
    }
  };

  const usedTerritories = new Set(
    distributors
      .filter((d) => d.id !== editing?.id)
      .map((d) => d.assignedTerritoryId)
      .filter(Boolean) as string[],
  );

  const availableTerritories = territories.filter(
    (t) =>
      !usedTerritories.has(t.id) ||
      t.id === editing?.assignedTerritoryId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-xl">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>{editing ? "Edit distributor" : "Add new distributor"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update contact details and territory assignment."
              : "Onboard a new distributor and optionally pair them to a territory."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="distributor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2 sm:px-6"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="d-name">Company name</Label>
            <Input id="d-name" {...register("name")} placeholder="Eastern Edge Trading" />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-contact">Contact person</Label>
            <Input id="d-contact" {...register("contactPerson")} placeholder="Aisha Khan" />
            {errors.contactPerson && (
              <p className="text-xs text-rose-400">{errors.contactPerson.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-email">Email</Label>
            <Input id="d-email" type="email" {...register("email")} placeholder="contact@example.com" />
            {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-phone">Phone</Label>
            <Input id="d-phone" {...register("phone")} placeholder="+92 300 1234567" />
            {errors.phone && <p className="text-xs text-rose-400">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-city">City</Label>
            <Input id="d-city" {...register("city")} placeholder="Karachi" />
            {errors.city && <p className="text-xs text-rose-400">{errors.city.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="d-address">Address</Label>
            <Input id="d-address" {...register("address")} placeholder="Office, area, landmark" />
            {errors.address && <p className="text-xs text-rose-400">{errors.address.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign territory</Label>
            <Select
              value={watch("assignedTerritoryId") || "__none__"}
              onValueChange={(v) => setValue("assignedTerritoryId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {availableTerritories.map((t) => (
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

        <div className="flex-shrink-0 border-t border-border bg-card/80 px-5 py-3 sm:px-6">
          {error && (
            <p className="mb-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              form="distributor-form"
              type="submit"
              variant="gradient"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Saving…" : editing ? "Save changes" : "Create distributor"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
