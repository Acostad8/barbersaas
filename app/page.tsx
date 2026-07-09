import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "BarberSaaS — Gestión integral para barberías",
  description:
    "Agenda inteligente, reservas online, punto de venta, inventario y fidelización para tu barbería. Empieza gratis.",
  keywords: [
    "software barbería",
    "agenda barbería",
    "reservas online barbería",
    "POS barbería",
  ],
  openGraph: {
    title: "BarberSaaS — Gestión integral para barberías",
    description:
      "Agenda, reservas online, POS, inventario y fidelización en un solo lugar.",
    type: "website",
  },
};

const FEATURES = [
  {
    title: "Agenda inteligente",
    description:
      "Calendario por barbero con estados de cita y anti doble-reserva garantizado a nivel de base de datos.",
  },
  {
    title: "Reservas online",
    description:
      "Tu propia página pública de reservas: tus clientes eligen servicio, barbero y hora disponibles reales.",
  },
  {
    title: "Punto de venta",
    description:
      "Cobra servicios y productos con multipago, propinas, cupones y cierre de caja con arqueo.",
  },
  {
    title: "Inventario con kardex",
    description:
      "Stock por sede, alertas de mínimos y un historial de movimientos que nunca se puede adulterar.",
  },
  {
    title: "Reportes y finanzas",
    description:
      "Ventas, comisiones, flujo de caja y horas pico. Exporta todo a CSV con un clic.",
  },
  {
    title: "Fidelización",
    description:
      "Cupones, programa de puntos automático y segmentación de clientes frecuentes e inactivos.",
  },
];

const FAQS = [
  {
    q: "¿Puedo usarlo gratis?",
    a: "Sí. El plan Gratis incluye agenda, reservas online, clientes y servicios ilimitados para una sede y hasta 3 miembros de equipo.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Cada barbería vive en un espacio aislado con Row Level Security a nivel de base de datos: ningún dato se comparte entre negocios.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. Funciona en el navegador, en computador, tablet y celular.",
  },
  {
    q: "¿Cómo reservan mis clientes?",
    a: "Compartes tu enlace público de reservas y ellos eligen servicio, barbero y hora sin registrarse.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const money = (n: number, currency: string) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-4 sm:p-6">
        <p className="text-lg font-semibold">BarberSaaS</p>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link href="/register">
            <Button>Empieza gratis</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Tu barbería, organizada de punta a punta
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Agenda, reservas online, caja, inventario y fidelización en una
            sola plataforma rápida y sin complicaciones.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Crear mi barbería</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Gratis para siempre en el plan básico. Sin tarjeta de crédito.
          </p>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-semibold">
              Todo lo que tu negocio necesita
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border bg-background p-6"
                >
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold">
            Planes simples y transparentes
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(plans ?? []).map((p) => (
              <div
                key={p.id}
                className={`flex flex-col rounded-lg border p-6 ${
                  p.id === "pro" ? "border-primary shadow-sm" : ""
                }`}
              >
                {p.id === "pro" && (
                  <span className="mb-2 self-start rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-medium">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-4 text-3xl font-semibold">
                  {p.price_monthly === 0
                    ? "Gratis"
                    : money(p.price_monthly, p.currency)}
                  {p.price_monthly > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /mes
                    </span>
                  )}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6">
                  <Button
                    className="w-full"
                    variant={p.id === "pro" ? "default" : "outline"}
                  >
                    Empezar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-center text-2xl font-semibold">
              Preguntas frecuentes
            </h2>
            <div className="mt-8 space-y-6">
              {FAQS.map((f) => (
                <div key={f.q}>
                  <h3 className="font-medium">{f.q}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold">
            Empieza hoy, configura tu barbería en minutos
          </h2>
          <Link href="/register" className="mt-6 inline-block">
            <Button size="lg">Crear cuenta gratis</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} BarberSaaS</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Iniciar sesión
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
