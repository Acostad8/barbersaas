import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import {
  FinanceDashboard,
  type ExpenseRow,
} from "@/features/finance/components/FinanceDashboard";

export const metadata: Metadata = {
  title: "Finanzas — BarberSaaS",
};

function isDate(v: string | undefined): v is string {
  return Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "finance:view")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: active.tenant.timezone,
  });
  const monthStart = today.slice(0, 8) + "01";
  const from = isDate(params.desde) ? params.desde : monthStart;
  const to = isDate(params.hasta) ? params.hasta : today;

  const supabase = await createClient();
  const [
    { data: summary, error },
    { data: expenses },
    { data: categories },
    { data: branches },
  ] = await Promise.all([
    supabase.rpc("finance_summary", {
      p_tenant_id: active.tenant.id,
      p_from: from,
      p_to: to,
    }),
    supabase
      .from("expenses")
      .select("*, expense_categories(name)")
      .eq("tenant_id", active.tenant.id)
      .gte("spent_on", from)
      .lte("spent_on", to)
      .order("spent_on", { ascending: false })
      .limit(100),
    supabase
      .from("expense_categories")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("name"),
    supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-sm text-muted-foreground">
          {active.tenant.name} · {from} → {to}
        </p>
      </header>
      {error || !summary ? (
        <p className="text-sm text-destructive">
          No se pudo cargar el resumen financiero.
        </p>
      ) : (
        <FinanceDashboard
          summary={summary}
          expenses={(expenses ?? []) as unknown as ExpenseRow[]}
          categories={categories ?? []}
          branches={branches ?? []}
          from={from}
          to={to}
          currency={active.tenant.currency}
        />
      )}
    </main>
  );
}
