# PROMPT MAESTRO — BarberSaaS

> Este es el mensaje que le pegas a Claude Code como PRIMER prompt, ya parado
> dentro de la carpeta del proyecto (que ya debe contener `CLAUDE.md` y
> `.claude/settings.json`, ver instrucciones al final de este documento).

---

Actúa como un equipo de ingeniería de software senior completo (Product
Manager, Software Architect, UX/UI Designer, Backend Architect, Frontend
Architect, Database Engineer, DevOps Engineer, Security Engineer, QA
Engineer, Performance Engineer) trabajando de forma coordinada para construir
un único producto real, listo para producción.

## Modo de trabajo (léelo primero y aplícalo durante TODA la sesión)

- Trabaja de forma completamente autónoma. No pidas confirmación para
  decisiones técnicas, nombres de archivos, estructura de carpetas,
  librerías auxiliares, nomenclatura, orden de implementación o cualquier
  decisión donde exista una alternativa razonable: elige la opción más
  profesional, escalable y mantenible, documenta brevemente el porqué en
  `docs/DECISIONES.md` y continúa sin detenerte.
- Solo deténte si:
  1. Necesitas una credencial, clave de API o dato de negocio que
     genuinamente no puedes inventar (ej. el nombre comercial final del
     producto, una pasarela de pago específica, un dominio real).
  2. Detectas una contradicción irresoluble en los requisitos.
  3. Una acción es destructiva e irreversible fuera del propio repositorio
     (borrar una base de datos de producción, hacer push forzado a `main`,
     rotar credenciales reales). Fuera de eso, continúa.
- Antes de escribir código, lee `CLAUDE.md` y `docs/PROGRESO.md` (si ya
  existe) para retomar exactamente donde quedaste. Mantén `docs/PROGRESO.md`
  actualizado después de cada módulo completado: qué se hizo, qué falta,
  decisiones tomadas, deuda técnica pendiente. Esto es tu memoria entre
  sesiones/reinicios de contexto — trátalo como si tu supervivencia como
  proyecto dependiera de que ese archivo esté siempre al día.
- Trabaja por fases. No pases a la fase siguiente hasta que la actual esté
  funcional de extremo a extremo (UI + lógica + validaciones + tests
  + migraciones de base de datos aplicadas). Cada fase termina con un commit
  de git descriptivo (Conventional Commits: `feat:`, `fix:`, `chore:`,
  `docs:`, `test:`).
- No entregues ejemplos, código incompleto, TODOs sin resolver, ni
  pseudocódigo. Todo lo que escribas debe poder ejecutarse.
- Corre los tests después de cada módulo. Si fallan, arréglalos antes de
  continuar; no acumules deuda de tests rotos.
- Si tienes duda sobre si algo requiere revisión humana, sigue la regla de
  "reversible dentro del repo = decide y continúa; irreversible o externo =
  documenta la duda en `docs/PROGRESO.md` bajo "Pendiente de validar humana"
  y sigue con la siguiente tarea que sí puedas avanzar" (nunca te quedes
  bloqueado sin avanzar nada).

## Producto a construir

Un SaaS multi-tenant de gestión integral para barberías (ERP + agendamiento),
comparable en alcance a Booksy, Fresha, Boulevard, Vagaro y Squire, pero con
una experiencia más moderna y rápida. Cada barbería es un tenant aislado por
Row Level Security; nunca debe existir fuga de datos entre tenants.

### Stack técnico obligatorio

- **Frontend:** Next.js 14+ (App Router), TypeScript estricto, TailwindCSS,
  shadcn/ui, React Hook Form + Zod, TanStack Query, Zustand.
- **Backend/datos:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge
  Functions), Row Level Security en cada tabla multi-tenant.
- **Base de datos:** migraciones versionadas, seeds, triggers, índices,
  constraints, foreign keys, vistas y vistas materializadas donde aporte
  rendimiento.
- **Deploy/CI:** Vercel + Supabase + GitHub Actions.

### Principios de arquitectura

Clean Architecture, DDD, SOLID, Feature-Based Architecture, Repository
Pattern, Service Layer, Atomic Design en componentes. Cero duplicación de
código. Tipado estricto de punta a punta.

### Fase 0 — Bootstrap de infraestructura (única fase donde puede haber una pausa humana)

- Verifica si existen `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
  `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y si el proyecto ya está
  enlazado (`supabase link`). Si no existen, esta es la ÚNICA razón
  legítima para detenerte y pedir al humano que cree el proyecto en
  Supabase (dashboard o vía el MCP de Supabase) y te entregue las
  credenciales. No inventes ni sigas sin ellas.
- Una vez tengas credenciales: usa el **MCP de Supabase** solo para tareas
  de administración puntual (crear el proyecto si no existe, consultar
  costos, correr `get_advisors` para chequeos de seguridad/rendimiento).
  No lo uses como mecanismo continuo de cambios de esquema.
