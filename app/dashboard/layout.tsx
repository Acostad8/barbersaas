import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { signOutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/pos", label: "POS" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/servicios", label: "Servicios" },
  { href: "/dashboard/equipo", label: "Equipo" },
  { href: "/dashboard/inventario", label: "Inventario" },
  { href: "/dashboard/reportes", label: "Reportes" },
  { href: "/dashboard/finanzas", label: "Finanzas" },
  { href: "/dashboard/marketing", label: "Marketing" },
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

  const active = await getActiveMembership();

  if (!active) {
    redirect("/onboarding");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("tenant_id", active.tenant.id)
    .order("created_at", { ascending: false })
    .limit(20);

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
          <NotificationBell notifications={notifications ?? []} />
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
