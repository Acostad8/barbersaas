import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import { ClientList } from "@/features/clients/components/ClientList";

export const metadata: Metadata = {
  title: "Clientes — BarberSaaS",
};

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "clients:view")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("tenant_id", active.tenant.id);

  if (q) {
    const escaped = q.replace(/[%_,]/g, " ").trim();
    query = query.or(
      `full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`,
    );
  }

  const { data: clients, count } = await query
    .order("full_name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Clientes de {active.tenant.name}
        </p>
      </header>
      <ClientList
        clients={clients ?? []}
        canManage={hasPermission(active.role, "clients:manage")}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}
