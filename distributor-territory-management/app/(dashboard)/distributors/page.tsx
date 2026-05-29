"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DistributorDialog } from "@/components/distributors/DistributorDialog";
import { ConfirmDeleteDialog } from "@/components/distributors/ConfirmDeleteDialog";
import { useDistributorStore } from "@/store/distributorStore";
import { useTerritoryStore } from "@/store/territoryStore";
import type { Distributor, DistributorStatus } from "@/types";
import { initials } from "@/lib/utils";

const statusVariant: Record<DistributorStatus, "success" | "warning" | "danger"> = {
  active: "success",
  pending: "warning",
  inactive: "danger",
};

const PAGE_SIZE = 6;

export default function DistributorsPage() {
  const distributors = useDistributorStore((s) => s.distributors);
  const removeDistributor = useDistributorStore((s) => s.removeDistributor);
  const territories = useTerritoryStore((s) => s.territories);
  const assignDistributorToTerritory = useTerritoryStore((s) => s.assignDistributor);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Distributor | null>(null);

  const territoryMap = useMemo(
    () => Object.fromEntries(territories.map((t) => [t.id, t])),
    [territories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return distributors;
    return distributors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.contactPerson.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q),
    );
  }, [query, distributors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (d: Distributor) => {
    setEditing(d);
    setDialogOpen(true);
  };

  const confirmDelete = (d: Distributor) => setDeleteTarget(d);

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.assignedTerritoryId) {
      assignDistributorToTerritory(deleteTarget.assignedTerritoryId, undefined);
    }
    removeDistributor(deleteTarget.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Distributor network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Onboard, edit, and assign distributors to operational territories.
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add distributor
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{filtered.length} distributors</CardTitle>
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, contact…"
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distributor</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No distributors match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                slice.map((d) => {
                  const territory = d.assignedTerritoryId
                    ? territoryMap[d.assignedTerritoryId]
                    : undefined;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10" style={{ background: d.avatarColor }}>
                            <AvatarFallback className="bg-transparent text-xs text-white">
                              {initials(d.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{d.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {d.contactPerson}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-secondary/60 px-2 py-1 font-mono text-xs">
                          {d.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {d.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {d.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {territory ? (
                          <span className="inline-flex items-center gap-2 text-xs">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: territory.color }}
                            />
                            {territory.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[d.status]} className="capitalize">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-400 hover:text-rose-300"
                            onClick={() => confirmDelete(d)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DistributorDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete distributor?"
        description={
          deleteTarget
            ? `This removes ${deleteTarget.name} from the network. The assigned territory will become unassigned.`
            : ""
        }
      />
    </div>
  );
}
