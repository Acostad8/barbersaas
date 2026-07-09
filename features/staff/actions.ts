"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { parseTags } from "@/features/clients/schemas";
import {
  addMemberSchema,
  barberProfileSchema,
  timeOffSchema,
  updateMemberSchema,
  type AddMemberInput,
  type BarberProfileInput,
  type TimeOffInput,
  type UpdateMemberInput,
} from "@/features/staff/schemas";
import type { TimeOffStatus } from "@/lib/supabase/types";

export type StaffActionResult = { error: string } | { success: true };

export async function addMemberAction(
  input: AddMemberInput,
): Promise<StaffActionResult> {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active || !hasPermission(active.role, "staff:manage")) {
    return { error: "Sin permisos para agregar miembros" };
  }

  // Service role only after verifying the caller manages this tenant.
  const admin = createAdminClient();
  const { data: userId, error: lookupError } = await admin.rpc(
    "get_user_id_by_email",
    { p_email: parsed.data.email },
  );

  if (lookupError) {
    return { error: "Error buscando el usuario" };
  }
  if (!userId) {
    return {
      error:
        "No existe un usuario con ese correo. Pídele que se registre primero.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("memberships").insert({
    tenant_id: active.tenant.id,
    user_id: userId,
    role: parsed.data.role,
    branch_id: parsed.data.branchId === "" ? null : parsed.data.branchId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese usuario ya es miembro de la barbería" };
    }
    return { error: "No se pudo agregar el miembro" };
  }

  revalidatePath("/dashboard/equipo");
  return { success: true };
}

export async function updateMemberAction(
  membershipId: string,
  input: UpdateMemberInput,
): Promise<StaffActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  if (membershipId === active.membershipId) {
    return { error: "No puedes editar tu propia membresía" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      role: parsed.data.role,
      branch_id: parsed.data.branchId === "" ? null : parsed.data.branchId,
      is_active: parsed.data.isActive,
    })
    .eq("id", membershipId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo actualizar el miembro" };

  revalidatePath("/dashboard/equipo");
  return { success: true };
}

export async function upsertBarberProfileAction(
  membershipId: string,
  input: BarberProfileInput,
): Promise<StaffActionResult> {
  const parsed = barberProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("barber_profiles").upsert({
    membership_id: membershipId,
    tenant_id: active.tenant.id,
    bio: emptyToNull(parsed.data.bio),
    specialties: parseTags(parsed.data.specialties),
    commission_rate:
      parsed.data.commissionRate.trim() === ""
        ? null
        : Number(parsed.data.commissionRate),
    hired_at: parsed.data.hiredAt === "" ? null : parsed.data.hiredAt,
  });

  if (error) return { error: "No se pudo guardar la ficha del barbero" };

  revalidatePath("/dashboard/equipo");
  return { success: true };
}

export async function requestTimeOffAction(
  input: TimeOffInput,
): Promise<StaffActionResult> {
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("time_off").insert({
    tenant_id: active.tenant.id,
    membership_id: active.membershipId,
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn,
    reason: emptyToNull(parsed.data.reason),
  });

  if (error) return { error: "No se pudo registrar la ausencia" };

  revalidatePath("/dashboard/equipo");
  return { success: true };
}

export async function setTimeOffStatusAction(
  timeOffId: string,
  status: Exclude<TimeOffStatus, "pending">,
): Promise<StaffActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("time_off")
    .update({ status })
    .eq("id", timeOffId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo actualizar la solicitud" };

  revalidatePath("/dashboard/equipo");
  return { success: true };
}
