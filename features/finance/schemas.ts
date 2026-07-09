import { z } from "zod";

export const expenseFormSchema = z.object({
  description: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  amount: z.string().refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n <= 99_999_999;
    },
    { message: "Monto mayor a 0" },
  ),
  categoryId: z.string(),
  branchId: z.string(),
  method: z.enum(["cash", "card", "transfer", "other"], "Método inválido"),
  spentOn: z.iso.date("Fecha inválida"),
  notes: z.string().max(300, "Máximo 300 caracteres"),
});

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;
