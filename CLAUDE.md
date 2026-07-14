# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Qué es este repositorio

TFG de Liviu Deleanu — Grado en Ingeniería Informática de Gestión y Sistemas de Información, UPV/EHU (Escuela de Ingeniería de Bilbao, EIB). Curso 2026–2027. Tiene **dos entregables que evolucionan a la vez**:

1. **La aplicación BUKIT** — monorepo pnpm (`apps/` + `packages/` + `e2e/`).
2. **La memoria del TFG** — LaTeX modular en `docs/thesis/` (índice oficial de la EIB, 15 capítulos), alimentada por el diario de sesiones `docs/dev-journal/`.

**Idioma:** comunicación, comentarios de código y documentación en español; identificadores de código en inglés. La propuesta original (`BUKIT - Propuesta TFG.docx`) sigue siendo la referencia de producto, pero las decisiones ya tomadas (documentadas aquí y en el dev-journal) prevalecen sobre ella.

## 1. Idea: BUKIT

Red social cuyo propósito es ayudar a cumplir objetivos vitales ("bucket lists") y a no perseguirlos en solitario: permite conocer a personas con metas afines para acompañarse y compartir logros. A diferencia de las redes de entretenimiento, toda la experiencia se orienta a la **acción**.

### 1.1 Motivación

Las metas se abandonan por falta de constancia, plazos y apoyo; las redes actuales agravan el problema (comparación pasiva, scroll infinito). BUKIT responde con tres pilares:

- **Estructura**: metas → listas con plazos y recordatorios (compromisos medibles, no deseos vagos).
- **Comunidad**: rodearte de gente con objetivos afines que inspira, motiva y acompaña.
- **Recompensa al avance**: visibilidad para quien progresa y aporta, no para el mero popular.

### 1.2 Concepto (reglas de producto que condicionan el modelo de datos y la API)

Navegación inferior de 4 pestañas (estilo Instagram):

1. **Inicio (FYP)**: feed personalizado en mosaico tipo Pinterest (ideas de metas, progresos, metas completadas y no logradas, vídeos de motivación, ads) + buscador a pantalla completa (perfiles / posts / bucket lists). Deslizando a la derecha, segundo feed solo de seguidos; si estás al día, sugerencias afines.
2. **Listas**: centro de control de objetivos (crear/ver/editar/eliminar). Una lista = conjunto de metas con plazo; la app envía recordatorios.
3. **Mensajes + mapa + notificaciones**: chat estilo Instagram (sin "notas") con mini-mapa arriba. Mapa a pantalla completa con dos vistas: _seguidos mutuos_ (ubicación / lugares de metas cumplidas) y _descubrimiento_ (buscar personas afines por país/radio/mundo). Aquí viven también las notificaciones.
4. **Perfil**: quién eres. Hasta 5 publicaciones libres + historias ilimitadas.

Reglas clave:

- **Dos tipos de usuario.** _Normal_ (cualquier registrado; menor peso en el feed) y _TOP_ (creador/influencer admitido por formulario externo; vídeo ilimitado y alta probabilidad de aparecer en el feed). Los vídeos de motivación del feed son exclusivos de TOP. La ponderación filtra calidad, incentiva valor y sustenta el modelo de negocio.
- **Las listas son la unidad de las metas.** Plan gratuito: máx. 3 listas. Los posts de progreso/completado solo pueden crearse **desde listas propias**.
- **Contenido de perfil efímero.** Todo el contenido del perfil se borra a los 60 días salvo que se pulse "mantener".
- **La verificación de identidad (DNI + teléfono + fotos validadas) desbloquea funciones**: publicar desde el perfil y el mapa de descubrimiento. Conocer desconocidos es 18+; el motivo es la seguridad de ambas partes.
- Ideas aún por definir: penalización social/puntos por meta no cumplida en plazo; IA que proponga plazos realistas por meta.

### 1.3 Stack tecnológico

