"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setClientActiveAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/ClientForm";
import type { Client } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

function ClientRow({ client, canManage }: { client: Client; canManage: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div className="min-w-0">
        <p className="font-medium">
          {client.full_name}
          {client.rating && (
            <span className="ml-2 text-xs text-amber-600">
              {"★".repeat(client.rating)}
            </span>
          )}
          {!client.is_active && (
            <span className="ml-2 text-xs text-muted-foreground">
              (inactivo)
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {[client.phone, client.email].filter(Boolean).join(" · ") ||
            "Sin contacto"}
        </p>
        {client.tags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </p>
        )}
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-3">
          <Switch
            checked={client.is_active}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await setClientActiveAction(client.id, checked);
              })
            }
            aria-label={`Activar o desactivar ${client.full_name}`}
          />
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Editar
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar cliente</DialogTitle>
              </DialogHeader>
              <ClientForm client={client} onDone={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </li>
  );
}

export function ClientList({
  clients,
  canManage,
  total,
  page,
  pageSize,
}: {
  clients: Client[];
  canManage: boolean;
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const navigate = (params: { q?: string; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (params.q !== undefined) {
      if (params.q) next.set("q", params.q);
      else next.delete("q");
      next.delete("page");
    }
    if (params.page !== undefined) {
      if (params.page > 1) next.set("page", String(params.page));
      else next.delete("page");
    }
    router.push(`/dashboard/clientes?${next.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q: search.trim() });
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo..."
          />
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>Nuevo cliente</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo cliente</DialogTitle>
              </DialogHeader>
              <ClientForm onDone={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {total === 0 && !searchParams.get("q")
            ? "Aún no hay clientes registrados."
            : "Sin resultados para esta búsqueda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <ClientRow key={c.id} client={c} canManage={canManage} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {total} clientes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
