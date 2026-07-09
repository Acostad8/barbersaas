"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createServiceAction,
  updateServiceAction,
} from "@/features/services/actions";
import {
  serviceFormSchema,
  type ServiceFormInput,
} from "@/features/services/schemas";
import type { Service, ServiceCategory } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ServiceForm({
  service,
  categories,
  onDone,
}: {
  service?: Service;
  categories: ServiceCategory[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? "",
          categoryId: service.category_id ?? "",
          durationMinutes: String(service.duration_minutes),
          price: String(service.price),
          commissionRate: String(service.commission_rate),
          taxRate: String(service.tax_rate),
        }
      : {
          name: "",
          description: "",
          categoryId: "",
          durationMinutes: "30",
          price: "",
          commissionRate: "",
          taxRate: "",
        },
  });

  const onSubmit = (data: ServiceFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = service
        ? await updateServiceAction(service.id, data)
        : await createServiceAction(data);
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
          <Label htmlFor="service-name">Nombre</Label>
          <Input id="service-name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-category">Categoría</Label>
          <select
            id="service-category"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("categoryId")}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-duration">Duración (minutos)</Label>
          <Input
            id="service-duration"
            type="number"
            min={5}
            max={480}
            step={5}
            {...register("durationMinutes")}
          />
          {errors.durationMinutes && (
            <p className="text-sm text-destructive">
              {errors.durationMinutes.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-price">Precio</Label>
          <Input
            id="service-price"
            type="number"
            min={0}
            step="0.01"
            {...register("price")}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-commission">Comisión (%)</Label>
          <Input
            id="service-commission"
            type="number"
            min={0}
            max={100}
            step="0.5"
            placeholder="0"
            {...register("commissionRate")}
          />
          {errors.commissionRate && (
            <p className="text-sm text-destructive">
              {errors.commissionRate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-tax">Impuesto (%)</Label>
          <Input
            id="service-tax"
            type="number"
            min={0}
            max={100}
            step="0.5"
            placeholder="0"
            {...register("taxRate")}
          />
          {errors.taxRate && (
            <p className="text-sm text-destructive">{errors.taxRate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Descripción</Label>
        <Textarea id="service-description" rows={2} {...register("description")} />
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
            : service
              ? "Guardar cambios"
              : "Crear servicio"}
        </Button>
      </div>
    </form>
  );
}