- **Monorepo**: pnpm ≥ 9 (workspaces `apps/*`, `packages/*`, `e2e`), Node ≥ 22 (fijado con Volta), TypeScript estricto con `tsconfig.base.json` en la raíz, ESLint 9 (flat config) + Prettier, `.npmrc` con `save-exact=true` y `engine-strict=true`.
- **`apps/api`**: Express 5 + Prisma 6 sobre PostgreSQL 16. `app.ts` se exporta separado del `listen` para testear con Supertest sin abrir puerto.
- **BD**: imagen Docker propia `docker/postgres/` = PostGIS + pgvector en un solo Postgres (dev/tests/CI); producción prevista en **Neon (región EU, RGPD)**. Extensiones declaradas en `schema.prisma` (`postgresqlExtensions`) y en `docker/postgres/init/01-extensions.sql`.
- **`packages/core`**: tipos + esquemas **Zod** universales (front + back). **`packages/api-client`**: cliente HTTP tipado para web y móvil (stub). **`packages/ui-core`**: lógica/estado compartido sin DOM (stub). Los paquetes se consumen **sin compilar** (exports apuntan a `src/index.ts`).
- **`apps/web`** (React + Vite) y **`apps/mobile`** (React Native + Expo): **placeholders, aún sin scaffolding** (solo README). Si Metro da problemas con symlinks de pnpm, descomentar `node-linker=hoisted` en `.npmrc`.
- **`e2e`**: Playwright configurado.

### 1.4 Arquitectura

Principio rector: web y móvil **comparten lógica** (tipos, validación Zod, api-client, estado) pero mantienen UIs nativas. Un solo PostgreSQL cubre las tres necesidades: grafo social (integridad relacional), mapa (**PostGIS**: `ST_DWithin` + índice GiST) y afinidad (**pgvector**: embeddings de metas/intereses). Geo/vector se consultan con SQL crudo desde Prisma.

#### 1.4.1 Backend (API + BD)

- **`schema.prisma` está intencionadamente vacío de modelos**: las entidades se diseñan de forma incremental y meditada, una a una y **junto con el autor**. No añadir modelos por iniciativa propia.
- Autenticación prevista: JWT + Bcrypt con rotación de refresh tokens, doble capa de rate limiting, manejo de errores centralizado.
- Funciones especiales (enfoque decidido, pendiente de implementar):
  - **IA (estimación de plazos + afinidad)**: dirigida por eventos, nunca polling. LLM con salida JSON estructurada solo al crear/editar lista o pedir estimación, en job en segundo plano (**BullMQ + Redis**), con caché; no recomputar si la lista no cambió. Embeddings al crear metas/intereses → pgvector.
  - **KYC**: proveedor externo (Stripe Identity / Veriff / Onfido), nunca reconocimiento propio. Guardar solo estado + token; verificar y borrar la imagen del DNI (minimización, RGPD).
  - **Ads**: red existente (AdMob móvil, AdSense/Ad Manager web) + tabla propia de posts patrocinados inyectada por el ranking.
  - **Chat en tiempo real**: Socket.IO o equivalente gestionado. **Media**: R2/S3 (imágenes), Mux/Cloudflare Stream (vídeo). **Push**: Expo Push o FCM.
- Ubicación: solo aproximada/difuminada, solo con consentimiento y verificación. Datos en región EU.

#### 1.4.2 Frontend (web + móvil)

- Web: React + Vite, TanStack Query para estado de servidor / feed infinito (Redux Toolkit + Reselect en consideración para estado global).
- Móvil: React Native + Expo (EAS Build, actualizaciones OTA, push).

#### 1.4.3 Testing

Precedente TrackBites: Jest/Supertest (backend), Vitest/RTL (frontend), Playwright (E2E en `e2e/`). Aún no hay tests escritos.

#### 1.4.4 CI/CD (pendiente de montar)

