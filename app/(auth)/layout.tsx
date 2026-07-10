import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#241C14] p-10 text-[#FDFBF7] dark:bg-[#16120E] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-amber-500/15 blur-[110px]"
        />
        <Link
          href="/"
          className="relative flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          BarberSaaS
        </Link>

        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">
            Gestión integral
          </p>
          <p className="mt-6 max-w-md font-heading text-4xl font-medium leading-[1.1] tracking-[-0.02em] xl:text-5xl">
            El oficio es tuyo. El orden,{" "}
            <span className="italic text-amber-300">nuestro.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#FDFBF7]/60">
            Agenda, reservas online, caja, inventario y fidelización en una
            sola plataforma.
          </p>
        </div>

        <p className="relative text-xs text-[#FDFBF7]/40">
          © {new Date().getFullYear()} BarberSaaS · Hecho para el oficio.
        </p>
      </aside>

      <div className="relative flex items-center justify-center p-4 sm:p-8">
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-2 font-heading text-base font-semibold tracking-tight sm:left-8 sm:top-6 lg:hidden"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
          BarberSaaS
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
