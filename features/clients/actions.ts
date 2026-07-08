"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  clientFormSchema,
  parseTags,
  type ClientFormInput,
} from "@/features/clients/schemas";

export type ClientActionResult = { error: string } | { success: true };

function toRow(data: ClientFormInput) {
  return {
    full_name: data.fullName.trim(),
    email: emptyToNull(data.email)?.toLowerCase() ?? null,
    phone: emptyToNull(data.phone),
    birthdate: data.birthdate === "" ? null : data.birthdate,
    notes: emptyToNull(data.notes),
    tags: parseTags(data.tags),
    rating: data.rating === "" ? null : Number(data.rating),
    marketing_consent: data.marketingConsent,
    whatsapp_consent: data.whatsappConsent,
  };
}

export async function createClientAction(
  input: ClientFormInput,
): Promise<ClientActionResult> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    tenant_id: active.tenant.id,
    ...toRow(parsed.data),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un cliente con ese correo" };
    }
    return { error: "No se pudo crear el cliente. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function updateClientAction(
  clientId: string,
  input: ClientFormInput,
): Promise<ClientActionResult> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(toRow(parsed.data))
    .eq("id", clientId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un cliente con ese correo" };
    }
    return { error: "No se pudo actualizar el cliente" };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function setClientActiveAction(
  clientId: string,
  isActive: boolean,
): Promise<ClientActionResult> {
  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", clientId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    return { error: "No se pudo cambiar el estado del cliente" };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}
