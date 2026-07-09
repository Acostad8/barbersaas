"use client";

import { useState, useTransition } from "react";
import {
  closeSessionAction,
  createSaleAction,
  openSessionAction,
  type SaleLine,
  type SalePaymentInput,
} from "@/features/pos/actions";
import type {
  Branch,
  CashSession,
  Client,
  PaymentMethod,
  Product,
  Sale,
  Service,
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

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

type CartLine = SaleLine & { name: string; unitPrice: number; taxRate: number };

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function computeTotal(cart: CartLine[], tip: number) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const line of cart) {
    const gross = line.unitPrice * line.quantity;
    subtotal += gross;
    discount += line.discount;
    tax += Math.round((gross - line.discount) * (line.taxRate / 100) * 100) / 100;
  }
  return {
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax + tip,
  };
}

function OpenSessionCard({ branches }: { branches: Branch[] }) {
  const [amount, setAmount] = useState("0");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Abrir caja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="open-branch">Sede</Label>
          <select
            id="open-branch"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Principal</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="open-amount">Base inicial (efectivo)</Label>
          <Input
            id="open-amount"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await openSessionAction(
                branchId,
                Number(amount) || 0,
              );
              if ("error" in result) setError(result.error);
            })
          }
        >
          {isPending ? "Abriendo..." : "Abrir caja"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CloseSessionDialog({
  session,
  currency,
}: {
  session: CashSession;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Cerrar caja
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cierre de caja (arqueo)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Base inicial: {money(session.opening_amount, currency)}. Cuenta el
            efectivo y registra el monto final.
          </p>
          <div className="space-y-2">
            <Label htmlFor="close-amount">Efectivo contado</Label>
            <Input
              id="close-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="close-notes">Notas</Label>
            <Input
              id="close-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            disabled={isPending || amount === ""}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await closeSessionAction(
                  session.id,
                  Number(amount),
                  notes,
                );
                if ("error" in result) setError(result.error);
                else setOpen(false);
              })
            }
          >
            {isPending ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PosTerminal({
  session,
  branches,
  services,
  products,
  clients,
  recentSales,
  currency,
}: {
  session: CashSession | null;
  branches: Branch[];
  services: Service[];
  products: Product[];
  clients: Pick<Client, "id" | "full_name">[];
  recentSales: Sale[];
  currency: string;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tip, setTip] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [clientId, setClientId] = useState("");
  const [payments, setPayments] = useState<SalePaymentInput[]>([]);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{
    sale_number: number;
    total: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!session) {
    return (
      <div className="space-y-6">
        <OpenSessionCard branches={branches} />
        <RecentSales sales={recentSales} currency={currency} />
      </div>
    );
  }

  const totals = computeTotal(cart, Number(tip) || 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.round((totals.total - paid) * 100) / 100;

  const addLine = (line: CartLine) => {
    setCart((prev) => {
      const existing = prev.find(
        (l) => l.id === line.id && l.type === line.type,
      );
      if (existing) {
        return prev.map((l) =>
          l.id === line.id && l.type === line.type
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [...prev, line];
    });
  };

  const reset = () => {
    setCart([]);
    setTip("0");
    setCouponCode("");
    setClientId("");
    setPayments([]);
    setPayAmount("");
    setError(null);
  };

  const submit = () => {
    setError(null);
    setLastSale(null);
    startTransition(async () => {
      const result = await createSaleAction({
        sessionId: session.id,
        items: cart.map(({ type, id, quantity, discount }) => ({
          type,
          id,
          quantity,
          discount,
        })),
        payments,
        tip: Number(tip) || 0,
        clientId: clientId === "" ? null : clientId,
        notes: "",
        couponCode,
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        setLastSale(result.data ?? null);
        reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Caja abierta desde{" "}
          {new Date(session.opened_at).toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
          })}{" "}
          · Base {money(session.opening_amount, currency)}
        </p>
        <CloseSessionDialog session={session} currency={currency} />
      </div>

      {lastSale && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Venta #{lastSale.sale_number} registrada ·{" "}
          {money(lastSale.total, currency)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-medium">Catálogo</h2>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">
              Servicios
            </p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addLine({
                      type: "service",
                      id: s.id,
                      quantity: 1,
                      discount: 0,
                      name: s.name,
                      unitPrice: s.price,
                      taxRate: s.tax_rate,
                    })
                  }
                >
                  {s.name} · {money(s.price, currency)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase">
              Productos
            </p>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addLine({
                      type: "product",
                      id: p.id,
                      quantity: 1,
                      discount: 0,
                      name: p.name,
                      unitPrice: p.price,
                      taxRate: 0,
                    })
                  }
                >
                  {p.name} · {money(p.price, currency)}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-medium">Venta actual</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agrega servicios o productos.
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((line) => (
                <li
                  key={`${line.type}-${line.id}`}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <span className="flex-1">{line.name}</span>
                  <Input
                    type="number"
                    min={1}
                    className="w-16"
                    value={line.quantity}
                    onChange={(e) =>
                      setCart((prev) =>
                        prev.map((l) =>
                          l === line
                            ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) }
                            : l,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    className="w-24"
                    placeholder="Desc."
                    value={line.discount || ""}
                    onChange={(e) =>
                      setCart((prev) =>
                        prev.map((l) =>
                          l === line
                            ? { ...l, discount: Math.max(0, Number(e.target.value) || 0) }
                            : l,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setCart((prev) => prev.filter((l) => l !== line))
                    }
                  >
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="pos-client">Cliente (opcional)</Label>
              <select
                id="pos-client"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pos-tip">Propina</Label>
              <Input
                id="pos-tip"
                type="number"
                min={0}
                value={tip}
                onChange={(e) => setTip(e.target.value)}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="pos-coupon">Cupón (opcional)</Label>
              <Input
                id="pos-coupon"
                placeholder="DESC10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p>Subtotal: {money(totals.subtotal, currency)}</p>
            <p>Descuentos: -{money(totals.discount, currency)}</p>
            <p>Impuestos: {money(totals.tax, currency)}</p>
            <p>Propina: {money(Number(tip) || 0, currency)}</p>
            <p className="font-medium">Total: {money(totals.total, currency)}</p>
            {couponCode && (
              <p className="text-xs text-muted-foreground">
                El descuento del cupón se aplica al cobrar; si los pagos no
                cuadran, el mensaje te dirá el total final.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Pagos</Label>
            <div className="flex gap-2">
              <select
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0}
                placeholder={remaining > 0 ? String(remaining) : "0"}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const amount = Number(payAmount) || remaining;
                  if (amount <= 0) return;
                  setPayments((prev) => [
                    ...prev,
                    { method: payMethod, amount },
                  ]);
                  setPayAmount("");
                }}
              >
                Agregar
              </Button>
            </div>
            {payments.length > 0 && (
              <ul className="space-y-1 text-sm">
                {payments.map((p, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {PAYMENT_LABELS[p.method]}: {money(p.amount, currency)}
                    </span>
                    <button
                      type="button"
                      className="text-destructive"
                      onClick={() =>
                        setPayments((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted-foreground">
              Pagado: {money(paid, currency)} · Falta:{" "}
              {money(Math.max(0, remaining), currency)}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            disabled={isPending || cart.length === 0 || remaining !== 0}
            onClick={submit}
          >
            {isPending ? "Registrando..." : "Cobrar"}
          </Button>
        </section>
      </div>

      <RecentSales sales={recentSales} currency={currency} />
    </div>
  );
}

function RecentSales({
  sales,
  currency,
}: {
  sales: Sale[];
  currency: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-medium">Ventas recientes</h2>
      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin ventas aún.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {sales.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>
                #{s.sale_number} · {money(s.total, currency)}
                {s.tip > 0 && ` (propina ${money(s.tip, currency)})`}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString("es-CO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
