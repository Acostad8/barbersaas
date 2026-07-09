# PROGRESO — BarberSaaS

> Memoria entre sesiones. Actualizar después de cada módulo completado.
> Última actualización: 2026-07-08

## Plan de fases

| Fase | Módulo | Estado |
|------|--------|--------|
| 0 | Bootstrap infraestructura | ⚠️ parcial (ver "Pendiente de validar humana") |
| 1 | Fundación (scaffold, esquema multi-tenant, auth, roles, RLS) | ✅ completa (pendientes menores abajo) |
| 2 | Gestión de barbería y sucursales | ✅ completa |
| 3 | Clientes | ✅ completa (historial/métricas llegan con agenda/POS) |
| 4 | Servicios y empleados | ✅ completa (paquetes/promos → F10, metas → F9) |
| 5 | Agenda inteligente | ✅ base completa (drag&drop y vista semana/mes pendientes) |
| 6 | Reservas online | ✅ base completa (pagos, recordatorios y lista de espera pendientes) |
| 7 | Inventario | ✅ base completa (lotes/vencimientos y órdenes de compra pendientes) |
| 8 | Punto de venta (POS) | ✅ base completa (facturas formales y cupones pendientes) |
| 9 | Reportes | ✅ base completa (PDF/Excel pendiente) |
| 10 | Marketing y fidelización | ✅ base completa (campañas → F13, niveles/canje → deuda) |
| 11 | Finanzas | ✅ base completa |
| 12 | Configuración y facturación SaaS | ✅ base completa (pasarela pendiente humano) |
| 13 | Notificaciones | ✅ in-app completa (canales externos pendiente humano) |
| 14 | Analítica ejecutiva e IA | ✅ KPIs y heatmap (IA pendiente API key) |
| 15 | Landing page pública | ✅ completa |

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

## Fase 1 — Fundación (COMPLETA 2026-07-08)

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

### Completado además (cierre de fase)
- Feature tenants: schema Zod (name+slug con `slugify` para acentos/ñ),
  server action con RPC `create_tenant`, formulario onboarding con
  auto-slug, redirect dashboard↔onboarding según membresías.
- Layout dashboard: sidebar navegación, email usuario, signout.
- `lib/auth/permissions.ts`: matriz rol→permisos granulares (18 permisos,
  6 roles) con tests exhaustivos.
- Tests 26/26, lint limpio, `tsc` limpio, build OK (7 rutas).
- Smoke tests remotos: `scripts/smoke-auth.mjs` (trigger perfil + cascade)
  y `scripts/smoke-tenant.mjs` (create_tenant, membresía admin,
  aislamiento RLS entre usuarios, slug duplicado rechazado). Ambos pasan.

### Pendientes menores (no bloquean Fase 2)
- `supabase link` cuando existan `SUPABASE_ACCESS_TOKEN` y
  `SUPABASE_DB_PASSWORD` reales en `.env` (siguen placeholder); desde ahí
  todas las migraciones van por CLI (`db push`).
- `supabase gen types` para reemplazar tipos manuales.
- OAuth Google: habilitar proveedor en dashboard Supabase (requiere
  credenciales de Google Cloud — humano).
- Rutas de navegación (agenda/clientes/servicios/configuración) son
  placeholders — se implementan en sus fases.

## Fase 2 — Gestión de barbería y sucursales (COMPLETA 2026-07-08)

### Hecho
- Migraciones `20260708194032_tenant_profile_and_branches` y
  `20260708194051_drop_broad_bucket_select` (aplicadas vía MCP, misma
  excepción de bootstrap; archivos locales con versión remota):
  - `tenants` ampliado: description, phone, email, website, socials
    (JSONB), timezone, currency, logo_url, banner_url.
  - Tabla `branches`: horarios semanales JSONB
    (`{"mon":[{"open","close"}]}`), RLS (ver miembros / gestionar
    admin+manager / borrar admin), unique(tenant_id, name).
  - `memberships.branch_id` (NULL = todo el tenant).
  - Bucket `tenant-assets` público, escritura solo admin/manager del
    tenant vía carpeta `{tenant_id}/...`. Sin SELECT amplio (lint 0025).
