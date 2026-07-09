import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

const rateField = z
  .string()
  .refine(
    (v) => {
      if (v.trim() === "") return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 100;
    },
    { message: "Entre 0 y 100" },
  );

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres"),
  categoryId: z.string(),
  durationMinutes: z.string().refine(
    (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 5 && n <= 480;
    },
    { message: "Entre 5 y 480 minutos" },
  ),
  price: z.string().refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 99_999_999;
    },
    { message: "Precio inválido" },
  ),
  commissionRate: rateField,
  taxRate: rateField,
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
