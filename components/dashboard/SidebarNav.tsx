"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const S = { width: 17, height: 17, viewBox: "0 0 20 20", fill: "none" };
const P = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const GROUPS: NavGroup[] = [
  {
    label: "Operación",
    items: [
      {
        href: "/dashboard",
        label: "Inicio",
        icon: (
          <svg {...S} aria-hidden>
            <path {...P} d="m3 9 7-6 7 6v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 17V9Z" />
            <path {...P} d="M8 18.5v-6h4v6" />
          </svg>
        ),
      },
      {
        href: "/dashboard/agenda",
        label: "Agenda",
        icon: (
          <svg {...S} aria-hidden>
            <rect {...P} x="2.5" y="4" width="15" height="13.5" rx="3" />
            <path {...P} d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3" />
          </svg>
        ),
      },
      {
        href: "/dashboard/pos",
        label: "Punto de venta",
        icon: (
          <svg {...S} aria-hidden>
            <rect {...P} x="2.5" y="4.5" width="15" height="11" rx="2.5" />
            <path {...P} d="M2.5 8.5h15M5.5 12h3" />
          </svg>
        ),
      },
      {
        href: "/dashboard/clientes",
        label: "Clientes",
        icon: (
          <svg {...S} aria-hidden>
            <circle {...P} cx="7.5" cy="7" r="3" />
            <path {...P} d="M2.5 17c.6-3 2.7-4.5 5-4.5s4.4 1.5 5 4.5M13.5 4.5a3 3 0 0 1 0 5M15.5 12.8c1.2.7 1.8 1.9 2 4.2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      {
        href: "/dashboard/servicios",
        label: "Servicios",
        icon: (
          <svg {...S} aria-hidden>
            <circle {...P} cx="6" cy="6" r="2.5" />
            <circle {...P} cx="6" cy="14" r="2.5" />
            <path {...P} d="m8 8 9.5 9.5M8 12 17.5 2.5" />
          </svg>
        ),
      },
      {
        href: "/dashboard/equipo",
        label: "Equipo",
        icon: (
          <svg {...S} aria-hidden>
            <circle {...P} cx="10" cy="6.5" r="3" />
            <path {...P} d="M4 17.5c.7-3.4 3-5 6-5s5.3 1.6 6 5" />
          </svg>
        ),
      },
      {
        href: "/dashboard/inventario",
        label: "Inventario",
        icon: (
          <svg {...S} aria-hidden>
            <path {...P} d="m10 2.5 6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5L10 2.5Z" />
            <path {...P} d="M3.5 6.25 10 10l6.5-3.75M10 10v7.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Negocio",
    items: [
      {
        href: "/dashboard/reportes",
        label: "Reportes",
        icon: (
          <svg {...S} aria-hidden>
            <path {...P} d="M3 17V3M3 17h14" />
            <path {...P} d="m5.5 12.5 3.5-4 3 2.5 4.5-5.5" />
          </svg>
        ),
      },
      {
        href: "/dashboard/finanzas",
        label: "Finanzas",
        icon: (
          <svg {...S} aria-hidden>
            <circle {...P} cx="10" cy="10" r="7.5" />
            <path {...P} d="M12.5 7.5c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.2 5 3.7 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.5-2.5-1.2M10 4.8v10.4" />
          </svg>
        ),
      },
      {
        href: "/dashboard/marketing",
        label: "Marketing",
        icon: (
          <svg {...S} aria-hidden>
            <path {...P} d="M10 2.5c.6 3.9 3.6 6.9 7.5 7.5-3.9.6-6.9 3.6-7.5 7.5-.6-3.9-3.6-6.9-7.5-7.5 3.9-.6 6.9-3.6 7.5-7.5Z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/dashboard/sucursales",
        label: "Sucursales",
        icon: (
          <svg {...S} aria-hidden>
            <path {...P} d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9 5.5 9Z" />
            <circle {...P} cx="10" cy="8.5" r="2" />
          </svg>
        ),
      },
      {
        href: "/dashboard/configuracion",
        label: "Configuración",
        icon: (
          <svg {...S} aria-hidden>
            <circle {...P} cx="10" cy="10" r="2.5" />
            <path {...P} d="M16.5 12.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
          </svg>
        ),
      },
    ],
  },
];

export function SidebarNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  if (variant === "mobile") {
    return (
      <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {GROUPS.flatMap((g) => g.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              isActive(item.href)
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/40">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-200",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-amber-600 transition-all duration-300 dark:bg-amber-400",
                      active ? "opacity-100" : "scale-y-0 opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "transition-colors duration-200",
                      active
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70",
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
