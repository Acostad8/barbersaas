"use client";

import { useState, useTransition } from "react";
import { setBranchActiveAction } from "@/features/branches/actions";
import { BranchForm } from "@/features/branches/components/BranchForm";
import { DAYS } from "@/features/branches/schemas";
import type { Branch } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

function scheduleSummary(branch: Branch): string {
  const openDays = DAYS.filter(({ key }) => branch.schedule[key]?.length);
  if (openDays.length === 0) return "Sin horario configurado";
  return openDays
    .map(({ key, label }) => {
      const range = branch.schedule[key]?.[0];
      return `${label.slice(0, 3)} ${range?.open}–${range?.close}`;
    })
    .join(" · ");
}

function BranchRow({ branch, canManage }: { branch: Branch; canManage: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div className="min-w-0">
        <p className="font-medium">
          {branch.name}
          {!branch.is_active && (
            <span className="ml-2 text-xs text-muted-foreground">
              (inactiva)
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {[branch.address, branch.city].filter(Boolean).join(", ") ||
            "Sin dirección"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {scheduleSummary(branch)}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-3">
          <Switch
            checked={branch.is_active}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await setBranchActiveAction(branch.id, checked);
              })
            }
            aria-label={`Activar o desactivar ${branch.name}`}
          />
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Editar
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar sede</DialogTitle>
              </DialogHeader>
              <BranchForm branch={branch} onDone={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </li>
  );
}

export function BranchList({
  branches,
  canManage,
}: {
  branches: Branch[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Nueva sede</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva sede</DialogTitle>
              </DialogHeader>
              <BranchForm onDone={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {branches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay sedes. Crea la primera para organizar empleados, agenda e
          inventario por ubicación.
        </p>
      ) : (
        <ul className="space-y-2">
          {branches.map((b) => (
            <BranchRow key={b.id} branch={b} canManage={canManage} />
          ))}
        </ul>
      )}
    </div>
  );
}
