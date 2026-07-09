"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import type { PaymentMethod } from "@/lib/supabase/types";

export type PosActionResult<T = undefined> =
  | { error: string }
  | { success: true; data?: T };

const RPC_ERRORS: Record<string, string> = {
  forbidden: "Sin permisos para operar la caja",
  invalid_amount: "Monto inválido",
  session_already_open: "Ya hay una caja abierta",
  session_not_found: "Caja no encontrada",
  session_already_closed: "La caja ya está cerrada",
  session_not_open: "No hay una caja abierta",
  empty_sale: "La venta no tiene ítems",
  invalid_item: "Ítem inválido",
  invalid_item_type: "Tipo de ítem inválido",
  service_not_found: "Servicio no encontrado",
  product_not_found: "Producto no encontrado",
  discount_exceeds_line: "El descuento supera el valor de la línea",
  insufficient_stock: "Stock insuficiente para un producto",
  invalid_payment: "Pago inválido",
  payments_mismatch: "Los pagos no cuadran con el total",
  invalid_tip: "Propina inválida",
  client_not_found: "Cliente no encontrado",
};

function friendlyError(message: string): string {
  for (const [key, value] of Object.entries(RPC_ERRORS)) {
    if (message.includes(key)) return value;
  }
  return "Operación fallida. Intenta de nuevo.";
}

export async function openSessionAction(
  branchId: string,
  openingAmount: number,
): Promise<PosActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("open_cash_session", {
    p_tenant_id: active.tenant.id,
    p_branch_id: branchId === "" ? null : branchId,
    p_opening_amount: openingAmount,
  });

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/dashboard/pos");
  return { success: true };
}

export async function closeSessionAction(
  sessionId: string,
  closingAmount: number,
  notes: string,
): Promise<PosActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_cash_session", {
    p_session_id: sessionId,
    p_closing_amount: closingAmount,
    p_notes: notes.trim() === "" ? null : notes.trim(),
  });

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/dashboard/pos");
  return { success: true };
}

export type SaleLine = {
  type: "service" | "product";
  id: string;
  quantity: number;
  discount: number;
};

export type SalePaymentInput = { method: PaymentMethod; amount: number };

export async function createSaleAction(input: {
  sessionId: string;
  items: SaleLine[];
  payments: SalePaymentInput[];
  tip: number;
  clientId: string | null;
  notes: string;
}): Promise<PosActionResult<{ sale_number: number; total: number }>> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  if (input.items.length === 0) return { error: "La venta no tiene ítems" };
  if (input.payments.length === 0) return { error: "Agrega al menos un pago" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sale", {
    p_tenant_id: active.tenant.id,
    p_session_id: input.sessionId,
    p_payload: {
      items: input.items,
      payments: input.payments,
      tip: input.tip,
      client_id: input.clientId,
      notes: input.notes.trim() === "" ? null : input.notes.trim(),
    },
  });

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/dashboard/pos");
  return {
    success: true,
    data: { sale_number: data.sale_number, total: data.total },
  };
}
