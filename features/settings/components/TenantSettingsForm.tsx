"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTenantAction } from "@/features/settings/actions";
import {
  CURRENCIES,
  TIMEZONES,
  updateTenantSchema,
  type UpdateTenantInput,
} from "@/features/settings/schemas";
import type { Tenant } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function TenantSettingsForm({ tenant }: { tenant: Tenant }) {
  const [status, setStatus] = useState<
    { type: "error" | "success"; message: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: tenant.name,
      description: tenant.description ?? "",
      phone: tenant.phone ?? "",
      email: tenant.email ?? "",
      website: tenant.website ?? "",
      instagram: tenant.socials.instagram ?? "",
      facebook: tenant.socials.facebook ?? "",
      tiktok: tenant.socials.tiktok ?? "",
      whatsapp: tenant.socials.whatsapp ?? "",
      timezone: tenant.timezone,
      currency: tenant.currency,
    },
  });

  const onSubmit = (data: UpdateTenantInput) => {
    setStatus(null);
    startTransition(async () => {
      const result = await updateTenantAction(data);
      if ("error" in result) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "success", message: "Cambios guardados" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos generales</CardTitle>
        <CardDescription>
          Información pública de tu barbería
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} />
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Descripción"
              htmlFor="description"
              error={errors.description?.message}
            >
              <Textarea id="description" rows={3} {...register("description")} />
            </Field>
          </div>
          <Field
            label="Correo público"
            htmlFor="email"
            error={errors.email?.message}
          >
            <Input id="email" type="email" {...register("email")} />
          </Field>
          <Field
            label="Sitio web"
            htmlFor="website"
            error={errors.website?.message}
          >
            <Input
              id="website"
              placeholder="https://..."
              {...register("website")}
            />
          </Field>
          <Field
            label="Instagram"
            htmlFor="instagram"
            error={errors.instagram?.message}
          >
            <Input id="instagram" placeholder="@usuario" {...register("instagram")} />
          </Field>
          <Field
            label="Facebook"
            htmlFor="facebook"
            error={errors.facebook?.message}
          >
            <Input id="facebook" {...register("facebook")} />
          </Field>
          <Field label="TikTok" htmlFor="tiktok" error={errors.tiktok?.message}>
            <Input id="tiktok" placeholder="@usuario" {...register("tiktok")} />
          </Field>
          <Field
            label="WhatsApp"
            htmlFor="whatsapp"
            error={errors.whatsapp?.message}
          >
            <Input id="whatsapp" placeholder="+57 300 000 0000" {...register("whatsapp")} />
          </Field>
          <Field
            label="Zona horaria"
            htmlFor="timezone"
            error={errors.timezone?.message}
          >
            <select
              id="timezone"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register("timezone")}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Moneda"
            htmlFor="currency"
            error={errors.currency?.message}
          >
            <select
              id="currency"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              {...register("currency")}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
        <CardFooter className="mt-4 flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
          {status && (
            <p
              role="status"
              className={
                status.type === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-green-600"
              }
            >
              {status.message}
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
