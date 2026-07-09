"use client";

import { useState, useTransition } from "react";
import { changePlanAction } from "@/features/billing/actions";
import type { Plan, TenantSubscription } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function PlanSection({
  plans,
  subscription,
  canManage,
}: {
  plans: Plan[];
  subscription: TenantSubscription | null;
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPlanId = subscription?.plan_id ?? "free";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de suscripción</CardTitle>
        <CardDescription>
          El cobro automático llegará pronto; por ahora el cambio de plan es
          inmediato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlanId;
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-md border p-4 ${
                  isCurrent ? "border-primary ring-1 ring-primary" : ""
                }`}
              >
                <p className="font-medium">
                  {p.name}
                  {isCurrent && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      Actual
                    </span>
                  )}
                </p>
                <p className="text-xl font-semibold">
                  {p.price_monthly === 0
                    ? "Gratis"
                    : `${money(p.price_monthly, p.currency)}/mes`}
                </p>
                <ul className="mt-2 flex-1 space-y-1 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                {canManage && !isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await changePlanAction(p.id);
                        if ("error" in result) setError(result.error);
                      })
                    }
                  >
                    Cambiar a {p.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
