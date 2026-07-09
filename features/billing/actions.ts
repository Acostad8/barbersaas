"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";

export type BillingActionResult = { error: string } | { success: true };

export async function changePlanAction(
  planId: string,
): Promise<BillingActionResult> {
  const active = await getActiveMembership();
  if (!active || !hasPermission(active.role, "tenant:manage")) {
    return { error: "Solo el administrador puede cambiar el plan" };
  }

  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return { error: "Plan no encontrado" };

  // Downgrade guard: current usage must fit the target plan limits.
  const [{ count: branchCount }, { count: staffCount }] = await Promise.all([
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true),
  ]);

  if ((branchCount ?? 0) > plan.max_branches) {
    return {
      error: `Tienes ${branchCount} sedes activas y el plan ${plan.name} permite ${plan.max_branches}. Desactiva sedes primero.`,
    };
  }
  if ((staffCount ?? 0) > plan.max_staff) {
    return {
      error: `Tienes ${staffCount} miembros activos y el plan ${plan.name} permite ${plan.max_staff}. Desactiva miembros primero.`,
    };
  }

  // No payment gateway wired yet: the change is immediate. When a gateway
  // lands, this becomes "create checkout session" for paid plans.
  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      plan_id: plan.id,
      status: "active",
      cancelled_at: null,
    })
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo cambiar el plan" };

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}
