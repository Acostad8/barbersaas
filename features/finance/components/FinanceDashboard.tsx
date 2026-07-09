"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  deleteExpenseAction,
} from "@/features/finance/actions";
import {
  expenseFormSchema,
  type ExpenseFormInput,
} from "@/features/finance/schemas";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  Branch,
  Expense,
  ExpenseCategory,
  FinanceSummary,
  PaymentMethod,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export type ExpenseRow = Expense & {
  expense_categories: Pick<ExpenseCategory, "name"> | null;
};

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function ExpenseForm({
  categories,
  branches,
  onDone,
}: {
  categories: ExpenseCategory[];
  branches: Branch[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      categoryId: "",
      branchId: "",
      method: "cash",
      spentOn: new Date().toLocaleDateString("en-CA"),
      notes: "",
    },
  });

  const onSubmit = (data: ExpenseFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createExpenseAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="exp-desc">Descripción</Label>
          <Input id="exp-desc" placeholder="Arriendo local" {...register("description")} />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-amount">Monto</Label>
          <Input id="exp-amount" type="number" min={0} step="0.01" {...register("amount")} />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-date">Fecha</Label>
          <Input id="exp-date" type="date" {...register("spentOn")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-cat">Categoría</Label>
          <select
            id="exp-cat"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("categoryId")}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-method">Método</Label>
          <select
            id="exp-method"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("method")}
          >
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-branch">Sede</Label>
          <select
            id="exp-branch"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("branchId")}
          >
            <option value="">General</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-notes">Notas</Label>
          <Input id="exp-notes" {...register("notes")} />
        </div>
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
          {isPending ? "Registrando..." : "Registrar egreso"}
        </Button>
      </div>
    </form>
  );
}

export function FinanceDashboard({
  summary,
  expenses,
  categories,
  branches,
  from,
  to,
  currency,
}: {
  summary: FinanceSummary;
  expenses: ExpenseRow[];
  categories: ExpenseCategory[];
  branches: Branch[];
  from: string;
  to: string;
  currency: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromInput, setFromInput] = useState(from);
  const [toInput, setToInput] = useState(to);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const balance = summary.income - summary.expenses;

  const applyRange = () => {
    const next = new URLSearchParams(searchParams);
    next.set("desde", fromInput);
    next.set("hasta", toInput);
    router.push(`/dashboard/finanzas?${next.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="fin-from">
              Desde
            </label>
            <Input
              id="fin-from"
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="fin-to">
              Hasta
            </label>
            <Input
              id="fin-to"
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={applyRange}>
            Aplicar
          </Button>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>Registrar egreso</DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo egreso</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              categories={categories}
              branches={branches}
              onDone={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ingresos", value: money(summary.income, currency) },
          { label: "Egresos", value: money(summary.expenses, currency) },
          {
            label: "Balance",
            value: money(balance, currency),
          },
          {
            label: "Impuestos recaudados",
            value: money(summary.taxes_collected, currency),
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-xl font-semibold ${
                  s.label === "Balance"
                    ? balance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                    : ""
                }`}
              >
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Flujo de caja diario</h2>
          {summary.by_day.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadCsv(
                  `flujo-caja_${from}_${to}.csv`,
                  toCsv(
                    ["Día", "Ingresos", "Egresos", "Neto"],
                    summary.by_day.map((d) => [
                      d.day,
                      d.income,
                      d.expense,
                      d.income - d.expense,
                    ]),
                  ),
                )
              }
            >
              Exportar CSV
            </Button>
          )}
        </div>
        {summary.by_day.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Día</th>
                  <th className="px-3 py-2 font-medium">Ingresos</th>
                  <th className="px-3 py-2 font-medium">Egresos</th>
                  <th className="px-3 py-2 font-medium">Neto</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_day.map((d) => (
                  <tr key={d.day} className="border-b last:border-0">
                    <td className="px-3 py-2">{d.day}</td>
                    <td className="px-3 py-2 text-green-700">
                      {money(d.income, currency)}
                    </td>
                    <td className="px-3 py-2 text-red-700">
                      {money(d.expense, currency)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {money(d.income - d.expense, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-medium">Egresos por categoría</h2>
          {summary.expenses_by_category.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin egresos.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {summary.expenses_by_category.map((c) => (
                <li
                  key={c.category}
                  className="flex justify-between rounded-md border px-3 py-2"
                >
                  <span>
                    {c.category}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({c.entries})
                    </span>
                  </span>
                  <span className="font-medium">
                    {money(c.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-medium">Categorías de egreso</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setInlineError(null);
              startTransition(async () => {
                const result = await createExpenseCategoryAction(newCategory);
                if ("error" in result) setInlineError(result.error);
                else setNewCategory("");
              });
            }}
          >
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Arriendo, servicios públicos..."
            />
            <Button type="submit" variant="outline" disabled={isPending}>
              Agregar
            </Button>
          </form>
          {inlineError && (
            <p className="text-sm text-destructive">{inlineError}</p>
          )}
          <p className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {c.name}
              </span>
            ))}
          </p>
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Egresos del período</h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin egresos.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="min-w-0">
                  {e.description}
                  <span className="block text-xs text-muted-foreground">
                    {e.spent_on} · {METHOD_LABELS[e.method]}
                    {e.expense_categories?.name
                      ? ` · ${e.expense_categories.name}`
                      : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">
                    {money(e.amount, currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteExpenseAction(e.id);
                      })
                    }
                  >
                    ✕
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
