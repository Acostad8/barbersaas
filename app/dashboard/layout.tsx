import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import { signOutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center justify-between px-5 pb-2 pt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight text-sidebar-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            BarberSaaS
          </Link>
          <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded-full text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>

        <p className="truncate px-5 pb-4 text-xs text-sidebar-foreground/50">
          {active.tenant.name}
        </p>

        <div className="flex-1 overflow-y-auto px-3">
          <SidebarNav />
        </div>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <NotificationBell notifications={notifications ?? []} />
          <p className="truncate text-xs text-sidebar-foreground/50">
            {user.email}
          </p>
          <form action={signOutAction}>
            <Button variant="outline" size="sm" type="submit" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              BarberSaaS
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground" />
              <form action={signOutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Salir
                </Button>
              </form>
            </div>
          </div>
          <SidebarNav variant="mobile" />
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
