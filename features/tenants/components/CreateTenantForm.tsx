"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTenantAction } from "@/features/tenants/actions";
import {
  createTenantSchema,
  slugify,
  type CreateTenantInput,
} from "@/features/tenants/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreateTenantForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", slug: "" },
  });

  const onSubmit = (data: CreateTenantInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createTenantAction(data);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-medium tracking-tight">
          Crea tu barbería
        </CardTitle>
        <CardDescription>
          Este será tu espacio de trabajo. Podrás agregar sedes, empleados y
          servicios después.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la barbería</Label>
            <Input
              id="name"
              placeholder="Barbería El Clásico"
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) {
                    setValue("slug", slugify(e.target.value));
                  }
                },
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador (URL)</Label>
            <Input
              id="slug"
              placeholder="barberia-el-clasico"
              {...register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creando..." : "Crear barbería"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