- `lib/auth/current-tenant.ts`: `getActiveMembership()` — primera
  membresía activa (supuesto single-tenant; switcher pendiente).
- `/dashboard/configuracion`: form datos generales (RHF+Zod, socials,
  timezone, currency) + upload logo/banner vía server action a Storage
  (valida tipo/tamaño, limpia asset anterior). Gate `settings:manage`.
- `/dashboard/sucursales`: CRUD sedes con editor de horario semanal
  (checkbox por día + open/close), activar/desactivar con Switch, dialogs
  Base UI. Gate `branches:manage` para escribir; todos los miembros ven.
- `next.config.ts`: bodySizeLimit 5mb (uploads), remotePatterns Supabase.
- Tests 41/41. Lint (1 warning aceptable RHF watch + React Compiler).
  Build OK (9 rutas). Smoke `scripts/smoke-branches.mjs`: barbero ve pero
  no crea sedes ni edita tenant; owner sí. Todo verde.

### Notas
- shadcn/ui actual usa Base UI (no Radix): triggers con `render` prop,
  no `asChild`.
- Zod schemas de formularios sin `.transform()` (rompe generics de RHF
  resolver); conversión vacío→null en actions con `lib/forms.ts`.

## Fase 3 — Clientes (COMPLETA 2026-07-08)

### Hecho
- Migración `20260708195137_clients` (vía MCP, misma excepción):
  - Tabla `clients`: perfil, tags[], preferences JSONB, referred_by
    (self-FK), rating 1-5, consentimientos marketing/WhatsApp,
    `consent_updated_at` estampado por trigger al cambiar consents.
  - Email único por tenant case-insensitive (índice parcial), pg_trgm
    GIN en full_name, GIN en tags.
  - RLS: ver = staff (admin/manager/receptionist/barber); crear/editar =
    admin/manager/receptionist; borrar = admin/manager. Rol `client` sin
    acceso a otros clientes.
- `/dashboard/clientes`: listado paginado (20/pág) con búsqueda
  nombre/teléfono/correo (ilike), dialog crear/editar (cumpleaños, tags
  por coma con dedupe, calificación estrellas, consentimientos, notas),
  activar/desactivar. Gates `clients:view` / `clients:manage`.
- Tests 51/51. Build OK (10 rutas). Smoke `scripts/smoke-clients.mjs`:
  trigger de consent, email duplicado rechazado, barbero ve/no crea,
  aislamiento entre tenants. Todo verde.

### Pendiente para fases posteriores
- Historial de visitas, frecuencia, gasto total, servicios favoritos:
  derivados de agenda (F5) y POS (F8).
- `referred_by` sin UI aún (se conecta en marketing/fidelización F10).

## Fase 4 — Servicios y empleados (COMPLETA 2026-07-08)

### Hecho
- Migraciones `20260709010551_services_and_staff` y
  `20260709010839_get_user_id_by_email` (vía MCP, misma excepción):
  - `service_categories`, `services` (duración 5-480 min, precio ≥ 0,
    comisión/impuesto 0-100%, checks en DB — reglas de negocio en DB).
  - `barber_profiles` (PK = membership_id): bio, especialidades[],
    horario JSONB, comisión override, fecha contratación. Barbero puede
    editar su propia ficha (policy `owns_membership`).
  - `barber_services` M2M (solo admin/manager gestionan).
  - `time_off` con enum status: staff solicita la suya (policy fuerza
    `pending`), admin/manager aprueba/rechaza.
  - `get_user_id_by_email`: security definer SOLO service_role (evita
    enumeración de correos); usado por addMemberAction tras verificar
    permisos del caller.
- `/dashboard/servicios`: categorías inline + CRUD servicios con precio
  formateado (Intl, moneda del tenant), comisión, impuesto, activar/off.
