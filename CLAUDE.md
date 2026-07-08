# CLAUDE.md — Memoria del proyecto BarberSaaS

Claude Code lee este archivo automáticamente al abrir el proyecto. Mantenlo
actualizado: es tu contexto persistente entre sesiones.

## Qué es este proyecto

SaaS multi-tenant de gestión integral para barberías (ERP + agendamiento).
El detalle funcional completo vive en `docs/REQUISITOS.md`. El prompt
original de arranque está en `PROMPT_MAESTRO.md`.

## Reglas de trabajo permanentes

- Autonomía total: no preguntes por decisiones técnicas reversibles dentro
  del repo. Decide, documenta en `docs/DECISIONES.md`, continúa.
- Antes de tocar código, lee `docs/PROGRESO.md` para saber en qué fase vas.
- Al terminar cada módulo/fase: corre los tests, actualiza
  `docs/PROGRESO.md`, haz commit con Conventional Commits.
- Nunca dupliques lógica de negocio entre frontend y backend: la fuente de
  verdad de reglas de negocio críticas (precios, comisiones, disponibilidad
  de horarios, aislamiento multi-tenant) vive en la base de datos (RLS,
  triggers, funciones) y/o en la capa de servicios del backend, no en el
  cliente.
- Todo dato multi-tenant lleva `tenant_id` y una política RLS que lo filtra.
  No escribas ninguna tabla nueva sin su política RLS correspondiente en el
  mismo commit.
- Nomenclatura: tablas en snake_case en inglés (`appointments`,
  `barbers`, `services`); componentes React en PascalCase; rutas de la app
  en kebab-case.

## Stack

Next.js 14+ (App Router) · TypeScript estricto · TailwindCSS · shadcn/ui ·
React Hook Form + Zod · TanStack Query · Zustand · Supabase (Postgres, Auth,
Storage, Realtime, Edge Functions) · Vercel · GitHub Actions.

## Estructura de carpetas esperada

```
/app                # rutas Next.js (App Router)
/components          # componentes UI reutilizables (Atomic Design)
/features             # lógica de negocio por dominio (feature-based)
/lib                    # utilidades, clientes de Supabase, helpers
/supabase
  /migrations         # migraciones SQL versionadas
  /seed.sql
/docs
  PROGRESO.md         # estado de avance, se actualiza cada fase
  DECISIONES.md       # registro de decisiones técnicas tomadas sin preguntar
  REQUISITOS.md       # alcance funcional detallado
  ARQUITECTURA.md
  MODELO_DATOS.md
/tests
```

## Supabase: MCP vs CLI

- **MCP de Supabase** (`.mcp.json`): solo para administración puntual —
  crear el proyecto si no existe, consultar costos/URLs, correr
  `get_advisors` para chequeos de seguridad y rendimiento. NUNCA lo uses
  como el mecanismo con el que aplicas cambios de esquema de forma
  recurrente.
- **CLI de Supabase**: fuente de verdad del esquema. Todo cambio de tabla,
  RLS, trigger, función o índice se escribe como migración en
  `supabase/migrations/` y se aplica con `supabase db push` /
  `supabase migration up`. Si un cambio de esquema no existe como
  migración versionada, no cuenta como hecho.
- El archivo `.mcp.json` contiene un token de acceso personal: NUNCA lo
  commitees. Debe estar en `.gitignore` desde el primer commit.

## Comandos habituales

- `npm run dev` — desarrollo local
- `npm run test` — tests unitarios/integración
- `npm run lint` — linting
- `supabase migration up` — aplicar migraciones locales

## Estado actual

Ver `docs/PROGRESO.md` (se crea en la primera sesión).
