"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { PaymentMethod, ReportDashboard } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SectionTable({
  title,
  headers,
  rows,
  csvName,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  csvName: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        {rows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadCsv(csvName, toCsv(headers, rows))}
          >
            Exportar CSV
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ReportsDashboard({
  report,
  from,
  to,
  currency,
}: {
  report: ReportDashboard;
  from: string;
  to: string;
  currency: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);

  const applyRange = () => {
    const next = new URLSearchParams(searchParams);
    next.set("desde", fromInput);
    next.set("hasta", toInput);
    router.push(`/dashboard/reportes?${next.toString()}`);
  };

  const s = report.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground" htmlFor="rep-from">
            Desde
          </label>
          <Input
            id="rep-from"
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor="rep-to">
            Hasta
          </label>
          <Input
            id="rep-to"
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={applyRange}>
          Aplicar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas" value={String(s.sales_count)} />
        <StatCard label="Ingresos" value={money(s.gross_total, currency)} />
        <StatCard label="Ticket promedio" value={money(s.avg_ticket, currency)} />
        <StatCard label="Propinas" value={money(s.tips, currency)} />
        <StatCard label="Descuentos" value={money(s.discounts, currency)} />
        <StatCard label="Impuestos" value={money(s.taxes, currency)} />
        <StatCard
          label="Citas completadas"
          value={`${report.appointments.completed}/${report.appointments.total}`}
        />
        <StatCard
          label="Canceladas / No show"
          value={`${report.appointments.cancelled} / ${report.appointments.no_show}`}
        />
      </div>

      <SectionTable
        title="Ventas por día"
        headers={["Día", "Ventas", "Total"]}
        rows={report.by_day.map((d) => [
          d.day,
          d.sales_count,
          money(d.total, currency),
        ])}
        csvName={`ventas-por-dia_${from}_${to}.csv`}
      />

      <SectionTable
        title="Por método de pago"
        headers={["Método", "Ventas", "Monto"]}
        rows={report.by_method.map((m) => [
          METHOD_LABELS[m.method] ?? m.method,
          m.sales_count,
          money(m.amount, currency),
        ])}
        csvName={`por-metodo_${from}_${to}.csv`}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <SectionTable
          title="Top servicios"
          headers={["Servicio", "Cantidad", "Ingresos"]}
          rows={report.top_services.map((x) => [
            x.name,
            Number(x.quantity),
            money(x.revenue, currency),
          ])}
          csvName={`top-servicios_${from}_${to}.csv`}
        />
        <SectionTable
          title="Top productos"
          headers={["Producto", "Cantidad", "Ingresos"]}
          rows={report.top_products.map((x) => [
            x.name,
            Number(x.quantity),
            money(x.revenue, currency),
          ])}
          csvName={`top-productos_${from}_${to}.csv`}
        />
      </div>

      <SectionTable
        title="Comisiones por barbero (citas completadas)"
        headers={["Barbero", "Citas", "Ingresos", "Comisión"]}
        rows={report.commissions.map((c) => [
          c.barber,
          c.completed_appointments,
          money(c.revenue, currency),
          money(c.commission, currency),
        ])}
        csvName={`comisiones_${from}_${to}.csv`}
      />
    </div>
  );
}
