"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBranchAction,
  updateBranchAction,
} from "@/features/branches/actions";
import {
  branchFormSchema,
  scheduleToDays,
  DAYS,
  type BranchFormInput,
} from "@/features/branches/schemas";
import type { Branch } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BranchForm({
  branch,
  onDone,
}: {
  branch?: Branch;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BranchFormInput>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: branch
      ? {
          name: branch.name,
          address: branch.address ?? "",
          city: branch.city ?? "",
          phone: branch.phone ?? "",
          days: scheduleToDays(branch.schedule),
        }
      : {
          name: "",
          address: "",
          city: "",
          phone: "",
          days: scheduleToDays({}),
        },
  });

  const onSubmit = (data: BranchFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = branch
        ? await updateBranchAction(branch.id, data)
        : await createBranchAction(data);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        onDone();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="branch-name">Nombre</Label>
          <Input id="branch-name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-phone">Teléfono</Label>
          <Input id="branch-phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-address">Dirección</Label>
          <Input id="branch-address" {...register("address")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-city">Ciudad</Label>
          <Input id="branch-city" {...register("city")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horario semanal</Label>
        <div className="space-y-2 rounded-md border p-3">
          {DAYS.map(({ key, label }) => {
            const enabled = watch(`days.${key}.enabled`);
            const dayErrors = errors.days?.[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="flex w-28 items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`days.${key}.enabled`)} />
                  {label}
                </label>
                <Input
                  type="time"
                  className="w-28"
                  disabled={!enabled}
                  {...register(`days.${key}.open`)}
                />
                <span className="text-sm text-muted-foreground">a</span>
                <Input
                  type="time"
                  className="w-28"
                  disabled={!enabled}
                  {...register(`days.${key}.close`)}
                />
                {dayErrors?.close && (
                  <p className="text-sm text-destructive">
                    {dayErrors.close.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : branch
              ? "Guardar cambios"
              : "Crear sede"}
        </Button>
      </div>
    </form>
  );
}
