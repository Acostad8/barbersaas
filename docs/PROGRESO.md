# PROGRESO — BarberSaaS

> Memoria entre sesiones. Actualizar después de cada módulo completado.
> Última actualización: 2026-07-08

## Plan de fases

| Fase | Módulo | Estado |
|------|--------|--------|
| 0 | Bootstrap infraestructura | ⚠️ parcial (ver "Pendiente de validar humana") |
| 1 | Fundación (scaffold, esquema multi-tenant, auth, roles, RLS) | 🔄 en progreso |
| 2 | Gestión de barbería y sucursales | ⬜ |
| 3 | Clientes | ⬜ |
| 4 | Servicios y empleados | ⬜ |
| 5 | Agenda inteligente | ⬜ |
| 6 | Reservas online | ⬜ |
| 7 | Inventario | ⬜ |
| 8 | Punto de venta (POS) | ⬜ |
| 9 | Reportes | ⬜ |
| 10 | Marketing y fidelización | ⬜ |
| 11 | Finanzas | ⬜ |
| 12 | Configuración y facturación SaaS | ⬜ |
| 13 | Notificaciones | ⬜ |
| 14 | Analítica ejecutiva e IA | ⬜ |
| 15 | Landing page pública | ⬜ |

## Fase 0 — Bootstrap

- ✅ Proyecto Supabase existe: `barbersaas`, ref `zsroittxfvrtezhateue`,
  región us-west-2, Postgres 17, estado ACTIVE_HEALTHY (verificado vía MCP).
- ✅ `.env` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (formato publishable `sb_publishable_...`), `SUPABASE_SERVICE_ROLE_KEY` reales.
- ✅ `SUPABASE_PROJECT_REF` completado (derivado de la URL).
- ✅ CLI Supabase v2.106.0 y Node v24 disponibles.
- ❌ Docker no instalado → no hay stack local (`supabase start` imposible).

## Pendiente de validar humana

1. **`SUPABASE_ACCESS_TOKEN`** en `.env` es placeholder. El humano debe
   crear un token en Dashboard → Account → Access Tokens (`sbp_...`).
2. **`SUPABASE_DB_PASSWORD`** en `.env` es placeholder. Obtener/resetear en
   Project Settings → Database.
3. Sin esos dos valores no se puede `supabase link` ni `supabase db push`.
   Las migraciones se escriben igual en `supabase/migrations/` y se
   aplicarán apenas existan las credenciales (tarea rastreada).
4. `.mcp.json` local también tiene placeholders (el MCP usado en sesión es
   el conector de claude.ai, funciona independiente).

## Fase 1 — Fundación (en progreso)

### Hecho
- Scaffold Next.js 16.2 (App Router, Turbopack), TS estricto reforzado
  (`noUncheckedIndexedAccess`, `noUnusedLocals`, etc.), Tailwind v4,
  shadcn/ui inicializado (button, input, label, card, sonner).
- Deps: RHF + Zod v4, @hookform/resolvers, TanStack Query v5, Zustand v5,
  @supabase/ssr, @supabase/supabase-js, server-only. Vitest v4 + Testing
  Library + jsdom.
- `supabase init` + migración `20260708120000_foundation.sql`: enum
  `member_role`, tablas `tenants`/`profiles`/`memberships`, RLS completa,
  helpers security definer (`is_member_of`, `has_role`,
  `shares_tenant_with`), `create_tenant()` atómico, trigger
  `handle_new_user` (perfil al registrarse), triggers `updated_at`.
- Auth: clientes browser/server/admin (`lib/supabase/`), `proxy.ts`
  (Next 16, reemplazo de middleware) con refresh de sesión y protección de
  rutas, login/registro con RHF+Zod, callback OAuth con protección
  open-redirect, dashboard mínimo con listado de membresías, signout.
- `lib/env.ts` con validación Zod de variables de entorno.
- QueryProvider (TanStack) en layout raíz. `.env.example` versionado.
- Tests: 10/10 pasan (schemas auth + env). Lint limpio. `tsc --noEmit`
  limpio. `next build` exitoso.
- `.claude/settings.json` movido de la raíz a su ubicación correcta.

### Migraciones remotas — APLICADAS (2026-07-08, vía MCP como excepción)
- `20260708184346_foundation` y `20260708184443_security_hardening`
  aplicadas al proyecto remoto. Tablas verificadas con RLS activo.
- `get_advisors` corrido: hardening aplicado (search_path fijo,
  revokes de PUBLIC/anon, políticas SELECT consolidadas). 4 WARNs
  restantes aceptados como intencionales (ver DECISIONES.md #11).
- Archivos locales renombrados a versiones remotas para paridad con CLI.

### Por hacer
- `supabase link` cuando existan `SUPABASE_ACCESS_TOKEN` y
  `SUPABASE_DB_PASSWORD` reales en `.env` (siguen placeholder); desde ahí
  todas las migraciones van por CLI (`db push`).
- `supabase gen types` para reemplazar tipos manuales.
- OAuth Google: habilitar proveedor en dashboard Supabase (requiere
  credenciales de Google Cloud — humano).
- Siguiente: página de creación de tenant (usa `create_tenant()`), layout
  de dashboard con navegación, sistema de roles granular en UI.

## Deuda técnica

- Ninguna registrada aún.