- `/dashboard/equipo`: listado de miembros (rol, sede, especialidades),
  agregar miembro por email de usuario registrado, editar rol/sede/activo
  (bloqueado editarse a sí mismo), ficha de barbero, sección de ausencias
  con aprobar/rechazar.
- Tests 67/67. Build OK (12 rutas). Smoke `scripts/smoke-services.mjs`:
  precio negativo rechazado por check, barbero no crea servicios ni se
  auto-asigna, solicita ausencia (queda pending), no se auto-aprueba,
  owner aprueba, barbero edita su propia bio. Todo verde.

### Diferido
- Paquetes y promociones → F10 (marketing).
- Metas e indicadores de productividad → F9 (reportes).
- Invitación de usuarios no registrados (email invite) → deuda técnica;
  hoy solo se agregan usuarios ya registrados.

## Fase 5 — Agenda inteligente (BASE COMPLETA 2026-07-08)

### Hecho
- Migración `20260709011411_appointments` (vía MCP, misma excepción):
  - `appointments`: cliente/barbero/servicio/sede, precio snapshot al
    agendar, estados (scheduled→confirmed→in_progress→completed /
    cancelled / no_show).
  - **Anti doble-reserva en DB**: `EXCLUDE USING gist (membership_id
    WITH =, tstzrange WITH &&)` ignorando cancelled/no_show
    (btree_gist). Código 23P01 → mensaje amigable en la action.
  - `schedule_blocks` para bloqueos ad-hoc (por barbero o sede completa).
  - RLS: recepción/gerencia ve y gestiona todo; barbero SOLO ve y
    actualiza sus propias citas; no crea.
- Máquina de estados en `features/agenda/schemas.ts`
  (`STATUS_TRANSITIONS`), validada en action antes de actualizar.
- `/dashboard/agenda`: vista día con columnas por barbero, navegación
  ←/fecha/→, nueva cita (duración+precio salen del servicio en el
  server, nunca del cliente), transiciones de estado, reagendar
  (conserva duración), cancelación con motivo. Barbero ve solo su
  columna.
- Tests 74/74. Build OK (11 rutas). Smoke `scripts/smoke-agenda.mjs`:
  solapamiento rechazado (23P01), mismo horario con otro barbero OK,
  slot reutilizable tras cancelar, barbero ve solo lo suyo y no crea.

### Pendiente de la fase (deuda registrada)
- Timeline con drag & drop, vista semana/mes, filtros/búsqueda.
- `schedule_blocks` sin UI todavía (tabla y RLS listas).
- Validación de disponibilidad contra horario del barbero
  (`barber_profiles.schedule`) y `time_off` aprobado — hoy solo se
  previene doble-reserva; la disponibilidad completa llega con el
  portal de reservas (F6) como RPC `available_slots`.

## Fase 6 — Reservas online (BASE COMPLETA 2026-07-08)

### Hecho
- Migración `20260709013933_online_booking` (vía MCP, misma excepción).
  Tres RPCs security definer expuestos a `anon` (portal público):
  - `get_booking_info(slug)`: tenant + servicios activos + barberos.
    Solo datos pensados para ser públicos.
  - `available_slots(tenant, service, barber, date)`: horario del
    barbero (`barber_profiles.schedule`; fallback lun-sáb 09:00-19:00
    si no tiene) − citas vivas − `schedule_blocks` − `time_off`
    aprobado − slots pasados. Paso de 15 min, duración del servicio,
    zona horaria del tenant.
  - `book_appointment(...)`: valida contra `available_slots` (imposible
    reservar fuera de horario), reutiliza cliente por email/teléfono o
    lo crea, inserta cita `scheduled` con precio snapshot. Constraint de
    exclusión sigue siendo la última línea contra carreras (23P01 →
    `slot_taken`).
- Portal `/reservar/[slug]`: banner/logo, wizard servicio → barbero →
  fecha/slots (TanStack Query) → datos de contacto → confirmación.
  Ruta pública en proxy. `notFound()` si slug no existe.
