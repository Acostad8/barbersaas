"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  branchFormSchema,
  daysToSchedule,
  type BranchFormInput,
} from "@/features/branches/schemas";

export type BranchActionResult = { error: string } | { success: true };

export async function createBranchAction(
  input: BranchFormInput,
): Promise<BranchActionResult> {
  const parsed = branchFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    tenant_id: active.tenant.id,
    name: parsed.data.name,
    address: emptyToNull(parsed.data.address),
    city: emptyToNull(parsed.data.city),
    phone: emptyToNull(parsed.data.phone),
    schedule: daysToSchedule(parsed.data.days),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una sede con ese nombre" };
    }
    return { error: "No se pudo crear la sede. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/sucursales");
  return { success: true };
}

export async function updateBranchAction(
  branchId: string,
  input: BranchFormInput,
): Promise<BranchActionResult> {
  const parsed = branchFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({
      name: parsed.data.name,
      address: emptyToNull(parsed.data.address),
      city: emptyToNull(parsed.data.city),
      phone: emptyToNull(parsed.data.phone),
      schedule: daysToSchedule(parsed.data.days),
    })
    .eq("id", branchId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una sede con ese nombre" };
    }
    return { error: "No se pudo actualizar la sede" };
  }

  revalidatePath("/dashboard/sucursales");
  return { success: true };
}

export async function setBranchActiveAction(
  branchId: string,
  isActive: boolean,
): Promise<BranchActionResult> {
  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ is_active: isActive })
    .eq("id", branchId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    return { error: "No se pudo cambiar el estado de la sede" };
  }

  revalidatePath("/dashboard/sucursales");
  return { success: true };
}
