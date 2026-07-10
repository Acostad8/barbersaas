import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { AnalyticsHome } from "@/features/analytics/components/AnalyticsHome";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const today = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
            {today}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            {active.tenant.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {canSeeAnalytics
              ? "Resumen ejecutivo de los últimos 30 días"
              : "Bienvenido. Este es tu espacio de trabajo."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/agenda">
            <Button variant="outline">Ver agenda</Button>
          </Link>
          {canSeeAnalytics && (
            <Link href="/dashboard/pos">
              <Button>Nueva venta</Button>
            </Link>
          )}
          <a
            href={`/reservar/${active.tenant.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost">
              Página de reservas
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 11 11 3M5 3h6v6"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </a>
        </div>
      </header>

      {canSeeAnalytics && overview ? (
        <AnalyticsHome overview={overview} currency={active.tenant.currency} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2">
              <p className="font-heading text-lg font-medium">Tu agenda</p>
              <p className="text-sm text-muted-foreground">
                Consulta y gestiona tus citas del día.
              </p>
              <Link
                href="/dashboard/agenda"
                className="inline-block text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                Ir a la agenda →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2">
              <p className="font-heading text-lg font-medium">Clientes</p>
              <p className="text-sm text-muted-foreground">
                Busca clientes y revisa sus datos de contacto.
              </p>
              <Link
                href="/dashboard/clientes"
                className="inline-block text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                Ver clientes →
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
