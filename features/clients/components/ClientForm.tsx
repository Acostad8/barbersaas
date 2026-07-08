"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createClientAction,
  updateClientAction,
} from "@/features/clients/actions";
import {
  clientFormSchema,
  type ClientFormInput,
} from "@/features/clients/schemas";
import type { Client } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ClientForm({
  client,
  onDone,
}: {
  client?: Client;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client
      ? {
          fullName: client.full_name,
          email: client.email ?? "",
          phone: client.phone ?? "",
          birthdate: client.birthdate ?? "",
          notes: client.notes ?? "",
          tags: client.tags.join(", "),
          rating: client.rating ? (String(client.rating) as "1") : "",
          marketingConsent: client.marketing_consent,
          whatsappConsent: client.whatsapp_consent,
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          birthdate: "",
          notes: "",
          tags: "",
          rating: "",
          marketingConsent: false,
          whatsappConsent: false,
        },
  });

  const onSubmit = (data: ClientFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = client
        ? await updateClientAction(client.id, data)
        : await createClientAction(data);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        onDone();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-name">Nombre completo</Label>
          <Input id="client-name" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-phone">Teléfono</Label>
          <Input id="client-phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-email">Correo</Label>
          <Input id="client-email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-birthdate">Cumpleaños</Label>
          <Input id="client-birthdate" type="date" {...register("birthdate")} />
          {errors.birthdate && (
            <p className="text-sm text-destructive">
              {errors.birthdate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-tags">Etiquetas (separadas por coma)</Label>
          <Input
            id="client-tags"
            placeholder="vip, corte-clasico"
            {...register("tags")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-rating">Calificación</Label>
          <select
            id="client-rating"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("rating")}
          >
            <option value="">Sin calificar</option>
            {["1", "2", "3", "4", "5"].map((r) => (
              <option key={r} value={r}>
                {"★".repeat(Number(r))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-notes">Notas</Label>
        <Textarea id="client-notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("marketingConsent")} />
          Acepta comunicaciones de marketing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("whatsappConsent")} />
          Acepta mensajes por WhatsApp
        </label>
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
          {isPending
            ? "Guardando..."
            : client
              ? "Guardar cambios"
              : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
