"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAppointmentAction,
  rescheduleAppointmentAction,
  updateAppointmentStatusAction,
} from "@/features/agenda/actions";
import {
  appointmentFormSchema,
  STATUS_TRANSITIONS,
  type AppointmentFormInput,
} from "@/features/agenda/schemas";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  Service,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AgendaAppointment = Appointment & {
  clients: Pick<Client, "full_name"> | null;
  services: Pick<Service, "name"> | null;
};

export type BarberOption = {
  membershipId: string;
  name: string;
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  scheduled: "border-l-blue-400",
  confirmed: "border-l-violet-400",
  in_progress: "border-l-amber-400",
  completed: "border-l-green-400",
  cancelled: "border-l-gray-300 opacity-60",
  no_show: "border-l-red-400 opacity-60",
};

const TRANSITION_LABEL: Record<string, string> = {
  confirmed: "Confirmar",
  in_progress: "Iniciar",
  completed: "Completar",
  cancelled: "Cancelar",
  no_show: "No asistió",
};

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function NewAppointmentForm({
  clients,
  barbers,
  services,
  date,
  onDone,
}: {
  clients: Pick<Client, "id" | "full_name">[];
  barbers: BarberOption[];
  services: Service[];
  date: string;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: "",
      membershipId: barbers[0]?.membershipId ?? "",
      serviceId: "",
      date,
      startTime: "09:00",
      notes: "",
    },
  });

  const onSubmit = (data: AppointmentFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createAppointmentAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appt-client">Cliente</Label>
          <select
            id="appt-client"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("clientId")}
          >
            <option value="">Selecciona...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p className="text-sm text-destructive">
              {errors.clientId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="appt-barber">Barbero</Label>
          <select
            id="appt-barber"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("membershipId")}
          >
            {barbers.map((b) => (
              <option key={b.membershipId} value={b.membershipId}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appt-service">Servicio</Label>
          <select
            id="appt-service"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("serviceId")}
          >
            <option value="">Selecciona...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min)
              </option>
            ))}
          </select>
          {errors.serviceId && (
            <p className="text-sm text-destructive">
              {errors.serviceId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="appt-date">Fecha</Label>
            <Input id="appt-date" type="date" {...register("date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appt-time">Hora</Label>
            <Input id="appt-time" type="time" {...register("startTime")} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appt-notes">Notas</Label>
        <Input id="appt-notes" {...register("notes")} />
      </div>
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Agendando..." : "Agendar"}
        </Button>
      </div>
    </form>
  );
}

function AppointmentCard({
  appt,
  canManage,
}: {
  appt: AgendaAppointment;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(appt.starts_at.slice(0, 10));
  const [newTime, setNewTime] = useState(timeOf(appt.starts_at));
  const [error, setError] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[appt.status] ?? [];
  const live = appt.status !== "cancelled" && appt.status !== "no_show";

  return (
    <div
      className={`rounded-md border border-l-4 p-3 text-sm ${STATUS_CLASS[appt.status]}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {timeOf(appt.starts_at)}–{timeOf(appt.ends_at)}
        </span>
        <span className="text-xs text-muted-foreground">
          {STATUS_LABEL[appt.status]}
        </span>
      </div>
      <p>{appt.clients?.full_name ?? "Cliente"}</p>
      <p className="text-muted-foreground">{appt.services?.name}</p>
      {canManage && transitions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {transitions.map((to) => (
            <Button
              key={to}
              size="sm"
              variant={to === "cancelled" || to === "no_show" ? "ghost" : "outline"}
              className={
                to === "cancelled" || to === "no_show"
                  ? "h-7 px-2 text-xs text-destructive"
                  : "h-7 px-2 text-xs"
              }
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await updateAppointmentStatusAction(
                    appt.id,
                    to as AppointmentStatus,
                    to === "cancelled" ? "Cancelada desde agenda" : undefined,
                  );
                  if ("error" in result) setError(result.error);
                })
              }
            >
              {TRANSITION_LABEL[to]}
            </Button>
          ))}
          {live && (
            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" />
                }
              >
                Reagendar
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Reagendar cita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                    <Input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await rescheduleAppointmentAction(
                          appt.id,
                          newDate,
                          newTime,
                        );
                        if ("error" in result) setError(result.error);
                        else setRescheduleOpen(false);
                      })
                    }
                  >
                    Confirmar nuevo horario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      {error && !rescheduleOpen && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

export function AgendaDay({
  date,
  barbers,
  appointments,
  clients,
  services,
  canManage,
}: {
  date: string;
  barbers: BarberOption[];
  appointments: AgendaAppointment[];
  clients: Pick<Client, "id" | "full_name">[];
  services: Service[];
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const setDate = (d: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("fecha", d);
    router.push(`/dashboard/agenda?${next.toString()}`);
  };

  const shiftDay = (delta: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftDay(-1)}>
            ←
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={() => shiftDay(1)}>
            →
          </Button>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Nueva cita</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva cita</DialogTitle>
              </DialogHeader>
              <NewAppointmentForm
                clients={clients}
                barbers={barbers}
                services={services}
                date={date}
                onDone={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {barbers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay barberos activos. Agrega miembros con rol barbero en Equipo.
        </p>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(barbers.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {barbers.map((b) => {
            const items = appointments
              .filter((a) => a.membership_id === b.membershipId)
              .sort((x, y) => x.starts_at.localeCompare(y.starts_at));
            return (
              <div key={b.membershipId} className="space-y-2">
                <h3 className="border-b pb-1 text-sm font-medium">{b.name}</h3>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin citas</p>
                ) : (
                  items.map((a) => (
                    <AppointmentCard key={a.id} appt={a} canManage={canManage} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
