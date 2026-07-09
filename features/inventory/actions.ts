"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  movementFormSchema,
  productFormSchema,
  type MovementFormInput,
  type ProductFormInput,
} from "@/features/inventory/schemas";

export type InventoryActionResult = { error: string } | { success: true };

function toProductRow(data: ProductFormInput) {
  return {
    name: data.name.trim(),
    sku: emptyToNull(data.sku),
    brand: emptyToNull(data.brand),
    description: emptyToNull(data.description),
    unit: data.unit.trim(),
    category_id: data.categoryId === "" ? null : data.categoryId,
    supplier_id: data.supplierId === "" ? null : data.supplierId,
    cost: data.cost.trim() === "" ? 0 : Number(data.cost),
    price: data.price.trim() === "" ? 0 : Number(data.price),
    min_stock: data.minStock.trim() === "" ? 0 : Number(data.minStock),
  };
}

export async function createProductAction(
  input: ProductFormInput,
): Promise<InventoryActionResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    tenant_id: active.tenant.id,
    ...toProductRow(parsed.data),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un producto con ese nombre o SKU" };
    }
    return { error: "No se pudo crear el producto. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function updateProductAction(
  productId: string,
  input: ProductFormInput,
): Promise<InventoryActionResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(toProductRow(parsed.data))
    .eq("id", productId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un producto con ese nombre o SKU" };
    }
    return { error: "No se pudo actualizar el producto" };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function setProductActiveAction(
  productId: string,
  isActive: boolean,
): Promise<InventoryActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo cambiar el estado del producto" };

  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function registerMovementAction(
  input: MovementFormInput,
): Promise<InventoryActionResult> {
  const parsed = movementFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("stock_movements").insert({
    tenant_id: active.tenant.id,
    product_id: parsed.data.productId,
    branch_id: parsed.data.branchId === "" ? null : parsed.data.branchId,
    movement_type: parsed.data.movementType,
    quantity: Number(parsed.data.quantity),
    unit_cost:
      parsed.data.unitCost.trim() === "" ? null : Number(parsed.data.unitCost),
    note: emptyToNull(parsed.data.note),
    created_by: user?.id ?? null,
  });

  if (error) {
    if (error.message.includes("insufficient_stock")) {
      return { error: "Stock insuficiente para esa salida" };
    }
    return { error: "No se pudo registrar el movimiento" };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function createSupplierAction(
  name: string,
): Promise<InventoryActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 120) {
    return { error: "Nombre inválido" };
  }

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    tenant_id: active.tenant.id,
    name: trimmed,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ese proveedor ya existe" };
    return { error: "No se pudo crear el proveedor" };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true };
}

export async function createProductCategoryAction(
  name: string,
): Promise<InventoryActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { error: "Nombre inválido" };
  }

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert({
    tenant_id: active.tenant.id,
    name: trimmed,
  });

  if (error) {
    if (error.code === "23505") return { error: "Esa categoría ya existe" };
    return { error: "No se pudo crear la categoría" };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true };
}
