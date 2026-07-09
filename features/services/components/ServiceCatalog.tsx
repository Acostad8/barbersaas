"use client";

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  setServiceActiveAction,
} from "@/features/services/actions";
import { ServiceForm } from "@/features/services/components/ServiceForm";
import type { Service, ServiceCategory } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function ServiceRow({
  service,
  categories,
  currency,
  canManage,
}: {
  service: Service;
  categories: ServiceCategory[];
  currency: string;
  canManage: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div className="min-w-0">
        <p className="font-medium">
          {service.name}
          {!service.is_active && (
            <span className="ml-2 text-xs text-muted-foreground">
              (inactivo)
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(service.price, currency)} · {service.duration_minutes}{" "}
          min
          {service.commission_rate > 0 &&
            ` · comisión ${service.commission_rate}%`}
          {service.tax_rate > 0 && ` · imp. ${service.tax_rate}%`}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-3">
          <Switch
            checked={service.is_active}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await setServiceActiveAction(service.id, checked);
              })
            }
            aria-label={`Activar o desactivar ${service.name}`}
          />
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Editar
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar servicio</DialogTitle>
              </DialogHeader>
              <ServiceForm
                service={service}
                categories={categories}
                onDone={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </li>
  );
}

export function ServiceCatalog({
  services,
  categories,
  currency,
  canManage,
}: {
  services: Service[];
  categories: ServiceCategory[];
  currency: string;
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uncategorized = services.filter((s) => !s.category_id);
  const byCategory = categories.map((c) => ({
    category: c,
    items: services.filter((s) => s.category_id === c.id),
  }));

  const sections = [
    ...byCategory,
    ...(uncategorized.length > 0
      ? [{ category: null, items: uncategorized }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCategoryError(null);
              startTransition(async () => {
                const result = await createCategoryAction({
                  name: newCategory,
                });
                if ("error" in result) {
                  setCategoryError(result.error);
                } else {
                  setNewCategory("");
                }
              });
            }}
          >
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría..."
              className="w-56"
            />
            <Button type="submit" variant="outline" disabled={isPending}>
              Agregar
            </Button>
            {categoryError && (
              <p className="self-center text-sm text-destructive">
                {categoryError}
              </p>
            )}
          </form>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Nuevo servicio</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo servicio</DialogTitle>
              </DialogHeader>
              <ServiceForm
                categories={categories}
                onDone={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {services.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aún no hay servicios. Crea el primero para armar tu catálogo.
        </p>
      )}

      {sections.map(({ category, items }) => (
        <section key={category?.id ?? "uncategorized"} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">
              {category?.name ?? "Sin categoría"}
            </h2>
            {canManage && category && items.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCategoryAction(category.id);
                  })
                }
              >
                Eliminar
              </Button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin servicios en esta categoría.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  categories={categories}
                  currency={currency}
                  canManage={canManage}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
