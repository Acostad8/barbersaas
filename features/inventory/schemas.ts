import { z } from "zod";
import type { StockMovementType } from "@/lib/supabase/types";

const moneyField = z.string().refine(
  (v) => {
    if (v.trim() === "") return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 99_999_999;
  },
  { message: "Valor inválido" },
);

export const productFormSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  sku: z.string().max(60, "Máximo 60 caracteres"),
  brand: z.string().max(80, "Máximo 80 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres"),
  unit: z.string().min(1, "Requerido").max(20, "Máximo 20 caracteres"),
  categoryId: z.string(),
  supplierId: z.string(),
  cost: moneyField,
  price: moneyField,
  minStock: z.string().refine(
    (v) => {
      if (v.trim() === "") return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 1_000_000;
    },
    { message: "Valor inválido" },
  ),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const MOVEMENT_TYPES: {
  value: StockMovementType;
  label: string;
  direction: "in" | "out";
}[] = [
  { value: "purchase", label: "Compra", direction: "in" },
  { value: "adjustment_in", label: "Ajuste (entrada)", direction: "in" },
  { value: "transfer_in", label: "Traslado (entrada)", direction: "in" },
  { value: "sale", label: "Venta manual", direction: "out" },
  { value: "adjustment_out", label: "Ajuste (salida)", direction: "out" },
  { value: "transfer_out", label: "Traslado (salida)", direction: "out" },
  { value: "loss", label: "Pérdida/merma", direction: "out" },
];

const movementValues = MOVEMENT_TYPES.map((m) => m.value) as [
  StockMovementType,
  ...StockMovementType[],
];

export const movementFormSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  branchId: z.string(),
  movementType: z.enum(movementValues, "Tipo inválido"),
  quantity: z.string().refine(
    (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n <= 1_000_000;
    },
    { message: "Cantidad mayor a 0" },
  ),
  unitCost: moneyField,
  note: z.string().max(300, "Máximo 300 caracteres"),
});

export type MovementFormInput = z.infer<typeof movementFormSchema>;
