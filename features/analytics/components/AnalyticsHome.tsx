import type { AnalyticsOverview } from "@/lib/supabase/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function delta(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? "nuevo" : null;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs período anterior`;
}

function Kpi({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string | null;
}) {
  const positive = trend?.startsWith("+") || trend === "nuevo";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
        {trend && (
          <p
            className={`text-xs ${positive ? "text-green-600" : "text-red-600"}`}
          >
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsHome({
  overview,
  currency,
}: {
  overview: AnalyticsOverview;
  currency: string;
}) {
  const hours = [...new Set(overview.heatmap.map((h) => h.hour))].sort(
    (a, b) => a - b,
  );
  const max = Math.max(1, ...overview.heatmap.map((h) => h.appointments));
  const cell = (dow: number, hour: number) =>
    overview.heatmap.find((h) => h.dow === dow && h.hour === hour)
      ?.appointments ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={`Ingresos (${overview.days}d)`}
          value={money(overview.current.revenue, currency)}
          trend={delta(overview.current.revenue, overview.previous.revenue)}
        />
        <Kpi
          label={`Ventas (${overview.days}d)`}
          value={String(overview.current.sales_count)}
          trend={delta(
            overview.current.sales_count,
            overview.previous.sales_count,
          )}
        />
        <Kpi
          label={`Clientes nuevos (${overview.days}d)`}
          value={String(overview.new_clients_current)}
          trend={delta(
            overview.new_clients_current,
            overview.new_clients_previous,
          )}
        />
        <Kpi
          label="Citas completadas"
          value={`${overview.appointments_current.completed}/${overview.appointments_current.total}`}
          trend={
            overview.appointments_current.no_show > 0
              ? `${overview.appointments_current.no_show} no-show`
              : null
          }
        />
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Horas pico (últimos 90 días)</h2>
        {overview.heatmap.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay suficientes citas para el mapa de calor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="pr-2" />
                  {hours.map((h) => (
                    <th key={h} className="px-1 font-normal text-muted-foreground">
                      {String(h).padStart(2, "0")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((dow) => (
                  <tr key={dow}>
                    <td className="pr-2 text-muted-foreground">
                      {DOW_LABELS[dow - 1]}
                    </td>
                    {hours.map((h) => {
                      const v = cell(dow, h);
                      const intensity = v / max;
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            className="flex h-7 w-9 items-center justify-center rounded"
                            style={{
                              backgroundColor:
                                v === 0
                                  ? "var(--muted)"
                                  : `rgba(22, 163, 74, ${0.25 + intensity * 0.75})`,
                              color: intensity > 0.5 ? "white" : undefined,
                            }}
                            title={`${DOW_LABELS[dow - 1]} ${h}:00 — ${v} citas`}
                          >
                            {v > 0 ? v : ""}
                          </div>
                        </td>
                      );
                    })}
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
