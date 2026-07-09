"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  categoryFormSchema,
  serviceFormSchema,
  type CategoryFormInput,
  type ServiceFormInput,
} from "@/features/services/schemas";

export type ServiceActionResult = { error: string } | { success: true };

export async function createCategoryAction(
  input: CategoryFormInput,
): Promise<ServiceActionResult> {
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("service_categories").insert({
    tenant_id: active.tenant.id,
    name: parsed.data.name.trim(),
  });

  if (error) {
    if (error.code === "23505") return { error: "Esa categoría ya existe" };
    return { error: "No se pudo crear la categoría" };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<ServiceActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", categoryId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo eliminar la categoría" };

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

function toServiceRow(data: ServiceFormInput) {
  return {
    name: data.name.trim(),
    description: emptyToNull(data.description),
    category_id: data.categoryId === "" ? null : data.categoryId,
    duration_minutes: Number(data.durationMinutes),
    price: Number(data.price),
    commission_rate: data.commissionRate.trim() === "" ? 0 : Number(data.commissionRate),
    tax_rate: data.taxRate.trim() === "" ? 0 : Number(data.taxRate),
  };
}

export async function createServiceAction(
  input: ServiceFormInput,
): Promise<ServiceActionResult> {
  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    tenant_id: active.tenant.id,
    ...toServiceRow(parsed.data),
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un servicio con ese nombre" };
    return { error: "No se pudo crear el servicio. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function updateServiceAction(
  serviceId: string,
  input: ServiceFormInput,
): Promise<ServiceActionResult> {
  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update(toServiceRow(parsed.data))
    .eq("id", serviceId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un servicio con ese nombre" };
    return { error: "No se pudo actualizar el servicio" };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function setServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<ServiceActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo cambiar el estado del servicio" };

  revalidatePath("/dashboard/servicios");
  return { success: true };
}
