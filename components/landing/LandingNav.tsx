"use client";

import Link from "next/link";
import { useState } from "react";

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
        <nav className="flex w-full items-center justify-between gap-2 rounded-full border border-white/10 bg-black/50 py-2 pl-5 pr-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:w-auto sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight text-white"
            onClick={() => setOpen(false)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            BarberSaaS
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-[13px] text-white/60 transition-colors duration-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-[13px] text-white/60 transition-colors duration-300 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={`rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-all duration-500 ${EASE} hover:bg-amber-200 active:scale-[0.98]`}
            >
              Empieza gratis
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 sm:hidden"
          >
            <span
              className={`absolute h-px w-4 bg-white transition-all duration-500 ${EASE} ${
                open ? "rotate-45" : "-translate-y-[3px]"
              }`}
            />
            <span
              className={`absolute h-px w-4 bg-white transition-all duration-500 ${EASE} ${
                open ? "-rotate-45" : "translate-y-[3px]"
              }`}
            />
          </button>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-30 flex flex-col justify-between bg-black/85 px-8 pb-10 pt-32 backdrop-blur-3xl transition-opacity duration-500 sm:hidden ${
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
              className={`block font-heading text-3xl font-semibold tracking-tight text-white transition-all duration-700 ${EASE} ${
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
            className={`block font-heading text-3xl font-semibold tracking-tight text-white/60 transition-all duration-700 ${EASE} ${
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
          className={`flex items-center justify-center rounded-full bg-white py-4 text-sm font-medium text-black transition-all duration-700 ${EASE} active:scale-[0.98] ${
            open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          Empieza gratis
        </Link>
      </div>
    </>
  );
}
