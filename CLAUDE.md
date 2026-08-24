# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Qué es este repositorio

TFG de Liviu Deleanu — Grado en Ingeniería Informática de Gestión y Sistemas de Información, UPV/EHU (Escuela de Ingeniería de Bilbao, EIB). Curso 2026–2027. Tiene **dos entregables que evolucionan a la vez**:

1. **La aplicación BUKIT** — monorepo pnpm (`apps/` + `packages/` + `e2e/`).
2. **La memoria del TFG** — LaTeX modular en `docs/thesis/` (índice oficial de la EIB: preliminares I–VI y 15 capítulos, transcrito en `docs/referencias/indice-oficial-TFG.md`), alimentada por el diario de sesiones `docs/dev-journal/`.

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

1. **Inicio (FYP)**: feed personalizado en mosaico tipo Pinterest (ideas de metas, progresos, metas completadas y no logradas, vídeos de motivación, publicaciones patrocinadas) + buscador a pantalla completa (perfiles / posts / bucket lists). Segundo feed conmutable solo de seguidos (el gesto concreto para cambiar es diseño UI/UX sin decidir); si estás al día, sugerencias afines.
2. **Listas**: centro de control de objetivos (crear/ver/editar/eliminar). Una lista = conjunto de metas con plazo; la app envía recordatorios.
3. **Mensajes + mapa + notificaciones**: chat estilo Instagram (sin "notas") con mini-mapa arriba. Mapa a pantalla completa con dos vistas: _seguidos mutuos_ (ubicación / lugares de metas cumplidas) y _descubrimiento_ (buscar personas afines por país/radio/mundo). Aquí viven también las notificaciones.
4. **Perfil**: quién eres. Hasta 5 publicaciones libres + historias ilimitadas.

Reglas clave:

- **Dos tipos de usuario.** _Normal_ (cualquier registrado; menor peso en el feed) y _TOP_ (creador/influencer admitido por formulario externo; vídeo ilimitado y alta probabilidad de aparecer en el feed). Los vídeos de motivación del feed son exclusivos de TOP y **no computan en el límite de publicaciones del perfil** (decisión del autor, 24-08-2026: son contenido del feed, no del perfil). La ponderación filtra calidad, incentiva valor y sustenta el modelo de negocio.
- **Las listas son la unidad de las metas.** Plan gratuito: máx. **3 listas en curso** (decisión del autor, 03-08-2026): completar una lista libera su hueco (pueden acumularse más de 3 completadas); una completada puede borrarse sin afectar al límite, pero el **borrado es irreversible**; una meta vencida sin cumplir queda «no lograda» y su lista sigue contando para el límite — si se completa tarde, se marca completada con su **tiempo de retraso registrado** (para aprender a estimar mejor; no hay validación formal del logro: lo valida implícitamente la comunidad que visita el perfil, que también pide cuentas del retraso). **La fecha límite vive en cada meta, no en la lista** (decisión del autor, 28-07-2026: la lista solo agrupa; recordatorios e IA trabajan meta a meta). Los posts de progreso/completado solo pueden crearse **desde listas propias**.
- **Contenido de perfil efímero** (precisado el 03-08-2026): las **publicaciones** del perfil caducan a los 60 días salvo pulsar «mantener», conservándose siempre visible la última; las **historias** caducan a las 24 h (estilo Instagram), con opción de destacadas o consulta privada desde los ajustes del perfil.
- **La verificación de identidad (DNI + teléfono + fotos validadas) desbloquea funciones**: publicar desde el perfil y el mapa de descubrimiento. Conocer desconocidos es 18+; el motivo es la seguridad de ambas partes.
- Ideas ya clasificadas: la IA que propone plazos realistas por meta es **objetivo secundario** (decisión del 14-07-2026; RF-18 opcional, enfoque técnico en §1.4.1); la penalización social/puntos por meta no cumplida en plazo queda **pospuesta fuera del alcance** («Ideas de producto pospuestas», cap. 3; ver §1.5).

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

