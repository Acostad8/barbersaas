import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import {
  InventoryDashboard,
  type MovementRow,
} from "@/features/inventory/components/InventoryDashboard";

export const metadata: Metadata = {
  title: "Inventario — BarberSaaS",
};

export default async function InventarioPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "inventory:view")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [
    { data: products },
    { data: categories },
    { data: suppliers },
    { data: branches },
    { data: levels },
    { data: movements },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("name"),
    supabase
      .from("product_categories")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .order("name"),
    supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("stock_levels")
      .select("*")
      .eq("tenant_id", active.tenant.id),
    supabase
      .from("stock_movements")
      .select("*, products(name), branches(name)")
      .eq("tenant_id", active.tenant.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Productos y stock de {active.tenant.name}
        </p>
      </header>
      <InventoryDashboard
        products={products ?? []}
        categories={categories ?? []}
        suppliers={suppliers ?? []}
        branches={branches ?? []}
        levels={levels ?? []}
        movements={(movements ?? []) as unknown as MovementRow[]}
        currency={active.tenant.currency}
      />
    </main>
  );
}
