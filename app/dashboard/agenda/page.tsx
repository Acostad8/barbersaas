import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import {
  AgendaDay,
  type AgendaAppointment,
  type BarberOption,
} from "@/features/agenda/components/AgendaDay";

export const metadata: Metadata = {
  title: "Agenda — BarberSaaS",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  const canManage = hasPermission(active.role, "schedule:manage");
  const canViewOwn = hasPermission(active.role, "schedule:view-own");
  if (!canManage && !canViewOwn) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.fecha ?? "")
    ? (params.fecha as string)
    : new Date().toISOString().slice(0, 10);

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const supabase = await createClient();
  const [
    { data: appointments },
    { data: barberMemberships },
    { data: clients },
    { data: services },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, clients(full_name), services(name)")
      .eq("tenant_id", active.tenant.id)
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString())
      .order("starts_at"),
    supabase
      .from("memberships")
      .select("id, role, is_active, profiles(full_name)")
      .eq("tenant_id", active.tenant.id)
      .eq("role", "barber")
      .eq("is_active", true),
    canManage
      ? supabase
          .from("clients")
          .select("id, full_name")
          .eq("tenant_id", active.tenant.id)
          .eq("is_active", true)
          .order("full_name")
          .limit(500)
      : Promise.resolve({ data: [] }),
    supabase
      .from("services")
      .select("*")
      .eq("tenant_id", active.tenant.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const barbers: BarberOption[] = (barberMemberships ?? [])
    .map((m) => ({
      membershipId: m.id,
      name:
        (m.profiles as unknown as { full_name: string | null } | null)
          ?.full_name ?? "Barbero",
    }))
    .filter((b) => canManage || b.membershipId === active.membershipId);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? `Citas de ${active.tenant.name}`
            : "Tus citas del día"}
        </p>
      </header>
      <AgendaDay
        date={date}
        barbers={barbers}
        appointments={(appointments ?? []) as unknown as AgendaAppointment[]}
        clients={clients ?? []}
        services={services ?? []}
        canManage={canManage}
      />
    </main>
  );
}