- **El modelo de datos se diseña incrementalmente, entidad a entidad y junto con el autor** (no añadir modelos por iniciativa propia; cada entidad pasa la revisión de minimización de R7 y se documenta en el cap. 9). Primera entidad (US-04, 07-08-2026): **`User`** — UUID no enumerable (criterio fijado para todas las entidades; descartados BIGINT y cuid), email y username únicos normalizados a minúsculas en el Zod de core, passwordHash bcrypt (bcryptjs 12 rondas), enum `UserTier` NORMAL/TOP sin endpoint de cambio; sin teléfono/nacimiento/ubicación.
- **Implementado**: manejo de errores centralizado y registro de sucesos con **pino + pino-http** (US-02, 27-07-2026; justificación en el cap. 6); **alta de cuentas `POST /auth/register`** (US-04, 07-08-2026: validación con el Zod compartido, 409 diferenciado por campo en duplicados, respuesta sin hash; tests de integración contra Postgres real — docker compose en local y en la CI). El Dockerfile genera el cliente Prisma dentro de la imagen (motor linux-musl); `getPrisma()` es un singleton perezoso para que `/health` viva sin BD (producción aún sin DATABASE_URL hasta la historia de Neon).
- **Autenticación implementada a medias (US-05, 10-08-2026)**: `POST /auth/login` (401 único anti-enumeración con igualación de tiempos vía hash de referencia; par de tokens **jsonwebtoken** HS256 —elegida frente a jose por el criterio del cap. 6 «saltar solo donde aporta» y por defendibilidad R5—, acceso 15 min / refresco 30 días con marca `typ` para que un refresco no sirva de acceso, transporte en el cuerpo para el api-client compartido), middleware `requireAuth` + `GET /auth/me` (primera ruta privada). `JWT_SECRET` por entorno (mínimo 32 chars; Render lo genera vía Blueprint `generateValue`; fallback SOLO en dev/test). Pendiente de EP02: US-06 rotación/revocación (traerá la entidad RefreshToken y la primera relación del modelo) y US-07 doble capa de rate limiting.
- Funciones especiales (enfoque decidido, pendiente de implementar):
  - **IA (estimación de plazos + afinidad)**: dirigida por eventos, nunca polling. LLM con salida JSON estructurada solo al crear/editar lista o pedir estimación, en job en segundo plano (**BullMQ + Redis**), con caché; no recomputar si la lista no cambió. La estimación de plazos es **objetivo secundario** desde el 14-07-2026 (cap. 3: depende de un servicio externo de pago; proveedor abierto entre las API de Anthropic y OpenAI). Embeddings al crear metas/intereses → pgvector (la afinidad sí es alcance comprometido; EP10/RF-17 reclasificadas de deseable a **imprescindible** el 24-08-2026, inventario comprometido 138 → 146 SP).
  - **KYC**: proveedor externo (Stripe Identity / Veriff / Onfido), nunca reconocimiento propio. Guardar solo estado + token de la verificación; la imagen del documento no se almacena nunca en el sistema — la trata el proveedor (minimización, RGPD).
  - **Ads**: red existente (AdMob móvil, AdSense/Ad Manager web, fuera del TFG) + tabla propia de posts patrocinados inyectada por el ranking (**objetivo secundario** desde el 28-07-2026: EP17/RF-20 opcionales, decisión del autor).
  - **Chat en tiempo real**: Socket.IO o equivalente gestionado. **Media**: R2/S3 (imágenes), Mux/Cloudflare Stream (vídeo; objetivo secundario del TFG, decidido el 16-07-2026 según el dev-journal). **Push**: Expo Push o FCM.
- Ubicación: solo aproximada/difuminada, solo con consentimiento y verificación. Datos en región EU.

#### 1.4.2 Frontend (web + móvil)

- Web: React + Vite, TanStack Query para estado de servidor / feed infinito (Redux Toolkit + Reselect en consideración para estado global).
- Móvil: React Native + Expo (EAS Build, actualizaciones OTA, push). Versión **parcial y objetivo secundario** desde el 14-07-2026 (cap. 3: pantallas núcleo —autenticación, listas y feed— contra la API real; el compromiso mínimo del TFG es backend + web).

#### 1.4.3 Testing

**Decidido para BUKIT (ratificado el 27-07-2026; justificación en el cap. 6): Vitest + Supertest en el backend** y Vitest/RTL en el frontend, con Playwright para E2E (`e2e/`). Jest/Supertest queda solo como precedente de TrackBites, no como elección de este proyecto. Hay tests desde la US-01 (primer test real: los esquemas Zod de usuario en `packages/core`, 26-07-2026; reubicados a las carpetas `tests/` el 27-07-2026), en la carpeta `tests/` de cada paquete o app (regla en §2.3).

