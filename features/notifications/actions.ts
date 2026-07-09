"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";

export async function markAllNotificationsReadAction(): Promise<void> {
  const active = await getActiveMembership();
  if (!active) return;

  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read", {
    p_tenant_id: active.tenant.id,
  });

  revalidatePath("/dashboard", "layout");
}