GitHub Actions **fail-fast**: lint/estático → typecheck → tests unitarios + integración en paralelo → Playwright E2E como última barrera. Secretos en GitHub Secrets. Novedad de BUKIT respecto a TrackBites: **despliegue continuo** (auto-deploy al pasar el pipeline). Destinos en estudio: API dockerizada en Render/Railway/Fly.io, web en Vercel/Cloudflare Pages, móvil vía EAS, Postgres gestionado en Neon.

### 1.5 Líneas futuras (fuera del alcance del TFG)

Planes de pago (más de 3 listas), KYC con proveedor real en producción, red de anuncios real, vídeo (Mux/Stream), publicación en App Store / Play Store, penalización social por metas incumplidas, panel de administración TOP, Supabase como alternativa de aceleración para una v2 (decidido: el backend propio Node+Prisma+Postgres es el núcleo del TFG porque demuestra las competencias del grado).

### 1.6 Diseño (pendiente de definir)

- Colores (regla 60/30/10):
  - Primarios: TODO
  - Secundarios: TODO
  - Terciarios: TODO

## 2. Reglas y procedimientos

### 2.1 Comandos personalizados (definidos en `.claude/commands/`)

- **`/memoria`** — revisar y actualizar la memoria LaTeX (`docs/thesis/`) con los cambios recientes del proyecto (git log + dev-journal + sesión actual), recompilando y verificando al final.
- **`/journal`** — crear la entrada del dev-journal de la sesión de hoy (`docs/dev-journal/DD-MM-YYYY.md` a partir de `TEMPLATE.md`), antes de cerrar la sesión.

### 2.2 Procedimientos

- **Cada decisión se explica y justifica**, anotando siempre la alternativa descartada y el porqué (esto acaba en el dev-journal y en la memoria: es materia prima del TFG).
- El dev-journal es la fuente de la planificación _real_ (horas, problemas, decisiones) para los capítulos 10 y 13 de la memoria. Cada sesión empieza leyendo la última entrada.
- El modelo de datos se diseña incrementalmente con el autor (ver 1.4.1): proponer, discutir, y solo entonces escribir en `schema.prisma`.
- Cambios destructivos (borrar archivos, `db:reset`, reescribir historia de git): preguntar antes.

### 2.3 Reglas de código

- **Versiones exactas siempre** (`save-exact=true` ya lo fuerza en `pnpm add`); no usar rangos `^`/`~` a mano. Reproducibilidad garantizada por `pnpm-lock.yaml` commiteado.
- TypeScript estricto; no introducir `any` sin justificar. Los tipos compartidos y la validación viven en `packages/core` (Zod = única fuente de verdad, validar una vez y compartir tipos a ambos lados); no duplicar esquemas en apps.
- Comentarios en español y explicando el **porqué** (restricciones, alternativas), no el qué; seguir la densidad de comentarios del código existente.
- Antes de dar algo por terminado: `pnpm lint` y `pnpm typecheck` en verde.
- Scripts útiles (raíz): `pnpm db:up|down|reset` (Postgres Docker), `pnpm db:migrate|studio|seed` (Prisma en `apps/api`), `pnpm lint|format|typecheck`.

### 2.4 Reglas de la memoria (LaTeX, `docs/thesis/`)

Convenciones completas en `docs/thesis/README.md`; resumen de lo innegociable:

