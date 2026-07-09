import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/pos", label: "POS" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/servicios", label: "Servicios" },
  { href: "/dashboard/equipo", label: "Equipo" },
  { href: "/dashboard/inventario", label: "Inventario" },
  { href: "/dashboard/sucursales", label: "Sucursales" },
  { href: "/dashboard/configuracion", label: "Configuración" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!count) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r bg-muted/20 p-4 md:flex">
        <Link href="/dashboard" className="mb-8 text-lg font-semibold">
          BarberSaaS
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <form action={signOutAction}>
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
