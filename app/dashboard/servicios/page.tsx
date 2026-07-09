import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { ServiceCatalog } from "@/features/services/components/ServiceCatalog";

export const metadata: Metadata = {
  title: "Servicios — BarberSaaS",
};

export default async function ServiciosPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "services:view")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("name"),
    supabase
      .from("service_categories")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("sort_order")
      .order("name"),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de {active.tenant.name}
        </p>
      </header>
      <ServiceCatalog
        services={services ?? []}
        categories={categories ?? []}
        currency={active.tenant.currency}
        canManage={hasPermission(active.role, "services:manage")}
      />
    </main>
  );
}
