"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  requestTimeOffAction,
  setTimeOffStatusAction,
} from "@/features/staff/actions";
import {
  timeOffSchema,
  type TimeOffInput,
} from "@/features/staff/schemas";
import type { Profile, TimeOff, TimeOffStatus } from "@/lib/supabase/types";
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

export type TimeOffRow = TimeOff & {
  memberships: {
    id: string;
    profiles: Pick<Profile, "full_name"> | null;
  } | null;
};

const STATUS_LABEL: Record<TimeOffStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_CLASS: Record<TimeOffStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function RequestForm({ onDone }: { onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeOffInput>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: { startsOn: "", endsOn: "", reason: "" },
  });

  const onSubmit = (data: TimeOffInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await requestTimeOffAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="to-start">Desde</Label>
          <Input id="to-start" type="date" {...register("startsOn")} />
          {errors.startsOn && (
            <p className="text-sm text-destructive">
              {errors.startsOn.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-end">Hasta</Label>
          <Input id="to-end" type="date" {...register("endsOn")} />
          {errors.endsOn && (
            <p className="text-sm text-destructive">{errors.endsOn.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="to-reason">Motivo</Label>
        <Input
          id="to-reason"
          placeholder="Vacaciones, cita médica..."
          {...register("reason")}
        />
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
          {isPending ? "Enviando..." : "Solicitar"}
        </Button>
      </div>
    </form>
  );
}

export function TimeOffSection({
  requests,
  canApprove,
}: {
  requests: TimeOffRow[];
  canApprove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Ausencias y vacaciones</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            Solicitar ausencia
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar ausencia</DialogTitle>
            </DialogHeader>
            <RequestForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin solicitudes registradas.
        </p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-md border p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {r.memberships?.profiles?.full_name ?? "Miembro"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.starts_on} → {r.ends_on}
                  {r.reason ? ` · ${r.reason}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                {canApprove && r.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await setTimeOffStatusAction(r.id, "approved");
                        })
                      }
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await setTimeOffStatusAction(r.id, "rejected");
                        })
                      }
                    >
                      Rechazar
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
