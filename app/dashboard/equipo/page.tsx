import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { hasPermission } from "@/lib/auth/permissions";
import {
  TeamSection,
  type TeamMember,
} from "@/features/staff/components/TeamSection";
import {
  TimeOffSection,
  type TimeOffRow,
} from "@/features/staff/components/TimeOffSection";

export const metadata: Metadata = {
  title: "Equipo — BarberSaaS",
};

export default async function EquipoPage() {
  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  if (!hasPermission(active.role, "staff:view")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: members }, { data: branches }, { data: timeOff }] =
    await Promise.all([
      supabase
        .from("memberships")
        .select(
          "*, profiles(full_name, avatar_url, phone), barber_profiles(*)",
        )
        .eq("tenant_id", active.tenant.id)
        .order("created_at"),
      supabase
        .from("branches")
        .select("*")
        .eq("tenant_id", active.tenant.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("time_off")
        .select("*, memberships(id, profiles(full_name))")
        .eq("tenant_id", active.tenant.id)
        .order("starts_on", { ascending: false })
        .limit(50),
    ]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Personal de {active.tenant.name}
        </p>
      </header>
      <TeamSection
        members={(members ?? []) as unknown as TeamMember[]}
        branches={branches ?? []}
        canManage={hasPermission(active.role, "staff:manage")}
        selfMembershipId={active.membershipId}
      />
      <TimeOffSection
        requests={(timeOff ?? []) as unknown as TimeOffRow[]}
        canApprove={hasPermission(active.role, "staff:manage")}
      />
    </main>
  );
}
