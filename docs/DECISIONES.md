# DECISIONES — BarberSaaS

Registro de decisiones técnicas tomadas de forma autónoma. Formato:
fecha, decisión, alternativas descartadas, razón.

## 2026-07-08

1. **Variables de entorno en `.env` (no `.env.local`)**. El repo ya traía
   `.env` poblado y `.gitignore` lo cubre. Next.js lee ambos; se mantiene
   `.env` como único archivo para no duplicar. Se creará `.env.example`
   sin valores como plantilla versionada.
2. **`SUPABASE_PROJECT_REF` derivado de `NEXT_PUBLIC_SUPABASE_URL`**
   (`zsroittxfvrtezhateue`), verificado contra el proyecto real vía MCP
   (`get_project` → ACTIVE_HEALTHY). Evita esperar al humano por un dato
   público.
3. **Roles en inglés snake_case** como enum Postgres `member_role`:
   `admin`, `manager`, `receptionist`, `barber`, `accountant`, `client`.
   Coherente con regla de nomenclatura de CLAUDE.md (tablas/DB en inglés).
4. **Vitest sobre Jest**: integración nativa con Vite/ESM/TS, más rápido,
   API compatible. Estándar actual en proyectos Next.js nuevos.
5. **`@supabase/ssr`** para clientes (browser/server) en vez del paquete
   deprecado `@supabase/auth-helpers-nextjs`.
6. **Migraciones se escriben ya, se aplican después**: sin
   `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD` no hay `db push`; se
   avanza escribiendo migraciones versionadas (fuente de verdad) para no
   bloquear la fase.
7. **Repo git propio en `barbersaas/`**: el directorio estaba dentro de un
   repo que abarca todo el Desktop (raíz `C:/Users/USUARIO/Desktop`), con
   historial ajeno al proyecto. Se hizo `git init -b main` local para
   aislar historial, permitir CI/CD (GitHub Actions/Vercel) y commits por
   fase limpios.
8. **`proxy.ts` en vez de `middleware.ts`**: Next 16 renombró la
   convención; `middleware.ts` está deprecado.
9. **Tipos de DB escritos a mano** (`lib/supabase/types.ts`) mientras no
   se pueda correr `supabase gen types` contra el proyecto (bloqueado por
   credenciales). Al desbloquear, se reemplazan por generados. Nota: filas
   como `type` alias, no `interface` (supabase-js exige index signature).
10. **Migraciones aplicadas vía MCP como excepción de bootstrap
    (2026-07-08)**: el usuario autorizó aplicar migraciones pero
    `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD` seguían como
    placeholders → CLI bloqueada. Se aplicó `foundation` y
    `security_hardening` vía MCP `apply_migration` (una sola vez, no
    mecanismo recurrente). Los archivos locales se renombraron a las
    versiones que registró el remoto (`20260708184346`, `20260708184443`)
    para que `supabase migration list` no diverja cuando la CLI se
    enlace. Próximas migraciones: CLI (`db push`) apenas existan
    credenciales.
11. **Warnings de advisors aceptados**: `create_tenant`, `is_member_of`,
    `has_role`, `shares_tenant_with` ejecutables por `authenticated` es
    intencional — las políticas RLS los evalúan como el rol consultante y
    `create_tenant` es el RPC de onboarding. `anon` y `PUBLIC` revocados.
