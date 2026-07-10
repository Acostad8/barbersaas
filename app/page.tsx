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
  tint: string;
}[] = [
  {
    title: "Agenda inteligente",
    description:
      "Calendario por barbero con estados de cita y anti doble-reserva garantizado a nivel de base de datos. Ningún cruce de horarios, nunca.",
    icon: <IconCalendar />,
    span: "md:col-span-8",
    tint: "border-amber-600/20 bg-amber-100 text-amber-800",
  },
  {
    title: "Reservas online",
    description:
      "Tu propia página pública: tus clientes eligen servicio, barbero y hora con disponibilidad real.",
    icon: <IconGlobe />,
    span: "md:col-span-4",
    tint: "border-sky-600/20 bg-sky-100 text-sky-800",
  },
  {
    title: "Punto de venta",
    description:
      "Multipago, propinas, cupones y cierre de caja con arqueo exacto.",
    icon: <IconCard />,
    span: "md:col-span-4",
    tint: "border-emerald-600/20 bg-emerald-100 text-emerald-800",
  },
  {
    title: "Inventario con kardex",
    description:
      "Stock por sede, alertas de mínimos y un historial de movimientos inmutable que nunca se puede adulterar. La sobreventa es imposible por diseño.",
    icon: <IconBox />,
    span: "md:col-span-8",
    tint: "border-violet-600/20 bg-violet-100 text-violet-800",
  },
  {
    title: "Reportes y finanzas",
    description:
      "Ventas, comisiones, flujo de caja y horas pico. Exporta todo a CSV con un clic.",
    icon: <IconChart />,
    span: "md:col-span-6",
    tint: "border-rose-600/20 bg-rose-100 text-rose-800",
  },
  {
    title: "Fidelización",
    description:
      "Cupones, programa de puntos automático y segmentación de clientes frecuentes e inactivos.",
    icon: <IconSpark />,
    span: "md:col-span-6",
    tint: "border-teal-600/20 bg-teal-100 text-teal-800",
  },
];

