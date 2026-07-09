import { z } from "zod";
import type { MemberRole } from "@/lib/supabase/types";

export const STAFF_ROLES: { value: MemberRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Gerente" },
  { value: "receptionist", label: "Recepcionista" },
  { value: "barber", label: "Barbero" },
  { value: "accountant", label: "Contador" },
];

const roleValues = [
  "admin",
  "manager",
  "receptionist",
  "barber",
  "accountant",
] as const;

export const addMemberSchema = z.object({
  email: z.email("Correo inválido"),
  role: z.enum(roleValues, "Rol inválido"),
  branchId: z.string(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(roleValues, "Rol inválido"),
  branchId: z.string(),
  isActive: z.boolean(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const barberProfileSchema = z.object({
  bio: z.string().max(500, "Máximo 500 caracteres"),
  specialties: z.string().max(300, "Máximo 300 caracteres"),
  commissionRate: z.string().refine(
    (v) => {
      if (v.trim() === "") return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 100;
    },
    { message: "Entre 0 y 100" },
  ),
  hiredAt: z.union([z.literal(""), z.iso.date("Fecha inválida")]),
});

export type BarberProfileInput = z.infer<typeof barberProfileSchema>;

export const timeOffSchema = z
  .object({
    startsOn: z.iso.date("Fecha inválida"),
    endsOn: z.iso.date("Fecha inválida"),
    reason: z.string().max(300, "Máximo 300 caracteres"),
  })
  .refine((d) => d.endsOn >= d.startsOn, {
    message: "La fecha final debe ser igual o posterior a la inicial",
    path: ["endsOn"],
  });

export type TimeOffInput = z.infer<typeof timeOffSchema>;
