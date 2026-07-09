"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCouponAction,
  saveLoyaltySettingsAction,
  setCouponActiveAction,
} from "@/features/marketing/actions";
import {
  couponFormSchema,
  loyaltyFormSchema,
  type CouponFormInput,
  type LoyaltyFormInput,
} from "@/features/marketing/schemas";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  ClientSegment,
  Coupon,
  LoyaltySettings,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const SEGMENT_CLASS: Record<ClientSegment["segment"], string> = {
  nuevo: "bg-blue-100 text-blue-800",
  frecuente: "bg-green-100 text-green-800",
  inactivo: "bg-red-100 text-red-800",
  regular: "bg-muted text-muted-foreground",
};

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function CouponForm({ onDone }: { onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CouponFormInput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      minPurchase: "",
      maxUses: "",
      validFrom: "",
      validUntil: "",
    },
  });

  const onSubmit = (data: CouponFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createCouponAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cp-code">Código</Label>
          <Input id="cp-code" placeholder="DESC10" {...register("code")} />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-type">Tipo</Label>
          <select
            id="cp-type"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("discountType")}
          >
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-value">Valor del descuento</Label>
          <Input
            id="cp-value"
            type="number"
            min={0}
            step="0.5"
            {...register("discountValue")}
          />
          {errors.discountValue && (
            <p className="text-sm text-destructive">
              {errors.discountValue.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-min">Compra mínima</Label>
          <Input id="cp-min" type="number" min={0} {...register("minPurchase")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-uses">Usos máximos (vacío = ilimitado)</Label>
          <Input id="cp-uses" type="number" min={1} {...register("maxUses")} />
          {errors.maxUses && (
            <p className="text-sm text-destructive">{errors.maxUses.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="cp-from">Desde</Label>
            <Input id="cp-from" type="date" {...register("validFrom")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-until">Hasta</Label>
            <Input id="cp-until" type="date" {...register("validUntil")} />
            {errors.validUntil && (
              <p className="text-sm text-destructive">
                {errors.validUntil.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cp-desc">Descripción</Label>
        <Input id="cp-desc" {...register("description")} />
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
          {isPending ? "Creando..." : "Crear cupón"}
        </Button>
      </div>
    </form>
  );
}

function LoyaltyCard({ settings }: { settings: LoyaltySettings | null }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } =
    useForm<LoyaltyFormInput>({
      resolver: zodResolver(loyaltyFormSchema),
      defaultValues: {
        enabled: settings?.enabled ?? false,
        pointsPer1000: settings ? String(settings.earn_rate * 1000) : "1",
      },
    });

  const onSubmit = (data: LoyaltyFormInput) => {
    setStatus(null);
    startTransition(async () => {
      const result = await saveLoyaltySettingsAction(data);
      setStatus("error" in result ? result.error : "Guardado");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Programa de puntos</CardTitle>
        <CardDescription>
          Los clientes acumulan puntos automáticamente en cada venta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-wrap items-end gap-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("enabled")} />
            Activo
          </label>
          <div className="space-y-1">
            <Label htmlFor="loy-rate">Puntos por cada 1.000 gastados</Label>
            <Input
              id="loy-rate"
              type="number"
              min={0}
              step="0.1"
              className="w-40"
              {...register("pointsPer1000")}
            />
            {errors.pointsPer1000 && (
              <p className="text-sm text-destructive">
                {errors.pointsPer1000.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          {status && (
            <p className="text-sm text-muted-foreground">{status}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function MarketingDashboard({
  coupons,
  settings,
  segments,
  currency,
}: {
  coupons: Coupon[];
  settings: LoyaltySettings | null;
  segments: ClientSegment[];
  currency: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  const filtered =
    segmentFilter === "todos"
      ? segments
      : segments.filter((s) => s.segment === segmentFilter);

  const exportSegments = () => {
    downloadCsv(
      `segmentos_${segmentFilter}.csv`,
      toCsv(
        ["Cliente", "Teléfono", "Correo", "Segmento", "Visitas", "Gasto total", "Puntos"],
        filtered.map((s) => [
          s.full_name,
          s.phone ?? "",
          s.email ?? "",
          s.segment,
          s.total_visits,
          s.total_spent,
          s.points,
        ]),
      ),
    );
  };

  return (
    <div className="space-y-8">
      <LoyaltyCard settings={settings} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Cupones</h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Nuevo cupón</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo cupón</DialogTitle>
              </DialogHeader>
              <CouponForm onDone={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin cupones. Crea uno y canjéalo desde el POS.
          </p>
        ) : (
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-md border p-4"
              >
                <div className="min-w-0">
                  <p className="font-mono font-medium">
                    {c.code}
                    {!c.is_active && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : money(c.discount_value, currency)}
                    {c.min_purchase > 0 &&
                      ` · mín. ${money(c.min_purchase, currency)}`}
                    {c.max_uses != null &&
                      ` · ${c.used_count}/${c.max_uses} usos`}
                    {c.max_uses == null && ` · ${c.used_count} usos`}
                    {c.valid_until && ` · vence ${c.valid_until}`}
                  </p>
                </div>
                <Switch
                  checked={c.is_active}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    startTransition(async () => {
                      await setCouponActiveAction(c.id, checked);
                    })
                  }
                  aria-label={`Activar o desactivar ${c.code}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Segmentos de clientes</h2>
          <div className="flex gap-2">
            <select
              className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
            >
              <option value="todos">Todos ({segments.length})</option>
              {(["frecuente", "regular", "nuevo", "inactivo"] as const).map(
                (s) => (
                  <option key={s} value={s}>
                    {s} ({segments.filter((x) => x.segment === s).length})
                  </option>
                ),
              )}
            </select>
            <Button variant="outline" size="sm" onClick={exportSegments}>
              Exportar CSV
            </Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin clientes.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Segmento</th>
                  <th className="px-3 py-2 font-medium">Visitas</th>
                  <th className="px-3 py-2 font-medium">Gasto total</th>
                  <th className="px-3 py-2 font-medium">Puntos</th>
                  <th className="px-3 py-2 font-medium">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.client_id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {s.full_name}
                      <span className="block text-xs text-muted-foreground">
                        {[s.phone, s.email].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${SEGMENT_CLASS[s.segment]}`}
                      >
                        {s.segment}
                      </span>
                    </td>
                    <td className="px-3 py-2">{s.total_visits}</td>
                    <td className="px-3 py-2">
                      {money(Number(s.total_spent), currency)}
                    </td>
                    <td className="px-3 py-2">{s.points}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.last_visit
                        ? new Date(s.last_visit).toLocaleDateString("es-CO")
                        : "Nunca"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