- Tests 74/74, lint OK, build OK (12 rutas). Smoke
  `scripts/smoke-booking.mjs` (TODO como anon): info pública, 39 slots,
  reserva anónima, slot desaparece, doble reserva rechazada, cliente
  repetido reutilizado (case-insensitive), reserva fuera de horario
  rechazada, anon sin acceso directo a tablas.
- Advisors: WARNs 0028/0029 sobre los 3 RPCs de booking son
  intencionales (portal anónimo por diseño); resto ya documentado.

### Pendiente de la fase
- Pago online al reservar → requiere pasarela real (decisión humana:
  Stripe/Wompi/MercadoPago) — "Pendiente de validar humana".
- Recordatorios/confirmaciones → F13 (notificaciones).
- Lista de espera y cancelación/reprogramación por el cliente → deuda.
- UI del portal no probada en navegador real (flujo backend validado
  por smoke); probar visualmente al tener `npm run dev` en uso.

## Fase 7 — Inventario (BASE COMPLETA 2026-07-08)

### Hecho
- Migraciones `20260709022002_inventory` y
  `20260709022208_fix_apply_stock_movement` (vía MCP, misma excepción):
  - `suppliers`, `product_categories`, `products` (SKU único por tenant
    case-insensitive, costo/precio/min_stock con checks).
  - `stock_movements` = kardex INMUTABLE (sin policies de
    update/delete; correcciones = contramovimiento). 7 tipos:
    purchase/transfer_in/adjustment_in (entrada), sale/transfer_out/
    adjustment_out/loss (salida). `branch_id` NULL = ubicación principal.
  - `stock_levels` cache mantenido por trigger SECURITY DEFINER
    (`apply_stock_movement`); usuarios sin escritura directa. Check
    `quantity >= 0` → sobreventa imposible (`insufficient_stock`).
  - **Bug encontrado y corregido**: los CHECK se evalúan ANTES que el
    arbitraje de ON CONFLICT, así que insertar delta negativo explotaba
    antes de llegar al DO UPDATE. Fix: UPDATE primero, INSERT solo si
    no existe fila (con manejo de carrera por unique_violation).
  - RLS: todo inventario solo admin/manager (POS ampliará a
    receptionist para ventas en F8).
- `/dashboard/inventario`: alertas de stock bajo (≤ min_stock), CRUD
  productos, registrar movimiento (tipo/sede/cantidad/costo), kardex
  reciente (30), proveedores y categorías inline.
- Tests 82/82. Build OK (13 rutas). Smoke `scripts/smoke-inventory.mjs`:
  compra→stock 10, venta→6, sobreventa bloqueada con stock intacto,
  kardex inmutable, stock_levels no escribible, barbero sin acceso.

### Diferido
- Lotes y vencimientos, órdenes de compra formales → deuda técnica.
- Venta de productos desde POS descuenta stock → F8.

## Fase 8 — Punto de venta (BASE COMPLETA 2026-07-08)

### Hecho
- Migración `20260709024614_pos` (vía MCP, misma excepción):
  - `cash_sessions`: una caja abierta por tenant+sede (índice único
    parcial), apertura con base, cierre con arqueo (`expected_amount` =
    base + ventas en efectivo de la sesión).
  - `sales` con numeración secuencial por tenant (`tenant_counters`
    con row-lock), `sale_items` (snapshot de descripción/precio,
    servicio O producto vía `num_nonnulls`), `sale_payments`
    (multipago: cash/card/transfer/other).
  - **Sin policies de escritura directa**: toda venta pasa por RPC
    `create_sale` SECURITY DEFINER que calcula totales SERVER-SIDE
    desde el catálogo (el cliente solo manda ids/cantidades/descuentos),
    valida sesión abierta, descuenta stock de productos vía kardex
    (stock insuficiente aborta TODO), exige pagos == total, y completa
    la cita si se vincula. RPCs `open/close_cash_session` con chequeo
    de rol interno.
  - Lectura: admin/manager/receptionist/accountant.
