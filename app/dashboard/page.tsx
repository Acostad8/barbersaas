import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { AnalyticsHome } from "@/features/analytics/components/AnalyticsHome";

export default async function DashboardPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  const canSeeAnalytics = hasPermission(active.role, "reports:view");

  let overview = null;
  if (canSeeAnalytics) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("analytics_overview", {
      p_tenant_id: active.tenant.id,
      p_days: 30,
    });
    overview = data;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">{active.tenant.name}</h1>
        <p className="text-sm text-muted-foreground">
          {canSeeAnalytics
            ? "Resumen ejecutivo de los últimos 30 días"
            : "Bienvenido. Usa el menú para ver tu agenda."}
        </p>
      </header>
      {canSeeAnalytics && overview ? (
        <AnalyticsHome overview={overview} currency={active.tenant.currency} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Consulta tus citas del día en la sección Agenda.
        </p>
      )}
    </main>
  );
}
