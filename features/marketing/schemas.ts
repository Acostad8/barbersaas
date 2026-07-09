import { z } from "zod";

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .regex(
        /^[A-Za-z0-9_-]{3,30}$/,
        "3-30 caracteres: letras, números, guiones",
      ),
    description: z.string().max(200, "Máximo 200 caracteres"),
    discountType: z.enum(["percent", "fixed"], "Tipo inválido"),
    discountValue: z.string().refine(
      (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 && n <= 99_999_999;
      },
      { message: "Valor mayor a 0" },
    ),
    minPurchase: z.string().refine(
      (v) => {
        if (v.trim() === "") return true;
        const n = Number(v);
        return Number.isFinite(n) && n >= 0;
      },
      { message: "Valor inválido" },
    ),
    maxUses: z.string().refine(
      (v) => {
        if (v.trim() === "") return true;
        const n = Number(v);
        return Number.isInteger(n) && n > 0;
      },
      { message: "Entero mayor a 0" },
    ),
    validFrom: z.union([z.literal(""), z.iso.date("Fecha inválida")]),
    validUntil: z.union([z.literal(""), z.iso.date("Fecha inválida")]),
  })
  .refine(
    (d) =>
      d.discountType !== "percent" || Number(d.discountValue) <= 100,
    { message: "Porcentaje máximo 100", path: ["discountValue"] },
  )
  .refine(
    (d) =>
      d.validFrom === "" ||
      d.validUntil === "" ||
      d.validUntil >= d.validFrom,
    { message: "Fecha final antes de la inicial", path: ["validUntil"] },
  );

export type CouponFormInput = z.infer<typeof couponFormSchema>;

export const loyaltyFormSchema = z.object({
  enabled: z.boolean(),
  pointsPer1000: z.string().refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 1000;
    },
    { message: "Entre 0 y 1000" },
  ),
});

export type LoyaltyFormInput = z.infer<typeof loyaltyFormSchema>;