- `/dashboard/pos`: abrir caja (sede + base), terminal de venta
  (catálogo clicable, carrito con cantidad/descuento por línea,
  cliente opcional, propina, multipago con "falta X", cobrar
  deshabilitado hasta cuadrar), cierre con arqueo, ventas recientes.
- Tests 82/82. Build OK (14 rutas). Smoke `scripts/smoke-pos.mjs`:
  venta sin sesión rechazada, doble caja bloqueada, pagos≠total
  rechazado SIN efectos secundarios (atomicidad verificada), totales
  con IVA/descuento/propina exactos (57750), stock descontado,
  numeración secuencial, arqueo esperado exacto, barbero bloqueado.

### Diferido
- Facturación formal/electrónica, cupones → F10/F12.
- Devoluciones (contramovimiento + nota crédito) → deuda.

## Fase 9 — Reportes (BASE COMPLETA 2026-07-08)

### Hecho
- Migración `20260709041333_reports` (vía MCP): RPC `report_dashboard`
  SECURITY DEFINER (roles admin/manager/accountant), agregados 100% en
  DB con rango interpretado en la zona horaria del tenant:
  - summary (ventas, ingresos, descuentos, impuestos, propinas, ticket
    promedio), serie por día, por método de pago, top 10 servicios y
    productos, comisiones por barbero (override de
    `barber_profiles.commission_rate` → si no, tasa del servicio),
    bloque de citas (completadas/canceladas/no-show).
- `/dashboard/reportes`: rango de fechas (default mes actual), cards de
  resumen, tablas con export CSV client-side (`lib/csv.ts` con BOM
  UTF-8 y separador `;` para Excel es-CO). Gate `reports:view`.
- Tests 85/85 (incluye csv). Build OK (15 rutas). Smoke
  `scripts/smoke-reports.mjs`: agregados verificados contra ventas
  conocidas (2 ventas=65000, métodos exactos, 3 cortes, comisión
  50%=10000, citas), barbero rechazado con `forbidden`.
- Nota fechas: el rango del RPC se interpreta en la tz del tenant;
  clientes deben mandar fechas locales, no UTC.

### Diferido
- Export PDF/Excel nativo, reportes detallados de inventario y
  rentabilidad, metas de empleados → F14 amplía analítica.

## Fase 10 — Marketing y fidelización (BASE COMPLETA 2026-07-09)

### Hecho
- Migración `20260709051151_marketing_loyalty` (vía MCP):
  - `coupons`: percent/fixed, compra mínima, usos máximos con contador,
    vigencia, código normalizado a mayúsculas. Canje DENTRO de
    `create_sale` v2 con `FOR UPDATE` (serializa used_count bajo
    concurrencia); errores tipados (not_found/inactive/expired/
    exhausted/min_purchase).
  - `loyalty_settings` (earn_rate por unidad; UI lo expresa como
    puntos por cada 1.000) + `loyalty_points` ledger otorgado
    automáticamente en la venta (sobre total sin propina).
  - RPC `client_segments`: visitas 90d, gasto total, puntos, última
    visita, segmento (nuevo/frecuente/regular/inactivo).
  - `sales.coupon_id` + `coupon_discount`.
- `/dashboard/marketing`: config de puntos, CRUD cupones con
  activar/desactivar y contador de usos, tabla de segmentos con filtro
  y export CSV. Gate `marketing:manage`.
- POS: campo de cupón (server calcula el descuento; si los pagos no
  cuadran, el error dice el total final exacto).
- Tests 93/93. Build OK (16 rutas). Smoke `scripts/smoke-marketing.mjs`:
  cupón % (código lowercase normalizado), fijo, agotado/vencido/mínimo
  rechazados, 18 puntos otorgados, segmentos con cifras exactas.
- Nota supabase-js: inserts masivos con filas de forma distinta mandan
  null (no default) en columnas faltantes — dar forma completa a todas.