**Seguridad verificada historia a historia (riesgo R14, decisión del autor 10-08-2026)**: toda historia que toque autenticación, autorización o datos personales incluye sus **casos de abuso** (tests negativos: entradas maliciosas, accesos no autorizados) — es parte de la DoD (cap. 10 §10.3) y el medible de seguridad del cap. 3 se verifica historia a historia, no al final. Mecanismos automáticos: `pnpm audit --prod --audit-level high` corta la CI (job lint) y **Dependabot** (`.github/dependabot.yml`) propone parches semanales de npm y Actions.

#### 1.4.4 CI/CD

- **CI en jobs separados desde el 06-08-2026** (evolución de la mínima de US-01, cerrado el pendiente del 27-07): cadena de fallo rápido lint → typecheck → pruebas + **build Docker de la API en paralelo** desde lint; instalación reutilizada vía caché del store de pnpm (descartado el artefacto de `node_modules`: los symlinks de pnpm no sobreviven a upload-artifact); pasos comunes en la composite action `.github/actions/setup`; `prisma generate` restaurado en typecheck y pruebas desde la US-04, y el job de pruebas levanta el Postgres real del compose (`up -d --wait` + `migrate deploy`) para las pruebas de integración; un push nuevo cancela la ejecución anterior de la rama; `timeout-minutes` 10–15 por job (guard del 07-08 tras los cuelgues por incidencia de la infraestructura de GitHub del 06-08). Pendiente solo: Playwright E2E como última barrera cuando haya app que arrancar. Secretos en GitHub Secrets.
- **CD operativo desde el 07-08-2026 (US-03 cerrada)** — la novedad de BUKIT respecto a TrackBites: destino de la API **decidido el 06-08-2026: Render** (región Frankfurt, plan free sin tarjeta, Blueprint `render.yaml` con `autoDeployTrigger: checksPass` = solo despliega con la CI en verde; imagen `apps/api/Dockerfile` con runtime tsx porque los paquetes compartidos se consumen sin compilar). _Alternativas descartadas_: Railway (1 $/mes de crédito tras el trial + deploys gratuitos rechazados en horas punta) y Fly.io (sin capa gratuita para cuentas nuevas desde 10-2024). Blueprint aplicado por el autor el 07-08-2026 y URL pública verificada: `https://bukit-api-07ph.onrender.com/health` (el free se duerme a los 15 min sin tráfico, ~1 min de arranque en frío). Resto de destinos en estudio: web en Vercel/Cloudflare Pages y móvil vía EAS; el Postgres gestionado está **decidido en Neon** (cap. 6, criterio de residencia europea), pendiente solo de su historia de integración.

### 1.5 Líneas futuras (fuera del alcance del TFG)

Planes de pago (más de 3 listas), contratación comercial del proveedor de KYC en producción (la integración en modo sandbox sí entra en el TFG), red de anuncios real, publicación en App Store / Play Store, penalización social por metas incumplidas, panel de administración TOP, Supabase como alternativa de aceleración para una v2 (decidido: el backend propio Node+Prisma+Postgres es el núcleo del TFG porque demuestra las competencias del grado).

### 1.6 Diseño (pendiente de definir)

- Colores (regla 60/30/10):
  - Primarios: TODO
  - Secundarios: TODO
  - Terciarios: TODO

## 2. Reglas y procedimientos

### 2.1 Comandos personalizados (definidos en `.claude/commands/`)

- **`/memoria`** — revisar y actualizar la memoria LaTeX (`docs/thesis/`) con los cambios recientes del proyecto (git log + dev-journal + sesión actual), recompilando y verificando al final.
- **`/journal`** — crear **o actualizar** la entrada del dev-journal de la sesión de hoy (`docs/dev-journal/DD-MM-YYYY.md`), antes de cerrar la sesión. Si ya existe una entrada de hoy (escrita a mano o por un `/journal` de otra sesión del día), **pregunta** si añadir a esa entrada conservando lo que hay o crear una nueva con sufijo `-b`.
- **`/grafo-semantico`** — lanzar el pase semántico de graphify (`graphify extract . --backend claude`, ver §3): añade aristas inferidas y mejores nombres de comunidad usando el LLM (el `update` de los git hooks es solo AST). Reservado para cuando el código haya crecido; consume tokens, así que no en cada sesión.

### 2.2 Procedimientos

- **Cada decisión se explica y justifica**, anotando siempre la alternativa descartada y el porqué (esto acaba en el dev-journal y en la memoria: es materia prima del TFG).
- El dev-journal es la fuente de la planificación _real_ (horas, problemas, decisiones) para los capítulos 10 y 13 de la memoria. Cada sesión empieza leyendo la última entrada.
- El modelo de datos se diseña incrementalmente con el autor (ver 1.4.1): proponer, discutir, y solo entonces escribir en `schema.prisma`.
- Cambios destructivos (borrar archivos, `db:reset`, reescribir historia de git): preguntar antes.

