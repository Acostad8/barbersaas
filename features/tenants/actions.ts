"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTenantSchema,
  type CreateTenantInput,
} from "@/features/tenants/schemas";

export type CreateTenantResult = { error: string } | never;

export async function createTenantAction(
  input: CreateTenantInput,
): Promise<CreateTenantResult> {
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_tenant", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese identificador (slug) ya está en uso" };
    }
    return { error: "No se pudo crear la barbería. Intenta de nuevo." };
  }

  redirect("/dashboard");
}
