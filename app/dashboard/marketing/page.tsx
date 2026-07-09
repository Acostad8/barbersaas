import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { MarketingDashboard } from "@/features/marketing/components/MarketingDashboard";

export const metadata: Metadata = {
  title: "Marketing — BarberSaaS",
};

export default async function MarketingPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "marketing:manage")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: coupons }, { data: settings }, { data: segments }] =
    await Promise.all([
      supabase
        .from("coupons")
        .select("*")
        .eq("tenant_id", active.tenant.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("loyalty_settings")
        .select("*")
        .eq("tenant_id", active.tenant.id)
        .maybeSingle(),
      supabase.rpc("client_segments", { p_tenant_id: active.tenant.id }),
    ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Marketing y fidelización</h1>
        <p className="text-sm text-muted-foreground">
          Cupones, puntos y segmentos de {active.tenant.name}
        </p>
      </header>
      <MarketingDashboard
        coupons={coupons ?? []}
        settings={settings}
        segments={segments ?? []}
        currency={active.tenant.currency}
      />
    </main>
  );
}
