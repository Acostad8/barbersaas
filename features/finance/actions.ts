"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  expenseFormSchema,
  type ExpenseFormInput,
} from "@/features/finance/schemas";

export type FinanceActionResult = { error: string } | { success: true };

export async function createExpenseAction(
  input: ExpenseFormInput,
): Promise<FinanceActionResult> {
  const parsed = expenseFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({
    tenant_id: active.tenant.id,
    description: parsed.data.description.trim(),
    amount: Number(parsed.data.amount),
    category_id: parsed.data.categoryId === "" ? null : parsed.data.categoryId,
    branch_id: parsed.data.branchId === "" ? null : parsed.data.branchId,
    method: parsed.data.method,
    spent_on: parsed.data.spentOn,
    notes: emptyToNull(parsed.data.notes),
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: "No se pudo registrar el egreso. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/finanzas");
  return { success: true };
}

export async function deleteExpenseAction(
  expenseId: string,
): Promise<FinanceActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo eliminar el egreso" };

  revalidatePath("/dashboard/finanzas");
  return { success: true };
}

export async function createExpenseCategoryAction(
  name: string,
): Promise<FinanceActionResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { error: "Nombre inválido" };
  }

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({
    tenant_id: active.tenant.id,
    name: trimmed,
  });

  if (error) {
    if (error.code === "23505") return { error: "Esa categoría ya existe" };
    return { error: "No se pudo crear la categoría" };
  }

  revalidatePath("/dashboard/finanzas");
  return { success: true };
}
