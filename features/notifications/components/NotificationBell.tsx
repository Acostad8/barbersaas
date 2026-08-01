"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import type { AppNotification } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

export function NotificationBell({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative w-full justify-start"
        onClick={() => setOpen((v) => !v)}
      >
        Notificaciones
        {unread > 0 && (
          <span className="ml-2 rounded-full bg-red-500 px-1.5 text-xs text-white">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-md border bg-popover p-2 shadow-md">
          <div className="mb-1 flex items-center justify-between px-1">
            <p className="text-xs font-medium">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-primary underline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                  })
                }
              >
                Marcar leídas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              Sin notificaciones.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded px-2 py-1.5 text-xs ${
                    n.read_at ? "text-muted-foreground" : "bg-muted"
                  }`}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}>
                      <span className="font-medium">{n.title}</span>
                      {n.body && <span className="block">{n.body}</span>}
                    </Link>
                  ) : (
                    <>
                      <span className="font-medium">{n.title}</span>
                      {n.body && <span className="block">{n.body}</span>}
                    </>
                  )}
                  <span className="block text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
