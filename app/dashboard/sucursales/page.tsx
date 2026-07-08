import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { BranchList } from "@/features/branches/components/BranchList";

export const metadata: Metadata = {
  title: "Sucursales — BarberSaaS",
};

export default async function SucursalesPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", active.tenant.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Sucursales</h1>
        <p className="text-sm text-muted-foreground">
          Sedes de {active.tenant.name}
        </p>
      </header>
      <BranchList
        branches={branches ?? []}
        canManage={hasPermission(active.role, "branches:manage")}
      />
    </main>
  );
}
