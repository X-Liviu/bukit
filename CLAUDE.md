# CLAUDE.md

TFG de Liviu Deleanu (Ingeniería Informática de Gestión y Sistemas de Información, UPV/EHU, Escuela de Ingeniería de Bilbao; tutor: Mikel Villamañe Gironés). Dos entregables que evolucionan a la vez:

1. **La aplicación BUKIT**: monorepo pnpm (`apps/`, `packages/`, `e2e/`).
2. **La memoria del TFG**: LaTeX en `docs/thesis/`, alimentada por el diario de sesiones `docs/dev-journal/`.

## Idioma

- Conversación, comentarios de código y documentación en español.
- Identificadores de código en inglés, sin excepción: variables, funciones, claves de objetos y de JSON, relaciones de Prisma, jobs de la CI, scripts y sus opciones, también en pruebas. En español solo quedan los comentarios, la documentación y los textos que lee una persona (mensajes de error, descripciones de pruebas).

## Producto

Red social para cumplir metas vitales en compañía, orientada a la acción. Reglas que condicionan el modelo de datos y la API (detalle en los caps. 2, 3 y 5 de la memoria):

- Cuatro pestañas: inicio (feed en mosaico, buscador y un segundo feed solo de seguidos), listas, mensajes con mapa y notificaciones, perfil.
- Usuarios NORMAL y TOP. TOP: vídeo ilimitado y más peso en el feed; sus vídeos de motivación no cuentan en el límite del perfil.
- Las listas agrupan metas y **la fecha límite vive en cada meta**. Plan gratuito: máximo 3 listas en curso; completarla o borrarla libera su hueco; borrar es irreversible; una lista completada no se reabre (una meta se puede desmarcar mientras su lista siga en curso); una meta vencida queda «no lograda» y su lista sigue contando; completarla tarde registra el retraso.
- Los posts de progreso o de meta cumplida solo nacen de listas propias; los de progreso muestran también las metas no logradas, que así llegan al feed (nunca se publican solas). Perfil: hasta 5 publicaciones, que caducan a los 60 días salvo «mantener» (la última siempre visible), e historias de 24 h.
- La verificación de identidad desbloquea publicar desde el perfil y el mapa de descubrimiento; conocer a desconocidos exige 18+.
- Ubicación solo aproximada, con consentimiento y verificación; datos en la UE.
- Fuera del alcance: planes de pago, verificación comercial en producción, red de anuncios real, tiendas de aplicaciones, penalización por metas incumplidas, panel de administración TOP.

## Arquitectura

- Web (React + Vite + React Router + TanStack Query) y móvil (React Native + Expo, objetivo secundario) comparten lógica en `packages/`: `core` (tipos y esquemas Zod, única fuente de verdad); `api-client` y `ui-core` son esqueletos, todavía sin uso. Los paquetes se consumen sin compilar. La web se organiza por funcionalidad como la API, una carpeta por pestaña (detalle en `apps/web/README.md`); `apps/mobile` aún no tiene código.
- API: Express 5 + Prisma 6 sobre un solo PostgreSQL 16 con PostGIS (mapa) y pgvector (afinidad); las consultas geográficas y vectoriales van en SQL crudo.
- La API se organiza por funcionalidad (`apps/api/src/<funcionalidad>/`, con sus rutas, su servicio y sus piezas); lo común va en `config.ts`, `platform/` y `http/` y no importa de ninguna funcionalidad. Una funcionalidad usa el servicio de otra, nunca sus rutas, y las rutas solo validan, llaman y responden. Detalle en `apps/api/README.md`.
- Producción: la API en Render, que solo despliega con la CI en verde, y la base en Neon (UE). Las migraciones de producción las aplica la CI (job `migrate`). Detalle en `apps/api/README.md`.
- La imagen `docker/postgres` de desarrollo y CI lleva **las mismas versiones que Neon**: no cambiarlas sin comprobarlo antes en Neon (receta en el comentario de su Dockerfile).
- Decidido y aún sin implementar:
  - IA dirigida por eventos con cola en segundo plano (BullMQ + Redis), nunca por sondeo; la estimación de plazos es objetivo secundario y la afinidad (embeddings en pgvector), alcance comprometido.
  - Verificación de identidad con un proveedor externo, guardando solo el estado y la referencia: **nunca la imagen del documento**.
  - Anuncios, objetivo secundario; chat con Socket.IO o equivalente; imágenes en R2/S3; vídeo gestionado, objetivo secundario; notificaciones con Expo Push o FCM.