- **Compilación (Windows, MiKTeX sin Perl)**: `latexmk` y `pnpm docs:pdf` NO funcionan (falta Perl). Usar la receta de LaTeX Workshop "pdflatex × 2 + biber (sin Perl)" o a mano: `pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build main.tex` → `biber build/main` → 2 pases más de pdflatex. PDF en `docs/thesis/build/main.pdf`.
- **No quitar `es-noshorthands` de babel** (config/packages.tex): evita un conflicto real entre babel-spanish y biblatex-apa ("Generic hooks cannot be added to '\@makecaption'"). No tocar sin volver a probar la compilación.
- Estructura modular: `main.tex` solo ensambla; un capítulo = un archivo (`chapters/01`–`15`, índice oficial EIB); datos globales solo en `config/metadata.tex` (`\thesisTitle`, `\thesisAuthorFormal`...), nunca escritos a mano.
- **Una frase por línea** en los `.tex` (diffs limpios). Labels con prefijo: `ch:` `sec:` `fig:` `tab:` `ap:`.
- Citas en **APA** con `\parencite{}` / `\textcite{}` (referencias en `bibliography/references.bib`; plantillas de entradas en `PLANTILLAS.md`, nunca comentarios dentro del `.bib`). Quitar el `\nocite{prisma-docs}` temporal de `main.tex` con la primera cita real.
- Acrónimos: definir en `frontmatter/acronyms.tex` y usar `\ac{TFG}` en el texto.
- Pendientes: marcar con `\todonote{...}`; antes de entregar, buscar "todonote" y eliminarlos todos.
- El formato visual (Calibri, márgenes 2,5 cm, títulos, doble cara) está **aplazado**: los requisitos están anotados en `config/style.tex`; no aplicarlos hasta la fase de diseño.
- Tras cualquier cambio en la memoria, **compilar y verificar exit 0** sin warnings nuevos (los 6 `acro:*` actuales son esperados hasta usar `\ac{}` en texto real).

### 2.5 Gestión del proyecto (metodología decidida el 14-07-2026)

Detalle completo y justificación en los capítulos 7, 10 y 13 de la memoria; resumen operativo:

- **Método híbrido (Scrumban) adaptado a una persona**: historias de usuario + Story Points (Fibonacci 1–13; 13 = dividir) + sprints **semanales** (lunes–domingo, S1 = 20-07-2026, S13 = fin 18-10-2026), con mecánica de flujo Kanban: el compromiso es el orden del backlog y el límite WIP (máx. 2: 1 historia de producto + memoria), no un contrato de sprint. Descartados: RUP/PERT (alcance emergente, capacidad variable) y SCRUM puro (roles/ceremonias de equipo sin sentido en solitario).
- **Capacidad variable declarada**: ~30 h/semana en verano y octubre, ~10 h/semana en septiembre. Hipótesis inicial: ~11 SP por sprint pleno (~2,7 h/SP), recalibrar con la velocidad real desde S1.
- **Ceremonias**: planning lunes (~20 min); la "daily" es leer la última entrada del journal al abrir sesión; retro = sección en la entrada del journal del domingo, **incluye la revisión de riesgos** (críticos cada sprint, significativos cada 2, moderados cada 4, o inmediata si se observa un disparador). Los cambios de estado de riesgos se reflejan en las tablas del cap. 7.
- **Tablero**: GitHub Projects + Issues (historias) + Milestones (fases F1–F4). El backlog inicial (épicas EP01–EP15) está en el cap. 10.

## 3. graphify

El grafo del código está generado en `graphify-out/graph.json` y los hooks `PreToolUse` de `.claude/settings.json` **obligan** a consultarlo antes de leer/buscar código en bruto. Flujo:

- **Orientarse antes de leer**: `graphify query "<pregunta>"` (subgrafo acotado a la pregunta), `graphify explain "<concepto>"` (un nodo y sus vecinos), `graphify path "<A>" "<B>"` (relación entre dos nodos), `graphify affected "<X>"` (qué se rompe si cambias X). Solo tras orientarte con el grafo se leen archivos crudos, y únicamente para modificar/depurar líneas concretas.
- **Actualizar el grafo**: `graphify update .` (solo AST, sin coste de API, rápido) tras modificar código. Además, los git hooks `post-commit`/`post-checkout` (instalados con `graphify hook install`) lo actualizan solos en cada commit y checkout, así que normalmente no hay que hacerlo a mano.
- **Enriquecido semántico (opcional)**: `graphify extract . --backend claude` añade aristas inferidas y mejores nombres de comunidad usando el LLM; el `update` de los hooks es solo AST. Útil ejecutarlo de vez en cuando cuando haya código real, no en cada sesión.
