"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BookingInfo } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Step = "service" | "barber" | "slot" | "contact" | "done";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWizard({ info }: { info: BookingInfo }) {
  const tenant = info.tenant;
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = useMemo(() => createClient(), []);

  const service = info.services.find((s) => s.id === serviceId) ?? null;
  const barber =
    info.barbers.find((b) => b.membership_id === barberId) ?? null;

  const { data: slots = [], isFetching: slotsLoading } = useQuery({
    queryKey: ["slots", tenant?.id, serviceId, barberId, date],
    enabled: Boolean(tenant && serviceId && barberId && step === "slot"),
    queryFn: async () => {
      const { data } = await supabase.rpc("available_slots", {
        p_tenant_id: tenant!.id,
        p_service_id: serviceId!,
        p_membership_id: barberId!,
        p_date: date,
      });
      return data ?? [];
    },
  });

  if (!tenant) {
    return (
      <p className="text-center text-muted-foreground">
        Barbería no encontrada.
      </p>
    );
  }

  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tenant.timezone,
    });

  const book = () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Deja un correo o un teléfono para contactarte");
      return;
    }
    startTransition(async () => {
      const { error: rpcError } = await supabase.rpc("book_appointment", {
        p_slug: tenant.slug,
        p_service_id: serviceId as string,
        p_membership_id: barberId as string,
        p_starts_at: selectedSlot as string,
        p_client_name: name.trim(),
        p_client_email: email.trim() || null,
        p_client_phone: phone.trim() || null,
      });
      if (rpcError) {
        const msg = rpcError.message.includes("slot")
          ? "Ese horario acaba de ocuparse. Elige otro."
          : "No se pudo completar la reserva. Intenta de nuevo.";
        setError(msg);
        if (rpcError.message.includes("slot")) setStep("slot");
      } else {
        setStep("done");
      }
    });
  };

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>
          {step === "done" ? "¡Reserva confirmada!" : "Reserva tu cita"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "service" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Elige un servicio</p>
            {info.services.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Esta barbería aún no tiene servicios publicados.
              </p>
            )}
            {info.services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStep("barber");
                }}
                className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.duration_minutes} min
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {formatPrice(s.price, tenant.currency)}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === "barber" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {service?.name} · elige tu barbero
            </p>
            {info.barbers.map((b) => (
              <button
                key={b.membership_id}
                type="button"
                onClick={() => {
                  setBarberId(b.membership_id);
                  setSelectedSlot(null);
                  setStep("slot");
                }}
                className="flex w-full flex-col rounded-md border p-3 text-left hover:bg-muted"
              >
                <span className="font-medium">{b.name}</span>
                {b.specialties.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {b.specialties.join(" · ")}
                  </span>
                )}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setStep("service")}>
              ← Cambiar servicio
            </Button>
          </div>
        )}

        {step === "slot" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {service?.name} con {barber?.name}
            </p>
            <Input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
            />
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">
                Buscando horarios...
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin horarios disponibles ese día. Prueba otra fecha.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <Button
                    key={s.slot_start}
                    variant={
                      selectedSlot === s.slot_start ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedSlot(s.slot_start)}
                  >
                    {timeLabel(s.slot_start)}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("barber")}>
                ← Atrás
              </Button>
              <Button
                size="sm"
                disabled={!selectedSlot}
                onClick={() => setStep("contact")}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === "contact" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {service?.name} con {barber?.name} ·{" "}
              {selectedSlot &&
                new Date(selectedSlot).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: tenant.timezone,
                })}
            </p>
            <div className="space-y-2">
              <Label htmlFor="bk-name">Tu nombre</Label>
              <Input
                id="bk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-email">Correo</Label>
              <Input
                id="bk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-phone">Teléfono</Label>
              <Input
                id="bk-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("slot")}>
                ← Atrás
              </Button>
              <Button disabled={isPending} onClick={book}>
                {isPending ? "Reservando..." : "Confirmar reserva"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3 text-center">
            <p>
              {service?.name} con {barber?.name}
            </p>
            <p className="font-medium">
              {selectedSlot &&
                new Date(selectedSlot).toLocaleString("es-CO", {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: tenant.timezone,
                })}
            </p>
            <p className="text-sm text-muted-foreground">
              Te esperamos en {tenant.name}.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStep("service");
                setServiceId(null);
                setBarberId(null);
                setSelectedSlot(null);
              }}
            >
              Hacer otra reserva
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
