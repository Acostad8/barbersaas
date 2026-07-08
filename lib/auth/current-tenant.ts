import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Tenant } from "@/lib/supabase/types";

export type ActiveMembership = {
  membershipId: string;
  role: MemberRole;
  branchId: string | null;
  tenant: Tenant;
};

// Single-tenant assumption for now: first active membership wins.
// A tenant switcher will replace this when multi-tenant UX lands.
export async function getActiveMembership(): Promise<ActiveMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("id, role, branch_id, tenants(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data || !data.tenants) return null;

  return {
    membershipId: data.id,
    role: data.role,
    branchId: data.branch_id,
    tenant: data.tenants,
  };
}