const STEPS = [
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
    <div className="min-h-[100dvh] overflow-x-clip bg-[#FDFBF7] font-body text-[#241C14] selection:bg-[#241C14] selection:text-[#FDFBF7]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: NOISE_BG }}
      />

      <LandingNav />

      <main className="relative">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-24 pt-40 sm:pb-32 sm:pt-52">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-amber-200/50 blur-[130px] motion-safe:animate-[orb-float_16s_ease-in-out_infinite]" />
            <div className="absolute -left-40 top-64 h-[28rem] w-[28rem] rounded-full bg-emerald-200/40 blur-[110px] motion-safe:animate-[orb-float_20s_ease-in-out_infinite_reverse]" />
            <div className="absolute -right-40 top-32 h-[24rem] w-[24rem] rounded-full bg-rose-200/40 blur-[100px] motion-safe:animate-[orb-float_24s_ease-in-out_infinite]" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/70">
                <span className="h-1 w-1 rounded-full bg-amber-600" />
                Plataforma todo-en-uno para barberías
              </span>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="mx-auto mt-8 max-w-4xl font-heading text-5xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-7xl">
                Tu barbería,{" "}
                <span className="italic text-amber-700">afilada</span> de punta
                a punta
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#241C14]/60 sm:text-lg">
                Agenda, reservas online, caja, inventario y fidelización en una
                sola plataforma rápida, elegante y sin complicaciones.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CtaPill href="/register" variant="ink">
                  Crear mi barbería
                </CtaPill>
                <CtaPill href="/login" variant="ghost">
                  Ya tengo cuenta
                </CtaPill>
              </div>
              <p className="mt-5 text-xs text-[#241C14]/50">
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
          className="relative overflow-hidden border-y border-black/5 py-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        >
          <div className="flex w-max motion-safe:animate-[marquee_45s_linear_infinite]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="flex items-center gap-8 pr-8 font-heading text-sm uppercase tracking-[0.25em] text-[#241C14]/40"
                  >
                    {item}
                    <span className="h-1 w-1 rounded-full bg-amber-600/70" />
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
              <span className="inline-block rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/70">
                Cómo funciona
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                Listo en tres pasos
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <div className="border-t border-black/15 pt-6">
                    <span className="font-mono text-sm text-amber-700">
                      {s.n}
                    </span>
                    <h3 className="mt-4 font-heading text-xl font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#241C14]/60">
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
              <span className="inline-block rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/70">
                Funciones
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                Todo lo que tu negocio necesita
              </h2>
            </Reveal>

            <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-12">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 80} className={f.span}>
                  <BezelCard className="group h-full">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-transform duration-700 ${EASE} group-hover:scale-110 ${f.tint}`}
                    >
                      {f.icon}
                    </span>
                    <h3 className="mt-6 font-heading text-lg font-medium tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#241C14]/60">
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
          className="scroll-mt-28 border-t border-black/5 px-4 py-24 sm:py-36"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/70">
                Precios
              </span>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                Planes simples y transparentes
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {(plans ?? []).map((p, i) => {
                const pro = p.id === "pro";
                return (
                  <Reveal key={p.id} delay={i * 100} className="h-full">
                    <div
                      className={`flex h-full flex-col rounded-[2rem] border p-1.5 transition-all duration-700 ${EASE} hover:-translate-y-1 ${
                        pro
                          ? "border-amber-600/30 bg-amber-100/60 shadow-[0_24px_60px_-32px_rgba(180,83,9,0.45)]"
                          : "border-black/10 bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex flex-1 flex-col rounded-[calc(2rem-0.375rem)] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(38,28,20,0.35)]">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-lg font-medium tracking-tight">
                            {p.name}
                          </h3>
                          {pro && (
                            <span className="rounded-full bg-amber-700 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#241C14]/60">
                          {p.description}
                        </p>
                        <p className="mt-6 font-heading text-4xl font-medium tracking-tight">
                          {p.price_monthly === 0
                            ? "Gratis"
                            : money(p.price_monthly, p.currency)}
                          {p.price_monthly > 0 && (
                            <span className="font-body text-sm font-normal text-[#241C14]/50">
                              {" "}
                              /mes
                            </span>
                          )}
                        </p>
                        <ul className="mt-6 flex-1 space-y-3 text-sm text-[#241C14]/70">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                aria-hidden
                                className="mt-0.5 shrink-0 text-amber-700"
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
                              ? "bg-[#241C14] text-[#FDFBF7] hover:bg-black"
                              : "border border-black/15 bg-black/5 text-[#241C14] hover:bg-black/10"
                          }`}
                        >
                          Empezar
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${
                              pro ? "bg-white/15" : "bg-black/5"
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
          className="scroll-mt-28 border-t border-black/5 px-4 py-24 sm:py-36"
        >
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center">
              <span className="inline-block rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/70">
                FAQ
              </span>
              <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
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
            <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-amber-200/60 blur-[130px]" />
          </div>
          <Reveal className="relative mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
              Empieza hoy, configura tu barbería en{" "}
              <span className="italic text-amber-700">minutos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[#241C14]/60">
              Sin tarjeta, sin instalación. Tu agenda y tu página de reservas
              quedan listas el mismo día.
            </p>
            <div className="mt-10 flex justify-center">
              <CtaPill href="/register" variant="ink">
                Crear cuenta gratis
              </CtaPill>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-10 text-sm text-[#241C14]/50 sm:flex-row">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600/70" />©{" "}
            {new Date().getFullYear()} BarberSaaS
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="transition-colors duration-300 hover:text-[#241C14]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="transition-colors duration-300 hover:text-[#241C14]"
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
  variant: "ink" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full py-2.5 pl-6 pr-2.5 text-sm font-medium transition-all duration-500 ${EASE} active:scale-[0.98] ${
        variant === "ink"
          ? "bg-[#241C14] text-[#FDFBF7] shadow-[0_16px_36px_-16px_rgba(38,28,20,0.5)] hover:bg-black hover:shadow-[0_20px_44px_-16px_rgba(38,28,20,0.6)]"
          : "border border-black/15 bg-white/70 text-[#241C14] hover:bg-white"
      }`}
    >
      {children}
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${
          variant === "ink" ? "bg-white/15" : "bg-black/5"
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
      className={`rounded-[2rem] border border-black/10 bg-black/[0.03] p-1.5 transition-all duration-700 ${EASE} hover:-translate-y-1 hover:border-amber-600/30 ${className ?? ""}`}
    >
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(38,28,20,0.35)] sm:p-8">
        {children}
      </div>
    </div>
  );
}

function AgendaMock() {
  const cols: {
    name: string;
    blocks: { top: number; h: number; c: string; label: string }[];
  }[] = [
    {
      name: "Andrés",
      blocks: [
        {
          top: 8,
          h: 24,
          c: "bg-amber-100 border-amber-300 text-amber-900",
          label: "Corte · 9:00",
        },
        {
          top: 38,
          h: 30,
          c: "bg-emerald-100 border-emerald-300 text-emerald-900",
          label: "Corte + barba · 10:00",
        },
        {
          top: 74,
          h: 18,
          c: "bg-stone-100 border-stone-300 text-stone-700",
          label: "Barba · 11:30",
        },
      ],
    },
    {
      name: "Camila",
      blocks: [
        {
          top: 0,
          h: 26,
          c: "bg-violet-100 border-violet-300 text-violet-900",
          label: "Tinte · 8:30",
        },
        {
          top: 32,
          h: 22,
          c: "bg-amber-100 border-amber-300 text-amber-900",
          label: "Corte · 9:45",
        },
        {
          top: 60,
          h: 32,
          c: "bg-sky-100 border-sky-300 text-sky-900",
          label: "Diseño · 11:00",
        },
      ],
    },
    {
      name: "Jorge",
      blocks: [
        {
          top: 14,
          h: 30,
          c: "bg-emerald-100 border-emerald-300 text-emerald-900",
          label: "Corte + barba · 9:15",
        },
        {
          top: 52,
          h: 24,
          c: "bg-violet-100 border-violet-300 text-violet-900",
          label: "Afeitado · 10:45",
        },
      ],
    },
  ];

  return (
    <div className="relative mx-auto mt-20 max-w-4xl rounded-[2rem] border border-black/10 bg-black/[0.03] p-2 text-left">
      <div className="rounded-[calc(2rem-0.5rem)] border border-black/5 bg-white shadow-[0_24px_60px_-32px_rgba(38,28,20,0.4)]">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#241C14]/50">
            Agenda · Hoy
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-600 motion-safe:animate-pulse" />
            En vivo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 sm:gap-4 sm:p-6">
          {cols.map((col) => (
            <div key={col.name}>
              <p className="mb-3 text-xs font-medium text-[#241C14]/70">
                {col.name}
              </p>
              <div className="relative h-40 rounded-xl border border-black/5 bg-[#FDFBF7] sm:h-48">
                {col.blocks.map((b, i) => (
                  <div
                    key={i}
                    style={{ top: `${b.top}%`, height: `${b.h}%` }}
                    className={`absolute inset-x-1.5 overflow-hidden rounded-lg border px-1.5 pt-1 ${b.c}`}
                  >
                    <span className="block truncate text-[8px] font-medium leading-tight sm:text-[9px]">
                      {b.label}
                    </span>
                  </div>
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
