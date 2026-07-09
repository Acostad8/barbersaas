import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/features/booking/components/BookingWizard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: info } = await supabase.rpc("get_booking_info", {
    p_slug: slug,
  });
  return {
    title: info?.tenant
      ? `Reservar en ${info.tenant.name}`
      : "Reservar — BarberSaaS",
    description: info?.tenant?.description ?? undefined,
  };
}

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: info, error } = await supabase.rpc("get_booking_info", {
    p_slug: slug,
  });

  if (error || !info?.tenant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/40">
      {info.tenant.banner_url && (
        <div className="relative h-40 w-full sm:h-56">
          <Image
            src={info.tenant.banner_url}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
        <header className="flex items-center gap-4">
          {info.tenant.logo_url && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-background">
              <Image
                src={info.tenant.logo_url}
                alt={`Logo de ${info.tenant.name}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{info.tenant.name}</h1>
            {info.tenant.description && (
              <p className="text-sm text-muted-foreground">
                {info.tenant.description}
              </p>
            )}
          </div>
        </header>
        <BookingWizard info={info} />
      </div>
    </main>
  );
}
