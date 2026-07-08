import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <Button variant="outline" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-medium">Tus barberías</h2>
        {memberships && memberships.length > 0 ? (
          <ul className="space-y-2">
            {memberships.map((m) => (
              <li key={m.id} className="rounded-md border p-4">
                <span className="font-medium">{m.tenants?.name}</span>{" "}
                <span className="text-sm text-muted-foreground">({m.role})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no perteneces a ninguna barbería.
          </p>
        )}
      </section>
    </main>
  );
}
