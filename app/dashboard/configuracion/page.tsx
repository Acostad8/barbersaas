import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { TenantSettingsForm } from "@/features/settings/components/TenantSettingsForm";
import { AssetUploader } from "@/features/settings/components/AssetUploader";
import { PlanSection } from "@/features/billing/components/PlanSection";

export const metadata: Metadata = {
  title: "Configuración — BarberSaaS",
};

export default async function ConfiguracionPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "settings:manage")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: plans }, { data: subscription }] = await Promise.all([
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("tenant_subscriptions")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Datos generales de {active.tenant.name}
        </p>
      </header>

      <TenantSettingsForm tenant={active.tenant} />

      <div className="grid gap-6 md:grid-cols-2">
        <AssetUploader kind="logo" currentUrl={active.tenant.logo_url} />
        <AssetUploader kind="banner" currentUrl={active.tenant.banner_url} />
      </div>

      <PlanSection
        plans={plans ?? []}
        subscription={subscription}
        canManage={hasPermission(active.role, "tenant:manage")}
      />
    </main>
  );
}
