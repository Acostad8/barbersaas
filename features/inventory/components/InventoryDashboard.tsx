"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductAction,
  createProductCategoryAction,
  createSupplierAction,
  registerMovementAction,
  setProductActiveAction,
  updateProductAction,
} from "@/features/inventory/actions";
import {
  MOVEMENT_TYPES,
  movementFormSchema,
  productFormSchema,
  type MovementFormInput,
  type ProductFormInput,
} from "@/features/inventory/schemas";
import type {
  Branch,
  Product,
  ProductCategory,
  StockLevel,
  StockMovement,
  Supplier,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export type MovementRow = StockMovement & {
  products: Pick<Product, "name"> | null;
  branches: Pick<Branch, "name"> | null;
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function ProductForm({
  product,
  categories,
  suppliers,
  onDone,
}: {
  product?: Product;
  categories: ProductCategory[];
  suppliers: Supplier[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku ?? "",
          brand: product.brand ?? "",
          description: product.description ?? "",
          unit: product.unit,
          categoryId: product.category_id ?? "",
          supplierId: product.supplier_id ?? "",
          cost: String(product.cost),
          price: String(product.price),
          minStock: String(product.min_stock),
        }
      : {
          name: "",
          sku: "",
          brand: "",
          description: "",
          unit: "unidad",
          categoryId: "",
          supplierId: "",
          cost: "",
          price: "",
          minStock: "",
        },
  });

  const onSubmit = (data: ProductFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, data)
        : await createProductAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prod-name">Nombre</Label>
          <Input id="prod-name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-sku">SKU</Label>
          <Input id="prod-sku" {...register("sku")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-brand">Marca</Label>
          <Input id="prod-brand" {...register("brand")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-unit">Unidad</Label>
          <Input id="prod-unit" {...register("unit")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-category">Categoría</Label>
          <select
            id="prod-category"
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
          <Label htmlFor="prod-supplier">Proveedor</Label>
          <select
            id="prod-supplier"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("supplierId")}
          >
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-cost">Costo</Label>
          <Input id="prod-cost" type="number" min={0} step="0.01" {...register("cost")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-price">Precio de venta</Label>
          <Input id="prod-price" type="number" min={0} step="0.01" {...register("price")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-min">Stock mínimo (alerta)</Label>
          <Input id="prod-min" type="number" min={0} {...register("minStock")} />
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
          {isPending ? "Guardando..." : product ? "Guardar" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}

function MovementForm({
  products,
  branches,
  onDone,
}: {
  products: Product[];
  branches: Branch[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormInput>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      productId: "",
      branchId: "",
      movementType: "purchase",
      quantity: "1",
      unitCost: "",
      note: "",
    },
  });

  const onSubmit = (data: MovementFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerMovementAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mov-product">Producto</Label>
          <select
            id="mov-product"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("productId")}
          >
            <option value="">Selecciona...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-sm text-destructive">
              {errors.productId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mov-type">Tipo</Label>
          <select
            id="mov-type"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("movementType")}
          >
            {MOVEMENT_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.direction === "in" ? "▲" : "▼"} {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mov-branch">Sede</Label>
          <select
            id="mov-branch"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("branchId")}
          >
            <option value="">Principal</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mov-qty">Cantidad</Label>
          <Input id="mov-qty" type="number" min={0.01} step="0.01" {...register("quantity")} />
          {errors.quantity && (
            <p className="text-sm text-destructive">
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mov-cost">Costo unitario (opcional)</Label>
          <Input id="mov-cost" type="number" min={0} step="0.01" {...register("unitCost")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mov-note">Nota</Label>
          <Input id="mov-note" {...register("note")} />
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
          {isPending ? "Registrando..." : "Registrar movimiento"}
        </Button>
      </div>
    </form>
  );
}

function stockFor(levels: StockLevel[], productId: string): number {
  return levels
    .filter((l) => l.product_id === productId)
    .reduce((sum, l) => sum + Number(l.quantity), 0);
}

export function InventoryDashboard({
  products,
  categories,
  suppliers,
  branches,
  levels,
  movements,
  currency,
}: {
  products: Product[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  branches: Branch[];
  levels: StockLevel[];
  movements: MovementRow[];
  currency: string;
}) {
  const [productOpen, setProductOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newSupplier, setNewSupplier] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lowStock = products.filter(
    (p) => p.is_active && p.min_stock > 0 && stockFor(levels, p.id) <= p.min_stock,
  );

  const movementLabel = (t: string) =>
    MOVEMENT_TYPES.find((m) => m.value === t)?.label ?? t;

  return (
    <div className="space-y-8">
      {lowStock.length > 0 && (
        <section className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <h2 className="mb-2 font-medium text-amber-800">
            Alertas de stock bajo
          </h2>
          <ul className="space-y-1 text-sm text-amber-800">
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name}: {stockFor(levels, p.id)} {p.unit} (mínimo{" "}
                {p.min_stock})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Productos</h2>
          <div className="flex gap-2">
            <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                Registrar movimiento
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Movimiento de inventario</DialogTitle>
                </DialogHeader>
                <MovementForm
                  products={products.filter((p) => p.is_active)}
                  branches={branches}
                  onDone={() => setMovementOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Dialog
              open={productOpen || editing !== null}
              onOpenChange={(open) => {
                setProductOpen(open);
                if (!open) setEditing(null);
              }}
            >
              <DialogTrigger render={<Button />}>Nuevo producto</DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Editar producto" : "Nuevo producto"}
                  </DialogTitle>
                </DialogHeader>
                <ProductForm
                  product={editing ?? undefined}
                  categories={categories}
                  suppliers={suppliers}
                  onDone={() => {
                    setProductOpen(false);
                    setEditing(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin productos. Crea el primero para controlar tu inventario.
          </p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-md border p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {p.name}
                    {p.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.sku}
                      </span>
                    )}
                    {!p.is_active && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {stockFor(levels, p.id)} {p.unit} ·{" "}
                    {formatPrice(p.price, currency)}
                    {p.brand ? ` · ${p.brand}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    checked={p.is_active}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      startTransition(async () => {
                        await setProductActiveAction(p.id, checked);
                      })
                    }
                    aria-label={`Activar o desactivar ${p.name}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(p)}
                  >
                    Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setInlineError(null);
            startTransition(async () => {
              const result = await createSupplierAction(newSupplier);
              if ("error" in result) setInlineError(result.error);
              else setNewSupplier("");
            });
          }}
        >
          <Input
            value={newSupplier}
            onChange={(e) => setNewSupplier(e.target.value)}
            placeholder="Nuevo proveedor..."
          />
          <Button type="submit" variant="outline" disabled={isPending}>
            Agregar
          </Button>
        </form>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setInlineError(null);
            startTransition(async () => {
              const result = await createProductCategoryAction(newCategory);
              if ("error" in result) setInlineError(result.error);
              else setNewCategory("");
            });
          }}
        >
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría de producto..."
          />
          <Button type="submit" variant="outline" disabled={isPending}>
            Agregar
          </Button>
        </form>
        {inlineError && (
          <p className="text-sm text-destructive md:col-span-2">
            {inlineError}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Kardex reciente</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {movements.map((m) => {
              const dir = MOVEMENT_TYPES.find(
                (t) => t.value === m.movement_type,
              )?.direction;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span>
                    <span
                      className={
                        dir === "in" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {dir === "in" ? "▲" : "▼"}
                    </span>{" "}
                    {m.products?.name} · {movementLabel(m.movement_type)} ·{" "}
                    {Number(m.quantity)}
                    {m.branches?.name ? ` · ${m.branches.name}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