## Comandos

```bash
pnpm db:up | db:down | db:reset        # Postgres de Docker (db:reset borra datos)
pnpm db:migrate | db:studio | db:seed   # Prisma en apps/api
pnpm web:dev                            # web en http://localhost:5180 (puerto fijo y estricto)
pnpm lint | typecheck | test | test:e2e | format
```

- `pnpm test` cubre todos los paquetes salvo `e2e`. Las pruebas de la API necesitan el Postgres local levantado y abortan si `DATABASE_URL` no apunta a localhost.
- Memoria (MiKTeX sin Perl: `latexmk` no funciona). Desde `docs/thesis`: `pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build main.tex`, después `biber build/main` y dos pasadas más de `pdflatex`. Los documentos de riesgos, desde su carpeta: dos pasadas de `pdflatex`, sin `biber`.

## Reglas de código

- Versiones exactas (`save-exact`): nunca rangos `^` ni `~`.
- TypeScript estricto; nada de `any` sin justificar. Tipos y validación compartidos en `packages/core`, sin duplicar esquemas en las apps.
- Comentarios en español que explican el porqué, con la densidad del código que los rodea.
- Pruebas en la carpeta `tests/` de cada paquete o app, nunca en `src/`, y con `tests` en el `include` de su `tsconfig.json`. Toda historia que toque autenticación, autorización o datos personales incluye sus casos de abuso.
- Correos de pruebas, semilla y ejemplos solo con dominios reservados (`example.com`, `.test`, `.invalid`).
- **Modelo de datos**: se diseña con el autor, entidad a entidad. Proponer y discutir antes de escribir en `schema.prisma`; claves UUID; ningún dato personal sin finalidad. Todo cambio del modelo actualiza en la misma historia los diagramas UML 2.5 de `docs/diagramas/bukit.drawio`.
- **Migraciones**: las ya aplicadas no se editan ni se regeneran nunca. Toda migración es compatible con el código anterior: primero se amplía y lo que sobra se retira en un despliegue posterior.
- Dependabot: triar sus PRs cada semana (deja de proponer al llegar a su tope de PRs abiertas: 5 de npm y 3 de Actions). Tras fusionar una, comentar `@dependabot rebase` en las demás y esperar a que su CI termine sobre el commit nuevo antes de fusionarlas.
- Antes de dar algo por terminado: `pnpm lint` y `pnpm typecheck` en verde, y `pnpm test` si se tocó código.

## Nunca

- Leer ni imprimir `apps/api/.env.production` ni el valor de ningún secreto. Nada de `.env` en el índice: `git add` con la lista de archivos, nunca `-A`.
- Sin el OK del autor: acciones destructivas (borrar archivos o ramas, `db:reset`, reescribir la historia de git) ni `git push`.
- Escribir datos de la vida privada del autor (empleadores, personas no públicas, lugares de residencia, importes ajenos al proyecto) en el repositorio, la memoria o los commits. La carga laboral y la estancia Erasmus se nombran en abstracto.
- Crear issues, tableros, milestones ni PRs propias, ni usar `Closes #N`: se commitea directamente en `main` y el mensaje del commit nombra la historia (`US-07: …`).
- Usar este archivo o el README raíz como registro de decisiones o de historia: eso va en el diario.

## Memoria del TFG