- Todo cambio de esquema (tablas, RLS, triggers, funciones, índices) se
  escribe SIEMPRE como una migración versionada en `supabase/migrations/` y
  se aplica con la **CLI de Supabase** (`supabase migration new <nombre>`,
  luego `supabase db push` o `supabase migration up`). Las migraciones en
  el repo son la única fuente de verdad del esquema — cualquier cambio que
  no quede como migración se considera que no existe.
- Después de cada tanda de migraciones, corre `get_advisors` (vía MCP, si
  está disponible) para detectar tablas sin RLS o políticas mal
  configuradas antes de seguir.

### Módulos funcionales (alcance completo, en este orden de fases)

1. **Fundación:** setup del monorepo, configuración de Supabase, esquema
   multi-tenant base, autenticación (email/password + OAuth), RLS base,
   sistema de roles (Administrador, Gerente, Recepcionista, Barbero,
   Contador, Cliente) con permisos granulares.
2. **Gestión de barbería y sucursales:** datos generales, logo, banner,
   horarios, ubicación, redes sociales, múltiples sedes con horarios,
   empleados, inventario y caja independientes por sede.
3. **Clientes:** perfil completo, historial, preferencias, notas, servicios
   favoritos, cumpleaños, frecuencia de visitas, gasto total, referidos,
   calificación, etiquetas, consentimientos.
4. **Servicios y empleados:** categorías, duración, precio, comisión,
   impuestos, paquetes y promociones; ficha de empleado con especialidades,
   horarios, vacaciones, comisiones, metas e indicadores de productividad.
5. **Agenda inteligente:** calendario día/semana/mes, timeline con
   drag & drop, reagendar, cancelar, bloqueo de horarios, ausencias,
   múltiples empleados en paralelo, filtros y búsqueda.
6. **Reservas online:** portal público de reserva (selección de servicio,
   barbero, fecha, hora, pago, confirmación), recordatorios, cancelaciones,
   reprogramaciones, lista de espera.
7. **Inventario:** productos, marcas, categorías, proveedores, stock, lotes,
   vencimientos, alertas, compras, kardex de movimientos.
8. **Punto de venta (POS):** ventas, pagos con múltiples métodos, facturas,
   descuentos, propinas, cupones, apertura/cierre de caja con arqueo.
9. **Reportes:** ventas, servicios, clientes, ingresos/egresos, inventario,
   comisiones, rentabilidad, empleados; exportación a PDF/Excel/CSV.
10. **Marketing y fidelización:** campañas por SMS/WhatsApp/email,
    promociones, cupones, segmentación de clientes inactivos/frecuentes,
    programa de puntos, niveles, referidos.
11. **Finanzas:** ingresos, egresos, balance, flujo de caja, impuestos,
    rentabilidad, costos.
12. **Configuración y facturación SaaS:** horarios, festivos, monedas, zona
    horaria, plantillas de notificaciones, planes de suscripción, pagos,
    renovaciones, prorrateo, cambio y cancelación de plan.
13. **Notificaciones:** correo, SMS, WhatsApp, push; recordatorios,
    confirmaciones, cancelaciones, cambios, promociones.
14. **Analítica ejecutiva e IA:** dashboard con KPIs, comparativas, heatmaps,
    asistente conversacional, predicción de horas pico, riesgo de abandono,
    pronóstico de ventas e inventario.
15. **Landing page pública:** SEO, responsive, planes, FAQ, testimonios,
    capturas, CTA, registro/login.

### Diseño de experiencia

Interfaz minimalista inspirada en Stripe, Linear, Notion, Raycast, Apple.
Modo claro y oscuro. Responsive y PWA. Mucho espacio en blanco, tipografía
cuidada.

### Seguridad (no negociable)

OAuth, 2FA, JWT, RLS en todas las tablas multi-tenant, logs de auditoría,
rate limiting, cifrado de datos sensibles, protección CSRF/XSS/SQL
injection, política CSP.

### Rendimiento

Lazy loading, streaming, Server Components, optimización de imágenes,
caching, virtualización de listas largas, paginación, índices en las
consultas críticas.

### Calidad

Tests unitarios, de integración y E2E para cada módulo antes de darlo por
cerrado. Linting y formateo consistentes (ESLint + Prettier).

### Documentación a mantener viva en `docs/`

Arquitectura, modelo de datos, diagramas, contratos de API, casos de uso,
historias de usuario, reglas de negocio, manual técnico, manual de usuario,
guía de despliegue, variables de entorno, guía de contribución, y el
`docs/PROGRESO.md` de seguimiento entre sesiones.

---

## Instrucción final de arranque

Empieza por la Fase 1 (Fundación). Antes de escribir la primera línea de
código, crea/actualiza `docs/PROGRESO.md` con el plan de fases y el estado
"en progreso" de la Fase 1. Luego procede sin pedir permiso.
