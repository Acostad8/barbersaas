import type { AnalyticsOverview } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const S = { width: 16, height: 16, viewBox: "0 0 20 20", fill: "none" };
const P = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

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
  return `${sign}${pct.toFixed(0)}%`;
}

function Kpi({
  label,
  value,
  trend,
  trendNote,
  negative,
  icon,
  tint,
}: {
  label: string;
  value: string;
  trend: string | null;
  trendNote?: string;
  negative?: boolean;
  icon: React.ReactNode;
  tint: string;
}) {
  const positive = !negative && (trend?.startsWith("+") || trend === "nuevo");
  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-sans text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </CardTitle>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            tint,
          )}
        >
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-medium tracking-tight">
          {value}
        </p>
        {trend && (
          <p className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                positive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
              )}
            >
              {trend !== "nuevo" && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path
                    d={positive ? "M2 8 8 2M4 2h4v4" : "M2 2l6 6M8 4v4H4"}
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {trend}
            </span>
            {trendNote && (
              <span className="text-[11px] text-muted-foreground">
                {trendNote}
              </span>
            )}
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

  const noShow = overview.appointments_current.no_show;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={`Ingresos · ${overview.days}d`}
          value={money(overview.current.revenue, currency)}
          trend={delta(overview.current.revenue, overview.previous.revenue)}
          trendNote="vs período anterior"
          tint="border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          icon={
            <svg {...S} aria-hidden>
              <circle {...P} cx="10" cy="10" r="7.5" />
              <path
                {...P}
                d="M12.5 7.5c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.2 5 3.7 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.5-2.5-1.2M10 4.8v10.4"
              />
            </svg>
          }
        />
        <Kpi
          label={`Ventas · ${overview.days}d`}
          value={String(overview.current.sales_count)}
          trend={delta(
            overview.current.sales_count,
            overview.previous.sales_count,
          )}
          trendNote="vs período anterior"
          tint="border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          icon={
            <svg {...S} aria-hidden>
              <rect {...P} x="2.5" y="4.5" width="15" height="11" rx="2.5" />
              <path {...P} d="M2.5 8.5h15M5.5 12h3" />
            </svg>
          }
        />
        <Kpi
          label={`Clientes nuevos · ${overview.days}d`}
          value={String(overview.new_clients_current)}
          trend={delta(
            overview.new_clients_current,
            overview.new_clients_previous,
          )}
          trendNote="vs período anterior"
          tint="border-sky-600/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
          icon={
            <svg {...S} aria-hidden>
              <circle {...P} cx="7.5" cy="7" r="3" />
              <path
                {...P}
                d="M2.5 17c.6-3 2.7-4.5 5-4.5s4.4 1.5 5 4.5M15 5v5M12.5 7.5h5"
              />
            </svg>
          }
        />
        <Kpi
          label="Citas completadas"
          value={`${overview.appointments_current.completed}/${overview.appointments_current.total}`}
          trend={noShow > 0 ? `${noShow} no-show` : null}
          negative={noShow > 0}
          tint="border-violet-600/20 bg-violet-500/10 text-violet-700 dark:text-violet-400"
          icon={
            <svg {...S} aria-hidden>
              <rect {...P} x="2.5" y="4" width="15" height="13.5" rx="3" />
              <path {...P} d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3m-6 8 2 2 3.5-3.5" />
            </svg>
          }
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Horas pico{" "}
            <span className="font-sans text-xs font-normal text-muted-foreground">
              · últimos 90 días
            </span>
          </CardTitle>
          {overview.heatmap.length > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              menos
              {[0.15, 0.4, 0.65, 0.9].map((a) => (
                <span
                  key={a}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: `rgba(217, 119, 6, ${a})` }}
                />
              ))}
              más
            </span>
          )}
        </CardHeader>
        <CardContent>
          {overview.heatmap.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay suficientes citas para el mapa de calor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="pr-3" />
                    {hours.map((h) => (
                      <th
                        key={h}
                        className="px-1 pb-1.5 font-normal text-muted-foreground"
                      >
                        {String(h).padStart(2, "0")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7].map((dow) => (
                    <tr key={dow}>
                      <td className="pr-3 text-muted-foreground">
                        {DOW_LABELS[dow - 1]}
                      </td>
                      {hours.map((h) => {
                        const v = cell(dow, h);
                        const intensity = v / max;
                        return (
                          <td key={h} className="p-0.5">
                            <div
                              className="flex h-8 w-10 items-center justify-center rounded-md font-medium"
                              style={{
                                backgroundColor:
                                  v === 0
                                    ? "var(--muted)"
                                    : `rgba(217, 119, 6, ${0.15 + intensity * 0.75})`,
                                color: intensity > 0.55 ? "white" : undefined,
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
        </CardContent>
      </Card>
    </div>
  );
}