### 2.3 Reglas de código

- **Versiones exactas siempre** (`save-exact=true` ya lo fuerza en `pnpm add`); no usar rangos `^`/`~` a mano. Reproducibilidad garantizada por `pnpm-lock.yaml` commiteado.
- TypeScript estricto; no introducir `any` sin justificar. Los tipos compartidos y la validación viven en `packages/core` (Zod = única fuente de verdad, validar una vez y compartir tipos a ambos lados); no duplicar esquemas en apps.
- Comentarios en español y explicando el **porqué** (restricciones, alternativas), no el qué; seguir la densidad de comentarios del código existente.
- **Los tests viven en la carpeta `tests/` de cada paquete o app** (`packages/core/tests/`, `apps/api/tests/`…), nunca colocados junto al código en `src/` — decisión del autor (27-07-2026), asumiendo imports relativos más largos (`../src/...`). Los `include` de cada tsconfig listan `tests`; el `tsconfig.build.json` de las apps solo `src` (los tests jamás entran en `dist/`).
- Antes de dar algo por terminado: `pnpm lint` y `pnpm typecheck` en verde.
- Scripts útiles (raíz): `pnpm db:up|down|reset` (Postgres Docker), `pnpm db:migrate|studio|seed` (Prisma en `apps/api`), `pnpm lint|format|typecheck`.

### 2.4 Reglas de la memoria (LaTeX, `docs/thesis/`)

Convenciones completas en `docs/thesis/README.md`; resumen de lo innegociable:

- **La guía de estilo de la universidad es NORMATIVA y se aplica a rajatabla**: transcripción literal en `docs/referencias/guia-estilo-TFG.md` (formato, citas APA-Harvard con sus 15 tipos de fuente, tablas/figuras con doble numeración; el apartado de extensión —40/60 pp.— está **excluido** por decisión del autor desde el 26-07-2026: la memoria no se somete a límite de páginas). Ante cualquier duda de estilo, ese documento manda. El bloque de formato visual está **aplicado** desde el 16-07-2026 en `config/style.tex`: Carlito (clon métrico libre de Calibri, pdflatex no puede usar la real), márgenes 2,5 cm, 6 pt entre párrafos, títulos según la guía (cap. MAYÚSCULA 14 pt, apartados 12 pt), doble cara, cuerpo 11 pt.
- **El índice oficial de la EIB es igualmente NORMATIVO, incluido el ORDEN de los preliminares**: transcripción literal del resumen de apartados (preliminares I–VI + capítulos 1–15) en `docs/referencias/indice-oficial-TFG.md`. «Empleo de IA» es el apartado V y va entre el listado de acrónimos (IV) y el índice de la memoria (VI); decisión del autor (29-07-2026): **no reordenar los preliminares por estética** — `main.tex` ensambla exactamente en ese orden y su comentario de preliminares lo documenta.

