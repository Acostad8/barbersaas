import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres`);

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  description: optionalText(500),
  phone: optionalText(30),
  email: z.union([z.literal(""), z.email("Correo inválido")]),
  website: z.union([z.literal(""), z.url("URL inválida")]),
  instagram: optionalText(100),
  facebook: optionalText(100),
  tiktok: optionalText(100),
  whatsapp: optionalText(30),
  timezone: z.string().min(1, "Requerido"),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Código de 3 letras (ej: COP, USD)"),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "Europe/Madrid",
] as const;

export const CURRENCIES = ["COP", "MXN", "PEN", "CLP", "ARS", "USD", "EUR"] as const;
