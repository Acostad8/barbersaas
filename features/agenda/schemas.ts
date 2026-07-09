import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const appointmentFormSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  membershipId: z.string().min(1, "Selecciona un barbero"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  date: z.iso.date("Fecha inválida"),
  startTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)"),
  notes: z.string().max(500, "Máximo 500 caracteres"),
});

export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>;

export const cancelSchema = z.object({
  reason: z.string().max(300, "Máximo 300 caracteres"),
});

export type CancelInput = z.infer<typeof cancelSchema>;

// Valid state machine transitions; DB stays source of truth for data,
// this guards UI/action level flows.
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ["confirmed", "in_progress", "completed", "cancelled", "no_show"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from: string, to: string): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
