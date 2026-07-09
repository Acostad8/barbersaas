"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  appointmentFormSchema,
  canTransition,
  cancelSchema,
  type AppointmentFormInput,
} from "@/features/agenda/schemas";
import type { AppointmentStatus } from "@/lib/supabase/types";

export type AgendaActionResult = { error: string } | { success: true };

export async function createAppointmentAction(
  input: AppointmentFormInput,
): Promise<AgendaActionResult> {
  const parsed = appointmentFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();

  // Duration and price come from the service row, never from the client.
  const { data: service, error: svcErr } = await supabase
    .from("services")
    .select("duration_minutes, price, is_active")
    .eq("id", parsed.data.serviceId)
    .eq("tenant_id", active.tenant.id)
    .single();

  if (svcErr || !service) return { error: "Servicio no encontrado" };
  if (!service.is_active) return { error: "El servicio está inactivo" };

  const startsAt = new Date(
    `${parsed.data.date}T${parsed.data.startTime}:00`,
  );
  if (Number.isNaN(startsAt.getTime())) return { error: "Fecha inválida" };
  const endsAt = new Date(
    startsAt.getTime() + service.duration_minutes * 60_000,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("appointments").insert({
    tenant_id: active.tenant.id,
    client_id: parsed.data.clientId,
    membership_id: parsed.data.membershipId,
    service_id: parsed.data.serviceId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    price: service.price,
    notes: emptyToNull(parsed.data.notes),
    created_by: user?.id ?? null,
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "El barbero ya tiene una cita en ese horario" };
    }
    return { error: "No se pudo crear la cita. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
  cancelReason?: string,
): Promise<AgendaActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();

  const { data: current, error: curErr } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", appointmentId)
    .eq("tenant_id", active.tenant.id)
    .single();

  if (curErr || !current) return { error: "Cita no encontrada" };
  if (!canTransition(current.status, status)) {
    return { error: `No se puede pasar de ${current.status} a ${status}` };
  }

  let reason: string | null = null;
  if (status === "cancelled") {
    const parsedReason = cancelSchema.safeParse({ reason: cancelReason ?? "" });
    if (!parsedReason.success) return { error: "Motivo inválido" };
    reason = emptyToNull(parsedReason.data.reason);
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      ...(status === "cancelled" ? { cancel_reason: reason } : {}),
    })
    .eq("id", appointmentId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo actualizar la cita" };

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  date: string,
  startTime: string,
): Promise<AgendaActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return { error: "Fecha u hora inválida" };
  }

  const supabase = await createClient();
  const { data: appt, error: getErr } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("id", appointmentId)
    .eq("tenant_id", active.tenant.id)
    .single();

  if (getErr || !appt) return { error: "Cita no encontrada" };
  if (appt.status === "completed" || appt.status === "cancelled") {
    return { error: "No se puede reagendar una cita finalizada" };
  }

  const durationMs =
    new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime();
  const startsAt = new Date(`${date}T${startTime}:00`);
  if (Number.isNaN(startsAt.getTime())) return { error: "Fecha inválida" };

  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + durationMs).toISOString(),
    })
    .eq("id", appointmentId)
    .eq("tenant_id", active.tenant.id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "El barbero ya tiene una cita en ese horario" };
    }
    return { error: "No se pudo reagendar la cita" };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}