- **Compilación (Windows, MiKTeX sin Perl)**: `latexmk` y `pnpm docs:pdf` NO funcionan (falta Perl). Usar la receta de LaTeX Workshop "pdflatex × 2 + biber (sin Perl)" o a mano: `pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build main.tex` → `biber build/main` → 2 pases más de pdflatex. PDF en `docs/thesis/build/main.pdf`. El paso de biber de la receta es **condicional desde el 29-07-2026** (guard en `.vscode/settings.json`): solo corre si el documento generó `.bcf`, de modo que los documentos independientes de riesgos (sin bibliografía) también compilan al guardar sin error de biber.
- **No quitar `es-noshorthands` de babel** (config/packages.tex): evita un conflicto real entre babel-spanish y biblatex-apa ("Generic hooks cannot be added to '\@makecaption'"). No tocar sin volver a probar la compilación.
- **Paginación dinámica — regla estricta y permanente del autor (26-07-2026)**: PROHIBIDO introducir saltos de página manuales (`\newpage`, `\clearpage`, `\pagebreak`) para "empujar" apartados, párrafos o puntos de listas a la página siguiente; solo `\chapter` (y la estructura de preliminares/índices de `main.tex`) inicia página nueva obligatoria. La protección contra encabezados huérfanos ya está **automatizada** en `config/style.tex` (`needspace`: `\Needspace*{5\baselineskip}` antes de `\section`/`\subsection`, `4\baselineskip` en niveles inferiores) junto con `\widowpenalty`/`\clubpenalty` a 10000: si un punto necesita garantizar espacio, lo gestionan esos ganchos o el motor TeX, **nunca** un salto manual. Motivo: los saltos manuales rompen el flujo al editar texto previo y generan grandes huecos verticales en blanco (`Underfull \vbox`).
- Estructura modular: `main.tex` solo ensambla; un capítulo = un archivo (`chapters/01`–`15`, índice oficial EIB); datos globales solo en `config/metadata.tex` (`\thesisTitle`, `\thesisAuthorFormal`...), nunca escritos a mano.
- **Una frase por línea** en los `.tex` (diffs limpios). Labels con prefijo: `ch:` `sec:` `fig:` `tab:` `ap:`.
- **Toda información procedente de una fuente externa se referencia SIEMPRE** (datos, afirmaciones, marcos teóricos, definiciones ajenas): la guía de TFG de la universidad exige normas APA y advierte de que la detección de plagio supone el suspenso directo. Ninguna afirmación no original sin su cita.
- Citas en **APA** con `\parencite{}` / `\textcite{}` (referencias en `bibliography/references.bib`; plantillas de entradas en `PLANTILLAS.md`, nunca comentarios dentro del `.bib`).
- Acrónimos: definir en `frontmatter/acronyms.tex` y usar `\ac{TFG}` en el texto.
- Pendientes: marcar con `\todonote{...}`; antes de entregar, buscar "todonote" y eliminarlos todos.
- **La memoria es producto final, no cuaderno de trabajo (regla del autor, 27-07-2026)**: prohibido el andamiaje temporal en la prosa («se describirán cuando se implementen», «pendiente de definir», alusiones al proceso de redacción o al estado actual del repositorio). Las remisiones son atemporales («se describen en el capítulo X»); lo pendiente se marca únicamente con `\todonote`, que se purga antes del depósito. La memoria no es la guía de contexto de Claude — para eso están CLAUDE.md y el dev-journal.
- El formato visual está **aplicado** en `config/style.tex` (Carlito como Calibri, márgenes 2,5 cm, parskip 6 pt, titlesec según la guía, twoside); de la portada quedan pendientes para la fase de diseño los logos UPV/EHU, la foto representativa opcional y los iconos de sostenibilidad (TODO en `titlepage.tex`).
- Tras cualquier cambio en la memoria, **compilar y verificar exit 0** sin warnings nuevos. Esperados a 16-07-2026: únicamente los "ignored error: Infinite glue shrinkage" de longtable (ya no queda ningún acrónimo sin usar) (bug conocido e inofensivo de longtable con kernels recientes, latex3/latex2e#1907; ver comentario en `config/packages.tex`).

### 2.5 Gestión del proyecto (metodología decidida el 14-07-2026)

Detalle completo y justificación en los capítulos 7, 10 y 13 de la memoria; resumen operativo:

- **Método híbrido (Scrumban) adaptado a una persona**: historias de usuario + Story Points (Fibonacci 1–13; 13 = dividir; **solo puntúan las historias**: las subtareas van como checklist sin puntos dentro de la issue, porque en solitario no hay reparto y puntuarlas duplicaría la velocidad) + sprints **semanales** (lunes–domingo; S0 planificación = 14/19-07-2026, S1 = 20-07-2026, S39 = fin 16-05-2027), con mecánica de flujo Kanban: el compromiso es el orden del backlog y el límite WIP (máx. 2: 1 historia de producto + memoria), no un contrato de sprint. Descartados: RUP/PERT (alcance emergente, capacidad variable) y SCRUM puro (roles/ceremonias de equipo sin sentido en solitario).
- **Calendario re-basado el 16-07-2026** (detalle en cap. 10): F1 verano S1–S6 (20-07→30-08); pausa 31-08→20-09 (traslado Erasmus); F2 Erasmus S7–S24 (21-09-2026→24-01-2027); pausa 25-01→31-01; F3 S25–S32 (01-02→28-03-2027); F4 S33–S39 (29-03→16-05-2027). Defensa: junio/julio 2027, septiembre de reserva.
- **Capacidad variable declarada**: verano planificado a ~10 h/semana y **re-basado a 6 h/semana para S4–S6 el 09-08-2026** (contingencia de R8, materializado: tres sprints al 27/57/60 % por carga laboral estructural; F1 queda en 48 h, sin recorte de alcance); ~5 h/semana de promedio en el Erasmus (semanas de viaje a 0), ~15 h/semana desde febrero (compatible con posibles prácticas). **Equivalencia recalibrada el 09-08-2026: 2,0 h/SP** (hipótesis inicial 2,7; observado ~1,2 pero solo en infraestructura muy asistida por IA — valor prudente); se recalibra en cada retro.
- **En la memoria, redacción en castellano llano**: mínima jerga metodológica (nada de MoSCoW/stubs/spikes sin parafrasear: «imprescindible/deseable/opcional», «versiones simuladas», «investigación acotada»); términos técnicos solo si el cap. 10 los define.
- **Ceremonias**: planning lunes (~20 min); la "daily" es leer la última entrada del journal al abrir sesión; retro = sección en la entrada del journal del domingo, **incluye la revisión de riesgos** (críticos cada sprint, significativos cada 2, moderados cada 4, o inmediata si se observa un disparador). La revisión se rellena como documento fechado en `docs/thesis/seguimiento-riesgos/` (**en LaTeX desde el 28-07-2026**: copiar su `TEMPLATE.tex`, preámbulo compartido en `docs/thesis/config/riesgos-preamble.tex`, compilar con pdflatex ×2 sin biber desde la carpeta del documento; convenciones completas en los README de ambas carpetas) y el journal lo enlaza; si un apartado ⟳ se rellena, se emite nueva versión completa del plan en `docs/thesis/plan-riesgos/` (`plan-riesgos-vN-DD-MM-YYYY.tex`) y fila en la tabla de seguimiento del cap. 7.
- **Tablero**: GitHub Projects + Issues (historias) + Milestones (fases F1–F4). El backlog inicial (épicas EP01–EP17; EP16 vídeo con servicio gestionado y EP17 posts patrocinados simulados, ambas opcionales) está en el cap. 10.

## 3. graphify

El grafo del código está generado en `graphify-out/graph.json` y los hooks `PreToolUse` de `.claude/settings.json` **obligan** a consultarlo antes de leer/buscar código en bruto. Flujo:

- **Orientarse antes de leer**: `graphify query "<pregunta>"` (subgrafo acotado a la pregunta), `graphify explain "<concepto>"` (un nodo y sus vecinos), `graphify path "<A>" "<B>"` (relación entre dos nodos), `graphify affected "<X>"` (qué se rompe si cambias X). Solo tras orientarte con el grafo se leen archivos crudos, y únicamente para modificar/depurar líneas concretas.
- **Actualizar el grafo**: `graphify update .` (solo AST, sin coste de API, rápido) tras modificar código. Además, los git hooks `post-commit`/`post-checkout` (instalados con `graphify hook install`) lo actualizan solos en cada commit y checkout, así que normalmente no hay que hacerlo a mano.
- **Windows: los ejecutables de graphify van por envoltorio (receta del 08-08-2026)**. Smart App Control está **activo y en modo forzado** en el equipo del autor y bloquea todo `.exe` sin firma, incluidos los _shims_ que genera pipx: `graphify.exe` daba «Una directiva de Control de aplicaciones bloqueó este archivo» (PowerShell) y «Permission denied» (bash). Solución aplicada: los shims se apartaron a `~/.local/bin/graphify(-mcp).exe.sac-blocked` y en su lugar hay dos envoltorios que invocan el paquete **por su módulo** con el python del entorno de pipx (que sí está firmado): `~/.local/bin/graphify.cmd` (cmd/PowerShell) y `~/.local/bin/graphify` sin extensión (Git Bash). Es la misma vía que ya usaba el hook `post-commit`, y por eso ese sí funcionaba. Los hooks `PreToolUse` de `.claude/settings.json` apuntan al `.cmd`. _Alternativa descartada_: desactivar Smart App Control; _porqué_: una vez apagado **no puede volver a activarse sin reinstalar Windows**, y debilitar la protección de todo el equipo para ejecutar un shim no compensa cuando el envoltorio resuelve el problema sin tocar la seguridad. Si `pipx upgrade` regenera los shims, volverán a estar bloqueados: repetir el apartado y conservar los envoltorios.
- **Enriquecido semántico (opcional)**: `graphify extract . --backend claude` añade aristas inferidas y mejores nombres de comunidad usando el LLM; el `update` de los hooks es solo AST. Útil ejecutarlo de vez en cuando cuando haya código real, no en cada sesión.
