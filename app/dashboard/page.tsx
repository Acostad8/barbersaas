import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, role, tenant_id, tenants(name, slug)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-medium">Tus barberías</h2>
        <ul className="space-y-2">
          {memberships?.map((m) => (
            <li key={m.id} className="rounded-md border p-4">
              <span className="font-medium">{m.tenants?.name}</span>{" "}
              <span className="text-sm text-muted-foreground">({m.role})</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
