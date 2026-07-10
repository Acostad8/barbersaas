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

const STATS = [
  { value: "15", suffix: "módulos", label: "integrados en una sola plataforma" },
  {
    value: "0",
    suffix: "dobles reservas",
    label: "bloqueadas a nivel de base de datos",
  },
  {
    value: "24/7",
    suffix: "reservas online",
    label: "tus clientes agendan mientras duermes",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Agenda inteligente",
    description:
      "Calendario por barbero con estados de cita y anti doble-reserva garantizado a nivel de base de datos. Ningún cruce de horarios, nunca.",
  },
  {
    n: "02",
    title: "Reservas online",
    description:
      "Tu propia página pública: tus clientes eligen servicio, barbero y hora con disponibilidad real, sin registrarse.",
  },
  {
    n: "03",
    title: "Punto de venta",
    description:
      "Multipago, propinas, cupones y cierre de caja con arqueo exacto al peso.",
  },
  {
    n: "04",
    title: "Inventario con kardex",
    description:
      "Stock por sede, alertas de mínimos y un historial de movimientos inmutable. La sobreventa es imposible por diseño.",
  },
  {
    n: "05",
    title: "Reportes y finanzas",
    description:
      "Ventas, comisiones, flujo de caja y horas pico. Exporta todo a CSV con un clic.",
  },
  {
    n: "06",
    title: "Fidelización",
    description:
      "Cupones, programa de puntos automático y segmentación de clientes frecuentes e inactivos.",
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

function SectionMeta({ index, label }: { index: string; label: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs text-amber-700 dark:text-amber-400">
      ({index})
      <span className="uppercase tracking-[0.25em] text-[#241C14]/50 dark:text-[#F2EAE0]/50">
        {label}
      </span>
    </p>
  );
}

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
    <div className="min-h-[100dvh] overflow-x-clip bg-[#FDFBF7] text-[#241C14] selection:bg-[#241C14] selection:text-[#FDFBF7] dark:bg-[#0C0A08] dark:text-[#F2EAE0] dark:selection:bg-[#F2EAE0] dark:selection:text-[#241C14]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.04] mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-soft-light"
        style={{ backgroundImage: NOISE_BG }}
      />

      <LandingNav />

      <main className="relative">
        {/* ── Hero: split editorial ────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-20 pt-36 sm:pt-48 lg:pb-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-amber-200/50 blur-[130px] motion-safe:animate-[orb-float_18s_ease-in-out_infinite] dark:bg-amber-500/15" />
            <div className="absolute -left-40 bottom-[-10rem] h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-[110px] motion-safe:animate-[orb-float_24s_ease-in-out_infinite_reverse] dark:bg-emerald-500/10" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <Reveal>
                <SectionMeta index="00" label="Software de gestión" />
              </Reveal>
              <Reveal delay={100}>
                <h1 className="mt-6 font-heading text-5xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl xl:text-7xl">
                  El oficio es tuyo.
                  <br />
                  El orden,{" "}
                  <span className="italic text-amber-700 dark:text-amber-400">
                    nuestro.
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60 sm:text-lg">
                  Agenda, reservas online, caja, inventario y fidelización para
                  barberías que se toman su negocio en serio.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <CtaPill href="/register" variant="ink">
                    Crear mi barbería
                  </CtaPill>
                  <CtaPill href="/login" variant="ghost">
                    Ya tengo cuenta
                  </CtaPill>
                </div>
                <p className="mt-5 text-xs text-[#241C14]/50 dark:text-[#F2EAE0]/50">
                  Gratis para siempre en el plan básico · Sin tarjeta de
                  crédito
                </p>
              </Reveal>
            </div>

            <div className="relative lg:col-span-6">
              <Reveal delay={250}>
                <div className={`lg:rotate-1 lg:transition-transform lg:duration-700 ${EASE} lg:hover:rotate-0`}>
                  <AgendaMock />
                </div>
              </Reveal>

              <Reveal delay={450}>
                <div className="absolute -left-2 top-6 w-52 -rotate-3 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_24px_50px_-24px_rgba(38,28,20,0.45)] motion-safe:animate-[orb-float_12s_ease-in-out_infinite] dark:border-white/10 dark:bg-[#16120E] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] sm:-left-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#241C14]/50 dark:text-[#F2EAE0]/50">
                    Nueva reserva
                  </p>
                  <p className="mt-1.5 text-sm font-medium">
                    Corte + barba · 10:00
                  </p>
                  <p className="mt-0.5 text-xs text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                    Camila — desde tu enlace público
                  </p>
                </div>
              </Reveal>

              <Reveal delay={550}>
                <div className="absolute -bottom-6 right-0 w-44 rotate-2 rounded-2xl border border-black/10 bg-[#241C14] p-4 text-[#FDFBF7] shadow-[0_24px_50px_-24px_rgba(38,28,20,0.55)] dark:border-white/10 dark:bg-[#F2EAE0] dark:text-[#241C14] sm:-right-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#FDFBF7]/50 dark:text-[#241C14]/50">
                    Caja de hoy
                  </p>
                  <p className="mt-1.5 font-heading text-xl font-medium">
                    $ 850.000
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-300 dark:text-emerald-700">
                    Arqueo cuadrado
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Stats band ───────────────────────────────────────── */}
        <section className="border-y border-black/10 dark:border-white/10">
          <div className="mx-auto grid max-w-6xl divide-y divide-black/10 dark:divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((s, i) => (
              <Reveal key={s.value} delay={i * 100}>
                <div className="px-6 py-10 sm:py-12">
                  <p className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
                    {s.value}{" "}
                    <span className="text-xl italic text-amber-700 dark:text-amber-400 sm:text-2xl">
                      {s.suffix}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Features: índice editorial ───────────────────────── */}
        <section id="funciones" className="scroll-mt-28 px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-12 md:items-end">
              <Reveal className="md:col-span-7">
                <SectionMeta index="01" label="Funciones" />
                <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                  Todo lo que tu negocio necesita
                </h2>
              </Reveal>
              <Reveal delay={150} className="md:col-span-5">
                <p className="max-w-sm text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60 md:ml-auto">
                  Sin integraciones frágiles ni cinco suscripciones distintas:
                  cada módulo comparte los mismos datos, en tiempo real.
                </p>
              </Reveal>
            </div>

            <div className="mt-16">
              {FEATURES.map((f, i) => (
                <Reveal key={f.n} delay={i * 60}>
                  <div
                    className={`group grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-t border-black/10 py-7 transition-colors duration-500 dark:border-white/10 ${EASE} last:border-b hover:bg-white/70 dark:hover:bg-white/[0.04] md:grid-cols-12 md:gap-x-8 md:px-4`}
                  >
                    <span className="font-mono text-xs text-amber-700 dark:text-amber-400 md:col-span-1">
                      {f.n}
                    </span>
                    <h3 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl md:col-span-4">
                      {f.title}
                    </h3>
                    <p className="col-start-2 max-w-lg text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60 md:col-span-6 md:col-start-auto">
                      {f.description}
                    </p>
                    <span
                      className={`hidden h-9 w-9 items-center justify-center self-center rounded-full border border-black/10 bg-black/5 opacity-0 transition-all duration-500 dark:border-white/15 dark:bg-white/5 ${EASE} group-hover:translate-x-1 group-hover:opacity-100 md:col-span-1 md:flex md:justify-self-end`}
                    >
                      <IconArrow />
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona: split sticky ──────────────────────── */}
        <section className="border-t border-black/5 px-4 py-24 dark:border-white/5 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="md:sticky md:top-32">
                <Reveal>
                  <SectionMeta index="02" label="Cómo funciona" />
                  <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                    Listo en{" "}
                    <span className="italic text-amber-700 dark:text-amber-400">
                      tres
                    </span>{" "}
                    pasos
                  </h2>
                  <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                    Del registro a recibir tu primera reserva online el mismo
                    día. Sin instalación, sin consultores, sin curva de
                    aprendizaje.
                  </p>
                  <div className="mt-8">
                    <CtaPill href="/register" variant="ghost">
                      Empezar ahora
                    </CtaPill>
                  </div>
                </Reveal>
              </div>
            </div>

            <div className="space-y-4 md:col-span-7">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <div className="rounded-[1.75rem] border border-black/10 bg-white p-1.5 shadow-[0_16px_40px_-28px_rgba(38,28,20,0.35)] dark:border-white/10 dark:bg-[#16120E] dark:shadow-none">
                    <div className="flex gap-6 rounded-[calc(1.75rem-0.375rem)] p-6 sm:p-8">
                      <span className="font-heading text-4xl font-medium italic text-amber-700/70 dark:text-amber-400/70 sm:text-5xl">
                        {s.n}
                      </span>
                      <div className="pt-1">
                        <h3 className="font-heading text-xl font-medium tracking-tight">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Planes ───────────────────────────────────────────── */}
        <section
          id="planes"
          className="scroll-mt-28 border-t border-black/5 px-4 py-24 dark:border-white/5 sm:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-12 md:items-end">
              <Reveal className="md:col-span-7">
                <SectionMeta index="03" label="Precios" />
                <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                  Planes simples y transparentes
                </h2>
              </Reveal>
              <Reveal delay={150} className="md:col-span-5">
                <p className="max-w-sm text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60 md:ml-auto">
                  Empieza gratis y crece cuando tu barbería crezca. Cambia de
                  plan en cualquier momento.
                </p>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {(plans ?? []).map((p, i) => {
                const pro = p.id === "pro";
                return (
                  <Reveal key={p.id} delay={i * 100} className="h-full">
                    <div
                      className={`flex h-full flex-col rounded-[2rem] border p-1.5 transition-all duration-700 ${EASE} hover:-translate-y-1 ${
                        pro
                          ? "border-amber-600/30 bg-amber-100/60 shadow-[0_24px_60px_-32px_rgba(180,83,9,0.45)] dark:border-amber-400/30 dark:bg-amber-400/10 dark:shadow-none md:-translate-y-3 md:hover:-translate-y-4"
                          : "border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex flex-1 flex-col rounded-[calc(2rem-0.375rem)] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(38,28,20,0.35)] dark:bg-[#16120E] dark:shadow-none">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-lg font-medium tracking-tight">
                            {p.name}
                          </h3>
                          {pro && (
                            <span className="rounded-full bg-amber-700 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white dark:bg-amber-400 dark:text-[#241C14]">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                          {p.description}
                        </p>
                        <p className="mt-6 font-heading text-4xl font-medium tracking-tight">
                          {p.price_monthly === 0
                            ? "Gratis"
                            : money(p.price_monthly, p.currency)}
                          {p.price_monthly > 0 && (
                            <span className="font-sans text-sm font-normal text-[#241C14]/50 dark:text-[#F2EAE0]/50">
                              {" "}
                              /mes
                            </span>
                          )}
                        </p>
                        <ul className="mt-6 flex-1 space-y-3 text-sm text-[#241C14]/70 dark:text-[#F2EAE0]/70">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                aria-hidden
                                className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
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
                              ? "bg-[#241C14] text-[#FDFBF7] hover:bg-black dark:bg-[#F2EAE0] dark:text-[#241C14] dark:hover:bg-white"
                              : "border border-black/15 bg-black/5 text-[#241C14] hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-[#F2EAE0] dark:hover:bg-white/10"
                          }`}
                        >
                          Empezar
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${
                              pro
                                ? "bg-white/15 dark:bg-black/10"
                                : "bg-black/5 dark:bg-white/10"
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

        {/* ── FAQ: split ───────────────────────────────────────── */}
        <section
          id="faq"
          className="scroll-mt-28 border-t border-black/5 px-4 py-24 dark:border-white/5 sm:py-32"
        >
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="md:sticky md:top-32">
                <Reveal>
                  <SectionMeta index="04" label="Preguntas" />
                  <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
                    Lo que todos preguntan
                  </h2>
                  <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                    ¿Tienes otra duda? Crea tu cuenta gratis y explora la
                    plataforma por dentro: es la forma más rápida de saber si
                    es para ti.
                  </p>
                </Reveal>
              </div>
            </div>
            <Reveal delay={150} className="md:col-span-7">
              <FaqAccordion items={FAQS} />
            </Reveal>
          </div>
        </section>

        {/* ── CTA final: banda invertida ───────────────────────── */}
        <section className="relative overflow-hidden bg-[#241C14] px-4 py-28 text-[#FDFBF7] dark:bg-[#F2EAE0] dark:text-[#241C14] sm:py-36">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-amber-500/15 blur-[130px] dark:bg-amber-500/25" />
          </div>
          <div className="relative mx-auto max-w-6xl">
            <Reveal>
              <p className="flex items-center gap-3 font-mono text-xs text-amber-300 dark:text-amber-700">
                (05)
                <span className="uppercase tracking-[0.25em] text-[#FDFBF7]/50 dark:text-[#241C14]/50">
                  Empieza hoy
                </span>
              </p>
              <h2 className="mt-8 max-w-3xl font-heading text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-6xl">
                Tu barbería lista en{" "}
                <span className="italic text-amber-300 dark:text-amber-700">
                  minutos,
                </span>{" "}
                no en semanas
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <CtaPill href="/register" variant="cream">
                  Crear cuenta gratis
                </CtaPill>
                <p className="max-w-xs text-sm text-[#FDFBF7]/50 dark:text-[#241C14]/60">
                  Sin tarjeta, sin instalación. Tu agenda y tu página de
                  reservas quedan listas el mismo día.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer editorial ───────────────────────────────────── */}
      <footer className="border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 py-16 md:grid-cols-12">
            <div className="md:col-span-6">
              <p className="flex items-center gap-2 font-heading text-2xl font-medium tracking-tight">
                <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                BarberSaaS
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#241C14]/60 dark:text-[#F2EAE0]/60">
                Gestión integral para barberías: el oficio es tuyo, el orden es
                nuestro.
              </p>
            </div>
            <div className="md:col-span-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/50 dark:text-[#F2EAE0]/50">
                Producto
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#241C14]/70 dark:text-[#F2EAE0]/70">
                <li>
                  <a
                    href="#funciones"
                    className="hover:text-[#241C14] dark:hover:text-[#F2EAE0]"
                  >
                    Funciones
                  </a>
                </li>
                <li>
                  <a
                    href="#planes"
                    className="hover:text-[#241C14] dark:hover:text-[#F2EAE0]"
                  >
                    Planes
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-[#241C14] dark:hover:text-[#F2EAE0]"
                  >
                    Preguntas
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#241C14]/50 dark:text-[#F2EAE0]/50">
                Cuenta
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-[#241C14]/70 dark:text-[#F2EAE0]/70">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-[#241C14] dark:hover:text-[#F2EAE0]"
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-[#241C14] dark:hover:text-[#F2EAE0]"
                  >
                    Crear cuenta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-black/5 py-6 text-xs text-[#241C14]/50 dark:border-white/5 dark:text-[#F2EAE0]/50 sm:flex-row">
            <p>© {new Date().getFullYear()} BarberSaaS</p>
            <p className="italic">Hecho para el oficio.</p>
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
  variant: "ink" | "ghost" | "cream";
  children: React.ReactNode;
}) {
  const styles = {
    ink: "bg-[#241C14] text-[#FDFBF7] shadow-[0_16px_36px_-16px_rgba(38,28,20,0.5)] hover:bg-black hover:shadow-[0_20px_44px_-16px_rgba(38,28,20,0.6)] dark:bg-[#F2EAE0] dark:text-[#241C14] dark:shadow-none dark:hover:bg-white",
    ghost:
      "border border-black/15 bg-white/70 text-[#241C14] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-[#F2EAE0] dark:hover:bg-white/10",
    cream:
      "bg-[#FDFBF7] text-[#241C14] hover:bg-white dark:bg-[#241C14] dark:text-[#FDFBF7] dark:hover:bg-black",
  } as const;
  const circle = {
    ink: "bg-white/15 dark:bg-black/10",
    ghost: "bg-black/5 dark:bg-white/10",
    cream: "bg-black/10 dark:bg-white/15",
  } as const;

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full py-2.5 pl-6 pr-2.5 text-sm font-medium transition-all duration-500 ${EASE} active:scale-[0.98] ${styles[variant]}`}
    >
      {children}
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ${EASE} group-hover:-translate-y-[1px] group-hover:translate-x-0.5 group-hover:scale-105 ${circle[variant]}`}
      >
        <IconArrow />
      </span>
    </Link>
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
          c: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-200",
          label: "Corte · 9:00",
        },
        {
          top: 38,
          h: 30,
          c: "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-400/15 dark:border-emerald-400/30 dark:text-emerald-200",
          label: "Corte + barba · 10:00",
        },
        {
          top: 74,
          h: 18,
          c: "bg-stone-100 border-stone-300 text-stone-700 dark:bg-white/5 dark:border-white/15 dark:text-white/60",
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
          c: "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-400/15 dark:border-violet-400/30 dark:text-violet-200",
          label: "Tinte · 8:30",
        },
        {
          top: 32,
          h: 22,
          c: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-200",
          label: "Corte · 9:45",
        },
        {
          top: 60,
          h: 32,
          c: "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-400/15 dark:border-sky-400/30 dark:text-sky-200",
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
          c: "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-400/15 dark:border-emerald-400/30 dark:text-emerald-200",
          label: "Corte + barba · 9:15",
        },
        {
          top: 52,
          h: 24,
          c: "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-400/15 dark:border-violet-400/30 dark:text-violet-200",
          label: "Afeitado · 10:45",
        },
      ],
    },
  ];

  return (
    <div className="relative rounded-[2rem] border border-black/10 bg-black/[0.03] p-2 text-left dark:border-white/10 dark:bg-white/[0.04]">
      <div className="rounded-[calc(2rem-0.5rem)] border border-black/5 bg-white shadow-[0_24px_60px_-32px_rgba(38,28,20,0.4)] dark:border-white/5 dark:bg-[#16120E] dark:shadow-none">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5 dark:border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#241C14]/50 dark:text-[#F2EAE0]/50">
            Agenda · Hoy
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
            <span className="h-1 w-1 rounded-full bg-emerald-600 motion-safe:animate-pulse dark:bg-emerald-400" />
            En vivo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 sm:gap-4 sm:p-6">
          {cols.map((col) => (
            <div key={col.name}>
              <p className="mb-3 text-xs font-medium text-[#241C14]/70 dark:text-[#F2EAE0]/70">
                {col.name}
              </p>
              <div className="relative h-40 rounded-xl border border-black/5 bg-[#FDFBF7] dark:border-white/5 dark:bg-[#0C0A08] sm:h-48">
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