Antes de editar `docs/thesis/`, leer `docs/thesis/README.md` (convenciones completas). Lo innegociable:

- La guía de estilo (`docs/referencias/guia-estilo-TFG.md`) y el índice oficial (`docs/referencias/indice-oficial-TFG.md`, orden de los preliminares incluido) son normativos.
- Toda información de una fuente externa se cita en APA (`\parencite`, `\textcite`); sin cita es plagio.
- Prohibidos los saltos de página manuales (`\newpage`, `\clearpage`, `\pagebreak`) fuera de `main.tex`.
- Es un producto final: nada de andamiaje temporal («pendiente», «por ahora», «se describirá»); lo pendiente se marca solo con `\todonote`.
- Una frase por línea; términos en inglés con `\eng{}`; acrónimos con `\ac{}`; castellano llano, sin jerga metodológica.
- Diagramas solo UML 2.5.
- Tras cualquier cambio, compilar con exit 0 y sin avisos nuevos. Línea base: 6 «Infinite glue shrinkage» y 18 «faked small caps».

## Método de trabajo

Detalle en el cap. 10 de la memoria y en `docs/dev-journal/README.md`.

- El sprint es una **tanda de trabajo**, no una semana: se abre con su planificación en el diario y se cierra con su historia. Historias en puntos (solo puntúan las historias) y una sola historia de producto en curso, más la memoria. El backlog vive en el cap. 10. **Las semanas sin sesiones no se declaran ni se recuperan**; el calendario del cap. 13 es la referencia del avance.
- **Control mensual** en la primera sesión de cada mes: avance frente al calendario y seguimiento de los riesgos vigilados (R1 a R5, R7, R8, R10, R12 y R14); los gestionados (R6, R9, R11, R13 y R15), al cierre de fase. El plan de riesgos se reemite al cierre de fase, o de inmediato si un riesgo se materializa, cambia su probabilidad o su impacto, o aparece uno nuevo (convenciones en los README de `docs/thesis/seguimiento-riesgos/` y `docs/thesis/plan-riesgos/`).
- Cada sesión empieza leyendo la última entrada del diario y termina con `/journal`. Toda decisión se anota con la alternativa descartada y el porqué.
- Las entradas pasadas del diario no se reescriben, salvo para marcar casillas de la tanda en curso, corregir un error de forma o retirar un dato personal.

## Comandos propios

- `/journal`: entrada del diario de hoy, de 10 minutos de lectura como máximo.
- `/memoria`: actualiza la memoria con los cambios recientes y la compila.
- `/coherencia`: auditoría de coherencia de toda la documentación. Se lanza con `claude --settings .claude/coherencia.settings.json --permission-mode dontAsk` (ver `docs/coherencia/README.md`). El autor no lee el informe: se aplica con `/coherencia aplicar` en una sesión normal, que solo le pregunta las decisiones.
- `/grafo-semantico`: pase semántico de graphify; consume tokens, no en cada sesión.

## graphify y entorno Windows

- Los hooks de `.claude/settings.json` avisan, sin bloquear nada, de orientarse con `graphify query|explain|path|affected` antes de leer código. `graphify update .` refresca el grafo; los hooks de git ya lo hacen en cada commit.
- Smart App Control bloquea los `.exe` sin firma, incluidos los que genera pipx: graphify se usa con los envoltorios `~/.local/bin/graphify` y `graphify.cmd`. Si `pipx upgrade` vuelve a generar los `.exe`, apartarlos de nuevo y no desactivar Smart App Control.
- La herramienta Bash reduce las barras invertidas: los scripts con expresiones regulares y los cambios en LaTeX se escriben con Write o Edit, no en una orden de Bash.
- El `package.json` raíz es `"type": "module"`: los scripts CommonJS van en `.cjs`.
- La versión de Node está fijada en el campo `volta` de `package.json`, pero Volta no está instalado: el autor actualiza Node a mano; recordárselo al subir la versión.
