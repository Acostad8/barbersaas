"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

const LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Planes", href: "#planes" },
  { label: "Preguntas", href: "#faq" },
];

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 sm:pt-6">
        <nav className="flex w-full items-center justify-between gap-2 rounded-full border border-black/10 bg-[#FDFBF7]/80 py-2 pl-5 pr-2 shadow-[0_12px_32px_-16px_rgba(38,28,20,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0C0A08]/70 dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)] sm:w-auto sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight text-[#241C14] dark:text-[#F2EAE0]"
            onClick={() => setOpen(false)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            BarberSaaS
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-[13px] text-[#241C14]/60 transition-colors duration-300 hover:bg-black/5 hover:text-[#241C14] dark:text-[#F2EAE0]/60 dark:hover:bg-white/5 dark:hover:text-[#F2EAE0]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-1.5 text-[13px] text-[#241C14]/60 transition-colors duration-300 hover:text-[#241C14] dark:text-[#F2EAE0]/60 dark:hover:text-[#F2EAE0] sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={`hidden rounded-full bg-[#241C14] px-4 py-1.5 text-[13px] font-medium text-[#FDFBF7] transition-all duration-500 ${EASE} hover:bg-black active:scale-[0.98] dark:bg-[#F2EAE0] dark:text-[#241C14] dark:hover:bg-white sm:block`}
            >
              Empieza gratis
            </Link>

            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/5 dark:border-white/15 dark:bg-white/5 sm:hidden"
            >
              <span
                className={`absolute h-px w-4 bg-[#241C14] transition-all duration-500 dark:bg-[#F2EAE0] ${EASE} ${
                  open ? "rotate-45" : "-translate-y-[3px]"
                }`}
              />
              <span
                className={`absolute h-px w-4 bg-[#241C14] transition-all duration-500 dark:bg-[#F2EAE0] ${EASE} ${
                  open ? "-rotate-45" : "translate-y-[3px]"
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-0 z-30 flex flex-col justify-between bg-[#FDFBF7]/95 px-8 pb-10 pt-32 backdrop-blur-3xl transition-opacity duration-500 dark:bg-[#0C0A08]/95 sm:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="space-y-6">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${100 + i * 60}ms` : "0ms" }}
              className={`block font-heading text-3xl font-semibold tracking-tight text-[#241C14] transition-all duration-700 dark:text-[#F2EAE0] ${EASE} ${
                open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? "280ms" : "0ms" }}
            className={`block font-heading text-3xl font-semibold tracking-tight text-[#241C14]/50 transition-all duration-700 dark:text-[#F2EAE0]/50 ${EASE} ${
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            Iniciar sesión
          </Link>
        </div>

        <Link
          href="/register"
          onClick={() => setOpen(false)}
          style={{ transitionDelay: open ? "340ms" : "0ms" }}
          className={`flex items-center justify-center rounded-full bg-[#241C14] py-4 text-sm font-medium text-[#FDFBF7] transition-all duration-700 dark:bg-[#F2EAE0] dark:text-[#241C14] ${EASE} active:scale-[0.98] ${
            open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          Empieza gratis
        </Link>
      </div>
    </>
  );
}