### Diferido
- Campañas SMS/WhatsApp/email → F13 (requiere proveedor —
  credenciales humanas). Niveles de fidelidad y canje de puntos como
  pago → deuda. Referidos UI → deuda (columna existe desde F3).

## Fase 11 — Finanzas (BASE COMPLETA 2026-07-09)

- Migración `20260709064337_finance`: `expense_categories`, `expenses`
  (monto/método/sede/fecha), RPC `finance_summary` (ingresos, impuestos,
  propinas, egresos, flujo diario fusionado, egresos por categoría) —
  todo en DB, tz del tenant. RLS admin/manager/accountant.
- `/dashboard/finanzas`: cards (balance con color), flujo diario con
  CSV, CRUD egresos, categorías inline. Smoke
  `scripts/smoke-finance.mjs` verde (cifras exactas, barbero bloqueado).

## Fase 12 — SaaS: planes y suscripciones (BASE COMPLETA 2026-07-09)

- Migración `20260709064844_saas_plans`: `plans` (free/pro/premium con
  límites de sedes/staff, lectura pública para la landing),
  `tenant_subscriptions` con trigger de auto-alta al crear tenant y
  backfill de existentes. Cambio de plan solo admin, con guard de
  downgrade (cuenta sedes/staff activos antes de permitir).
- UI de planes en Configuración con plan actual resaltado.
- **Pendiente humano**: pasarela de pago (Stripe/Wompi/MercadoPago).
  `changePlanAction` es el seam donde se conecta el checkout.

## Fase 13 — Notificaciones (BASE COMPLETA 2026-07-09)

- Migración `20260709071328_notifications`: tabla con alcance personal
  y tenant-wide (solo front desk ve las generales), inserts únicamente
  desde triggers security definer. Trigger de citas: creación (barbero
  + general), cancelación y reagendamiento (barbero). RPC
  `mark_notifications_read`.
- Campana en sidebar con badge de no leídas. Smoke
  `scripts/smoke-notifications.mjs` verde (scoping, cancelación,
  marcar leídas).
- **Pendiente humano**: canales externos email/SMS/WhatsApp — requieren
  credenciales de proveedor (Resend/Twilio). La tabla es la cola que
  consumirá una Edge Function cuando existan.

## Fase 14 — Analítica ejecutiva (BASE COMPLETA 2026-07-09)

- Migración `20260709071838_analytics`: RPC `analytics_overview` — KPIs
  30d con comparativa del período anterior (ingresos, ventas, clientes
  nuevos), resultados de citas y heatmap día×hora (90d, tz tenant).
- Home del dashboard: cards KPI con deltas de tendencia + heatmap de
  horas pico (roles con `reports:view`; el resto ve bienvenida simple).
- **Pendiente humano**: asistente conversacional IA y pronósticos —
  requieren API key de Anthropic.

## Fase 15 — Landing pública (COMPLETA 2026-07-09)

- `app/page.tsx` reescrita: hero con CTA, 6 features, planes leídos de
  la tabla `plans` (catálogo público), FAQ, footer. Metadata SEO +
  OpenGraph. Responsive.

## ✅ TODAS LAS FASES BASE COMPLETAS (2026-07-09)

15/15 fases con base funcional end-to-end. Pendientes que requieren
decisión/credencial humana: pasarela de pago, proveedor de
email/SMS/WhatsApp, API key de IA, credenciales Google OAuth,
`SUPABASE_ACCESS_TOKEN`/`DB_PASSWORD` para operar migraciones por CLI.

## Deuda técnica

- Invitación de usuarios no registrados (email invite) — hoy solo se
  agregan usuarios ya registrados (F4).
- Drag & drop y vista semana/mes en agenda; UI de `schedule_blocks` (F5).
- Cancelación/reprogramación por el cliente y lista de espera (F6).
- Lotes/vencimientos y órdenes de compra formales (F7).
- Devoluciones POS con nota crédito (F8).
- Export PDF/Excel de reportes (F9).
