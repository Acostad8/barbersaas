import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { ReportsDashboard } from "@/features/reports/components/ReportsDashboard";

export const metadata: Metadata = {
  title: "Reportes — BarberSaaS",
};

function isDate(v: string | undefined): v is string {
  return Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "reports:view")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const from = isDate(params.desde) ? params.desde : monthStart;
  const to = isDate(params.hasta) ? params.hasta : today;

  const supabase = await createClient();
  const { data: report, error } = await supabase.rpc("report_dashboard", {
    p_tenant_id: active.tenant.id,
    p_from: from,
    p_to: to,
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          {active.tenant.name} · {from} → {to}
        </p>
      </header>
      {error || !report ? (
        <p className="text-sm text-destructive">
          No se pudo cargar el reporte. Verifica el rango de fechas.
        </p>
      ) : (
        <ReportsDashboard
          report={report}
          from={from}
          to={to}
          currency={active.tenant.currency}
        />
      )}
    </main>
  );
}
