import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LandingNav } from "@/components/landing/LandingNav";
import { Reveal } from "@/components/landing/Reveal";
import { FaqAccordion } from "@/components/landing/FaqAccordion";

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

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const MARQUEE_ITEMS = [
  "Agenda inteligente",
  "Reservas online",
  "Punto de venta",
  "Inventario",
  "Reportes",
  "Finanzas",
  "Fidelización",
  "Multi-sede",
  "Notificaciones",
  "Analítica",
];

const FEATURES: {
  title: string;
  description: string;
  icon: React.ReactNode;
  span: string;
}[] = [
  {
    title: "Agenda inteligente",
    description:
      "Calendario por barbero con estados de cita y anti doble-reserva garantizado a nivel de base de datos. Ningún cruce de horarios, nunca.",
    icon: <IconCalendar />,
    span: "md:col-span-8",
  },
  {
    title: "Reservas online",
    description:
      "Tu propia página pública: tus clientes eligen servicio, barbero y hora con disponibilidad real.",
    icon: <IconGlobe />,
    span: "md:col-span-4",
  },
  {
    title: "Punto de venta",
    description:
      "Multipago, propinas, cupones y cierre de caja con arqueo exacto.",
    icon: <IconCard />,
    span: "md:col-span-4",
  },
  {
    title: "Inventario con kardex",
    description:
      "Stock por sede, alertas de mínimos y un historial de movimientos inmutable que nunca se puede adulterar. La sobreventa es imposible por diseño.",
    icon: <IconBox />,
    span: "md:col-span-8",
  },
  {
    title: "Reportes y finanzas",
    description:
      "Ventas, comisiones, flujo de caja y horas pico. Exporta todo a CSV con un clic.",
    icon: <IconChart />,
    span: "md:col-span-6",
  },
  {
    title: "Fidelización",
    description:
      "Cupones, programa de puntos automático y segmentación de clientes frecuentes e inactivos.",
    icon: <IconSpark />,
    span: "md:col-span-6",
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
    <div className="min-h-[100dvh] overflow-x-clip bg-[#050505] text-white selection:bg-amber-300 selection:text-black">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.035] mix-blend-soft-light"
        style={{ backgroundImage: NOISE_BG }}
      />

      <LandingNav />

      <main className="relative">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-24 pt-40 sm:pb-32 sm:pt-52">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-48 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-[130px] motion-safe:animate-[orb-float_16s_ease-in-out_infinite]" />
            <div className="absolute -left-40 top-64 h-[26rem] w-[26rem] rounded-full bg-violet-500/10 blur-[110px] motion-safe:animate-[orb-float_20s_ease-in-out_infinite_reverse]" />
            <div className="absolute -right-40 top-32 h-[22rem] w-[22rem] rounded-full bg-emerald-400/8 blur-[100px] motion-safe:animate-[orb-float_24s_ease-in-out_infinite]" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                <span className="h-1 w-1 rounded-full bg-amber-300" />
                Plataforma todo-en-uno para barberías
              </span>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="mx-auto mt-8 max-w-4xl font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
                Tu barbería,{" "}
                <span className="text-amber-300">afilada</span>{" "}
                de punta a punta
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
                Agenda, reservas online, caja, inventario y fidelización en una
                sola plataforma rápida, elegante y sin complicaciones.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CtaPill href="/register" variant="gold">
                  Crear mi barbería
                </CtaPill>
                <CtaPill href="/login" variant="ghost">
                  Ya tengo cuenta
                </CtaPill>
              </div>
              <p className="mt-5 text-xs text-white/35">
                Gratis para siempre en el plan básico · Sin tarjeta de crédito
              </p>
            </Reveal>

            <Reveal delay={400}>
              <AgendaMock />
            </Reveal>
          </div>
        </section>

        {/* ── Marquee ──────────────────────────────────────────── */}
        <section
          aria-hidden
          className="relative overflow-hidden border-y border-white/5 py-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        >
          <div className="flex w-max motion-safe:animate-[marquee_45s_linear_infinite]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="flex items-center gap-8 pr-8 text-sm uppercase tracking-[0.25em] text-white/25"
                  >
                    {item}
                    <span className="h-1 w-1 rounded-full bg-amber-300/40" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Cómo funciona ────────────────────────────────────── */}
        <section className="px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                Cómo funciona
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Listo en tres pasos
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
              {[
                {
                  n: "01",
                  title: "Crea tu barbería",
                  desc: "Regístrate y configura tu negocio y tus sedes en minutos, sin tarjeta de crédito.",
                },
                {
                  n: "02",
                  title: "Configura tu equipo",
                  desc: "Servicios, precios, comisiones y horarios de cada barbero, todo desde el panel.",
                },
                {
                  n: "03",
                  title: "Comparte tu enlace",
                  desc: "Tus clientes reservan online con disponibilidad real y tú lo controlas todo.",
                },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <div className="border-t border-white/10 pt-6">
                    <span className="font-mono text-sm text-amber-300/80">
                      {s.n}
                    </span>
                    <h3 className="mt-4 font-heading text-xl font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {s.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features (bento) ─────────────────────────────────── */}
        <section id="funciones" className="scroll-mt-28 px-4 py-24 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                Funciones
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Todo lo que tu negocio necesita
              </h2>
            </Reveal>

            <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-12">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 80} className={f.span}>
                  <BezelCard className="group h-full">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-700 ${EASE} group-hover:border-amber-300/30 group-hover:text-amber-300`}>
                      {f.icon}
                    </span>
                    <h3 className="mt-6 font-heading text-lg font-medium tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                      {f.description}
                    </p>
                  </BezelCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Planes ───────────────────────────────────────────── */}
        <section
          id="planes"
          className="scroll-mt-28 border-t border-white/5 px-4 py-24 sm:py-36"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                Precios
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Planes simples y transparentes
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {(plans ?? []).map((p, i) => {
                const pro = p.id === "pro";
                return (
                  <Reveal key={p.id} delay={i * 100} className="h-full">
                    <div
                      className={`flex h-full flex-col rounded-[2rem] border p-1.5 transition-transform duration-700 ${EASE} hover:-translate-y-1 ${
                        pro
                          ? "border-amber-300/25 bg-amber-300/[0.06]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex flex-1 flex-col rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-lg font-medium tracking-tight">
                            {p.name}
                          </h3>
                          {pro && (
                            <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-white/45">
                          {p.description}
                        </p>
                        <p className="mt-6 text-4xl font-semibold tracking-tight">
                          {p.price_monthly === 0
                            ? "Gratis"
                            : money(p.price_monthly, p.currency)}
                          {p.price_monthly > 0 && (
                            <span className="text-sm font-normal text-white/40">
                              {" "}
                              /mes
                            </span>
                          )}
                        </p>
                        <ul className="mt-6 flex-1 space-y-3 text-sm text-white/55">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                aria-hidden
                                className="mt-0.5 shrink-0 text-amber-300/70"
                              >
                                <path
                                  d="M2.5 7.5 5.5 10.5 11.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.25"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/register"
                          className={`group mt-8 flex items-center justify-between rounded-full py-2.5 pl-6 pr-2.5 text-sm font-medium transition-all duration-500 ${EASE} active:scale-[0.98] ${
                            pro
                              ? "bg-amber-300 text-black hover:bg-amber-200"
                              : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          Empezar
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${
                              pro ? "bg-black/10" : "bg-white/10"
                            }`}
                          >
                            <IconArrow />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section
          id="faq"
          className="scroll-mt-28 border-t border-white/5 px-4 py-24 sm:py-36"
        >
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                FAQ
              </span>
              <h2 className="mt-6 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                Preguntas frecuentes
              </h2>
            </Reveal>
            <Reveal delay={150} className="mt-12">
              <FaqAccordion items={FAQS} />
            </Reveal>
          </div>
        </section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-28 sm:py-40">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-[130px]" />
          </div>
          <Reveal className="relative mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Empieza hoy, configura tu barbería en minutos
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/50">
              Sin tarjeta, sin instalación. Tu agenda y tu página de reservas
              quedan listas el mismo día.
            </p>
            <div className="mt-10 flex justify-center">
              <CtaPill href="/register" variant="gold">
                Crear cuenta gratis
              </CtaPill>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-10 text-sm text-white/35 sm:flex-row">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300/60" />©{" "}
            {new Date().getFullYear()} BarberSaaS
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="transition-colors duration-300 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="transition-colors duration-300 hover:text-white"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Piezas de UI ─────────────────────────────────────────────── */

function CtaPill({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "gold" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full py-2.5 pl-6 pr-2.5 text-sm font-medium transition-all duration-500 ${EASE} active:scale-[0.98] ${
        variant === "gold"
          ? "bg-amber-300 text-black hover:bg-amber-200"
          : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {children}
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${
          variant === "gold" ? "bg-black/10" : "bg-white/10"
        }`}
      >
        <IconArrow />
      </span>
    </Link>
  );
}

function BezelCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 transition-all duration-700 ${EASE} hover:-translate-y-1 hover:border-amber-300/20 ${className ?? ""}`}
    >
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-8">
        {children}
      </div>
    </div>
  );
}

function AgendaMock() {
  const cols: { name: string; blocks: { top: number; h: number; c: string }[] }[] =
    [
      {
        name: "Andrés",
        blocks: [
          { top: 8, h: 22, c: "bg-amber-300/20 border-amber-300/30" },
          { top: 36, h: 30, c: "bg-emerald-400/15 border-emerald-400/25" },
          { top: 72, h: 18, c: "bg-white/5 border-white/10" },
        ],
      },
      {
        name: "Camila",
        blocks: [
          { top: 0, h: 26, c: "bg-violet-400/15 border-violet-400/25" },
          { top: 32, h: 20, c: "bg-amber-300/20 border-amber-300/30" },
          { top: 58, h: 32, c: "bg-white/5 border-white/10" },
        ],
      },
      {
        name: "Jorge",
        blocks: [
          { top: 14, h: 30, c: "bg-emerald-400/15 border-emerald-400/25" },
          { top: 50, h: 24, c: "bg-violet-400/15 border-violet-400/25" },
        ],
      },
    ];

  return (
    <div className="relative mx-auto mt-20 max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-2 text-left">
      <div className="rounded-[calc(2rem-0.5rem)] border border-white/5 bg-[#0a0a0a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            Agenda · Hoy
          </p>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            En vivo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 sm:gap-4 sm:p-6">
          {cols.map((col) => (
            <div key={col.name}>
              <p className="mb-3 text-xs font-medium text-white/60">
                {col.name}
              </p>
              <div className="relative h-40 rounded-xl border border-white/5 bg-white/[0.02] sm:h-48">
                {col.blocks.map((b, i) => (
                  <div
                    key={i}
                    style={{ top: `${b.top}%`, height: `${b.h}%` }}
                    className={`absolute inset-x-1.5 rounded-lg border ${b.c}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Iconos (trazo fino) ──────────────────────────────────────── */

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 11 11 3M5 3h6v6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="4"
        width="15"
        height="13.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M2.5 10h15M10 2.5c-2.2 2-3.3 4.6-3.3 7.5s1.1 5.5 3.3 7.5c2.2-2 3.3-4.6 3.3-7.5S12.2 4.5 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M2.5 8.5h15M5.5 12h3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m10 2.5 6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 6.25 10 10l6.5-3.75M10 10v7.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 17V3M3 17h14"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="m5.5 12.5 3.5-4 3 2.5 4.5-5.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5c.6 3.9 3.6 6.9 7.5 7.5-3.9.6-6.9 3.6-7.5 7.5-.6-3.9-3.6-6.9-7.5-7.5 3.9-.6 6.9-3.6 7.5-7.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
