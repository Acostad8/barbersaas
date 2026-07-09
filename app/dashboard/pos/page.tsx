import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { PosTerminal } from "@/features/pos/components/PosTerminal";

export const metadata: Metadata = {
  title: "POS — BarberSaaS",
};

export default async function PosPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "pos:operate")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [
    { data: openSessions },
    { data: branches },
    { data: services },
    { data: products },
    { data: clients },
    { data: recentSales },
  ] = await Promise.all([
    supabase
      .from("cash_sessions")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .is("closed_at", null)
      .limit(1),
    supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("services")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("clients")
      .select("id, full_name")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("full_name")
      .limit(500),
    supabase
      .from("sales")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Punto de venta</h1>
        <p className="text-sm text-muted-foreground">
          Caja de {active.tenant.name}
        </p>
      </header>
      <PosTerminal
        session={openSessions?.[0] ?? null}
        branches={branches ?? []}
        services={services ?? []}
        products={products ?? []}
        clients={clients ?? []}
        recentSales={recentSales ?? []}
        currency={active.tenant.currency}
      />
    </main>
  );
}
