"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  couponFormSchema,
  loyaltyFormSchema,
  type CouponFormInput,
  type LoyaltyFormInput,
} from "@/features/marketing/schemas";

export type MarketingActionResult = { error: string } | { success: true };

export async function createCouponAction(
  input: CouponFormInput,
): Promise<MarketingActionResult> {
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    tenant_id: active.tenant.id,
    code: parsed.data.code.toUpperCase(),
    description: emptyToNull(parsed.data.description),
    discount_type: parsed.data.discountType,
    discount_value: Number(parsed.data.discountValue),
    min_purchase:
      parsed.data.minPurchase.trim() === ""
        ? 0
        : Number(parsed.data.minPurchase),
    max_uses:
      parsed.data.maxUses.trim() === "" ? null : Number(parsed.data.maxUses),
    valid_from: parsed.data.validFrom === "" ? null : parsed.data.validFrom,
    valid_until: parsed.data.validUntil === "" ? null : parsed.data.validUntil,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ese código ya existe" };
    return { error: "No se pudo crear el cupón. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

export async function setCouponActiveAction(
  couponId: string,
  isActive: boolean,
): Promise<MarketingActionResult> {
  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId)
    .eq("tenant_id", active.tenant.id);

  if (error) return { error: "No se pudo cambiar el estado del cupón" };

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

export async function saveLoyaltySettingsAction(
  input: LoyaltyFormInput,
): Promise<MarketingActionResult> {
  const parsed = loyaltyFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const active = await getActiveMembership();
  if (!active) return { error: "Sin barbería activa" };

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_settings").upsert({
    tenant_id: active.tenant.id,
    enabled: parsed.data.enabled,
    // UI expresses "points per 1000 spent"; DB stores points per unit
    earn_rate: Number(parsed.data.pointsPer1000) / 1000,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "No se pudo guardar la configuración" };

  revalidatePath("/dashboard/marketing");
  return { success: true };
}
