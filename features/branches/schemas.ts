import { z } from "zod";
import type { DayKey, WeeklySchedule } from "@/lib/supabase/types";

export const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = z
  .object({
    enabled: z.boolean(),
    open: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)"),
    close: z.string().regex(TIME_REGEX, "Hora inválida (HH:MM)"),
  })
  .refine((d) => !d.enabled || d.open < d.close, {
    message: "La apertura debe ser antes del cierre",
    path: ["close"],
  });

const optionalText = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres`);

export const branchFormSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  address: optionalText(200),
  city: optionalText(100),
  phone: optionalText(30),
  days: z.object({
    mon: daySchema,
    tue: daySchema,
    wed: daySchema,
    thu: daySchema,
    fri: daySchema,
    sat: daySchema,
    sun: daySchema,
  }),
});

export type BranchFormInput = z.infer<typeof branchFormSchema>;

export function daysToSchedule(days: BranchFormInput["days"]): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (const { key } of DAYS) {
    const day = days[key];
    if (day.enabled) {
      schedule[key] = [{ open: day.open, close: day.close }];
    }
  }
  return schedule;
}

export function scheduleToDays(
  schedule: WeeklySchedule,
): BranchFormInput["days"] {
  const result = {} as BranchFormInput["days"];
  for (const { key } of DAYS) {
    const ranges = schedule[key];
    const first = ranges?.[0];
    result[key] = first
      ? { enabled: true, open: first.open, close: first.close }
      : { enabled: false, open: "09:00", close: "19:00" };
  }
  return result;
}
