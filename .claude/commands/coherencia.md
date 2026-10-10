---
description: Auditoría semanal (domingo noche, sin supervisión) de la coherencia entre todos los documentos de contexto, la memoria y el código; deja un informe en docs/coherencia/
argument-hint: "[rapido] [claves de lente separadas por espacios]"
disable-model-invocation: true
---

# /coherencia — auditoría semanal de coherencia

Comprueba que **todas las fuentes de información del proyecto digan lo mismo** entre sí y respecto a la realidad del repositorio: CLAUDE.md, los README, COMMANDS.md, las plantillas, los comandos, el dev-journal, los diagramas, los documentos de riesgos, los comentarios de la configuración y del código, y **toda la memoria** (capítulos, preliminares, bibliografía). Deja un informe en `docs/coherencia/` con cada contradicción, desfase o regla incumplida, verificado y con su corrección propuesta.

Pensado para **ejecutarse de noche sin nadie delante**, pero a escala contenida (decisión del autor, 10-10-2026, tras un primer diseño descartado por desproporcionado — ver abajo): tú mismo reúnes primero los hechos del repositorio con los scripts de `docs/coherencia/scripts/` (sin gastar ningún agente en eso), lanzas **6 lentes en paralelo** con la herramienta Agent, y si hay hallazgos críticos o altos, **una sola pasada de verificación agrupada** los somete a un agente que intenta refutarlos. Total: entre 6 y 8 agentes, la mayoría en Haiku; unos 10-20 minutos. _Alternativa descartada_: el diseño original tenía 15 lentes con un verificador por cada hallazgo (hasta 25 por lente) y una ronda extra de «huecos», lo que podía disparar el número de agentes a varios cientos por ejecución semanal; _porqué se descartó_: insostenible para una tarea recurrente de bajo riesgo — el gasto de una auditoría puntual a fondo no debe ser la escala por defecto de algo que se repite cada semana. Cómo lanzarlo, cuánto cuesta y qué hacer con el informe: `docs/coherencia/README.md`.

Vocabulario de este comando: **lente** = una dimensión de revisión con sus fuentes y sus comprobaciones; **resumen de hechos** = el archivo `hechos.md` con los datos objetivos que las seis lentes comparten; **carpeta temporal** = la carpeta de trabajo de la sesión que te indica el sistema; crea dentro `coherencia/`, escribe siempre sus rutas con barras normales (`C:/Users/...`), aunque el sistema te las dé con barras invertidas; **raíz** = `C:/Users/Liviu/Desktop/webdev/bukit`.

## Argumentos

Argumentos recibidos: `$ARGUMENTS`

- Vacío: las 6 lentes, con verificación de los hallazgos críticos o altos. Es el modo del domingo.
- Claves de lente separadas por espacios (`memoria riesgos-presupuesto`): solo esas lentes, con verificación. Una clave que no exista se ignora y se anota en Incidencias.
- `rapido` (solo o con claves): sin verificación; el informe va a la carpeta temporal y **no** a `docs/coherencia/`, que es la evidencia semanal.

## Reglas de ejecución (para ti y para cada agente que lances)

- **Nunca preguntes** al autor (nada de preguntas de opción). Lo que necesite una decisión suya se anota en el informe como «decisión del autor».
- **No modifiques ningún archivo del proyecto**, salvo escribir el informe en `docs/coherencia/` y archivos de trabajo en la carpeta temporal. Nada de `git add/commit/push/stash/checkout/reset`, `pnpm install/add/format`, `lint:fix`, `db:*`, `prisma migrate`, `docker`, `graphify update/extract`, borrados ni reescrituras. El comando **propone** correcciones; no las aplica.
- **Usa siempre la herramienta Bash (Git Bash)**, nunca PowerShell: en PowerShell no existen `grep`, `wc` ni `&&`. La carpeta de trabajo se reinicia entre llamadas: **cada orden empieza por `cd <ruta absoluta> && …`** y los scripts se invocan por ruta absoluta (`node <raíz>/docs/coherencia/scripts/<script>.cjs`). **Ninguna orden puede llevar barras invertidas literales** (la herramienta las reduce y la orden falla en silencio): toda extracción con expresiones regulares se hace con los scripts de `docs/coherencia/scripts/*.cjs`; si necesitas otra, escríbela con la herramienta Write en la carpeta temporal y ejecútala con `node <ruta>`. En Bash, `grep -F` para buscar macros LaTeX y `[[:space:]]` en vez de `\s`. Ninguna orden empieza por una asignación de variable ni usa `$(…)`: resuelve el valor en una orden aparte y pégalo.
- **Para buscar en el código usa `git grep --untracked`** (archivos versionados y nuevos, respetando `.gitignore`), nunca `grep -r`: un `grep -r` sobre `apps/api` imprimiría `apps/api/.env.production` con la cadena de conexión de producción. Para listar archivos, `git ls-files --cached --others --exclude-standard`.
- **Secretos y datos personales**: no leas ni imprimas `apps/api/.env*` (salvo `.env.example`), ni las notas de la memoria automática de Claude Code (`~/.claude/…`): el informe se commitea. Si una comprobación encuentra un secreto o un dato personal, en el informe va **archivo, línea y nombre de la variable; nunca el valor**, tampoco en las citas literales de la verificación. `gh api` solo con GET (nunca `-X`, `--method`, `-f`, `-F` ni `--input`).
- Permitido: lecturas; `git` de solo lectura (`status`, `log`, `diff`, `fetch`, `ls-files`, `rev-parse`, `branch`, `grep`, `show`); `gh` de solo lectura (`run list/view`, `pr list/view`, `issue list`, `api` GET); `pnpm audit`; `vitest list`; `prisma validate`; `npm view`; compilar la memoria (solo escribe en `build/`, ignorado por git); `graphify query/explain`.
- **Fija la fecha, el sprint y el nombre del informe al principio** (Paso 0.A) y úsalos hasta el final: una ejecución que arranca el domingo termina el lunes, y `date`, la fórmula de sprint y `git log --since` darían otra cosa a medianoche.
- Si algo falla (la compilación, `gh` sin red, un agente que no responde), anótalo en «Incidencias de la ejecución» y sigue. Sin red fallan rápido `gh auth status` (úsalo de detector), `git fetch --quiet origin`, `pnpm audit`, `npm view` y la autoinstalación de paquetes de MiKTeX. El informe se escribe **siempre**, aunque sea parcial. Si el flujo entero se interrumpe (suspensión, reinicio), no hay nada que reanudar: la próxima vez se relanza desde cero — a esta escala (10-20 min) no compensa la complejidad de guardar progreso.
- Nada necesita Docker ni la base de datos: no la levantes. La versión de Docker Desktop del inventario se da por inverificable si Docker está apagado.
- Si el hook de graphify te pide consultar el grafo antes de leer código, hazlo (`graphify query "..."`) y continúa; no bloquea nada.
- En caso de duda sobre qué fuente manda, aplica la precedencia de `docs/coherencia/README.md`; sobre si algo es un hallazgo, la lista «Qué NO es un hallazgo» del final; y antes de reportar, mira la tabla «Excepciones aceptadas por el autor» del mismo README.

## Paso 0: resumen de hechos (lo ejecutas tú, sin agentes)

Reúne los datos objetivos directamente con Bash: son órdenes deterministas (scripts, `git`, `gh`), no razonamiento, así que no hace falta delegarlas. Redirige cada salida a un archivo en vez de leerla tú (`orden > archivo.txt`, o `comando | node script.cjs > archivo.json`) para no cargar tu propio contexto; comprueba solo el código de salida o las primeras líneas. Al final tendrás `<carpeta temporal>/coherencia/hechos.md`, que es lo único que leerán las lentes.

1. `date +"%F %H:%M"` → hora de inicio. `node <raíz>/docs/coherencia/scripts/calendar.cjs` → día de la semana, sprint, fase y rango del sprint; fíjalos y úsalos el resto de la ejecución. Nombre del informe: `docs/coherencia/YYYY-MM-DD-SN.md` (`S7`…; `pausa` si la fórmula no da sprint); si ya existe uno con ese nombre, añade `-b`. Título interior: «cierre del Sx» si hoy es domingo; si no, «semana del Sx».
2. `cd <raíz> && git rev-parse --short HEAD`, rama actual, `git status --short` íntegro (el informe audita **los archivos tal y como están en disco**; un hallazgo puede referirse a un cambio sin commit, y la cabecera del informe lista esos archivos). `git fetch --quiet origin` (si falla, sin red: anótalo).
3. `mkdir -p <carpeta temporal>/coherencia`.
4. **Mapa de fuentes.** `git ls-files --cached --others --exclude-standard | grep -iE "(^|/)(CLAUDE|README|TEMPLATE|COMMANDS|PLANTILLAS)[^/]*[.](md|tex)$|[.]claude/|docs/referencias/|docs/coherencia/"` frente a la tabla de `docs/coherencia/README.md`: archivos sin fila y filas de archivos inexistentes.
5. **GitHub** (si `gh auth status` responde; si no, anótalo y salta el punto): `gh run list --branch main --workflow ci.yml --event push --limit 3 --json status,conclusion,headSha,createdAt,displayTitle` (sin `--workflow` se cuelan las ejecuciones de Dependabot). Resuelve el SHA de `main` en una orden aparte (`git rev-parse origin/main`) y pégalo: `gh api "repos/{owner}/{repo}/commits/<sha>/check-runs" --jq '.check_runs[] | .name + ": " + .status + " " + (.conclusion // "-")'`. `gh pr list --state all --limit 15 --json number,title,state,mergedAt,closedAt`. `gh api "repos/{owner}/{repo}/deployments?per_page=1" --jq '.[0] | {sha, environment, created_at}'` y después `git log --oneline <sha del despliegue>..origin/main` (si no está vacío: producción va por detrás de `main`; anota la causa). `gh issue list --state all --limit 20 --json number,state,title`. `gh api "repos/{owner}/{repo}/milestones?state=all" --jq '.[] | .title + ": " + .state'`. `gh api -i "repos/{owner}/{repo}/vulnerability-alerts" | head -1` (204 = activadas, 404 = desactivadas). `git branch -r`.
6. **Versiones y máquina.** `cd <raíz> && node <raíz>/docs/coherencia/scripts/versions.cjs`: dependencias, compartidas con versiones distintas, lockfile frente a `package.json`, Node fijado en cada sitio, acciones de la CI, imagen de Postgres, y las herramientas instaladas en el equipo.
7. **Vulnerabilidades.** Del árbol: `pnpm audit --prod --json | node <raíz>/docs/coherencia/scripts/audit.cjs` y lo mismo sin `--prod` (código 1 con avisos: no es un fallo). De `origin/main`: `mkdir -p <carpeta temporal>/coherencia/audit-main/apps/api <…>/packages/core <…>/packages/api-client <…>/packages/ui-core <…>/e2e`; copia con `git show origin/main:<ruta> > <destino>` `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `./.npmrc` (las rutas que empiezan por punto llevan `./` delante) y los `package.json` de `apps/api`, `packages/*` y `e2e`; después `cd <carpeta temporal>/coherencia/audit-main && pnpm audit --prod --json | node <raíz>/docs/coherencia/scripts/audit.cjs`. Una vulnerabilidad alta o crítica en `main` sin registrar en el diario es hallazgo crítico.
8. **Esquema, migraciones, API y pruebas.** Lee `apps/api/prisma/schema.prisma`; `pnpm --filter @bukit/api exec prisma validate`; `ls apps/api/prisma/migrations`; para cada migración anterior al último despliegue, `git diff <sha del despliegue>..HEAD -- apps/api/prisma/migrations/<carpeta>` debe estar vacío. Rutas: `git grep --untracked -nE "^[[:space:]]*[A-Za-z]*Router[.](get|post|put|patch|delete)[(]|app[.](get|post|put|patch|delete|use)[(]" -- apps/api/src`. Lee los esquemas de `packages/core/src/*.ts`, las constantes de `apps/api/src/utils/config.ts` y `apps/api/.env.example`. Pruebas: `pnpm --filter @bukit/api exec vitest list` y `pnpm --filter @bukit/core exec vitest list`.
9. **CI/CD.** Lee `ci.yml`, `action.yml`, `render.yaml`, `dependabot.yml`, `.gitattributes`, `.npmrc`, `.dockerignore`, `.nvmrc`. BOM: `git ls-files -z | xargs -0 file | grep -F "with BOM"`.
10. **Compilación de la memoria**, con `-jobname=coherencia` para no pisar los artefactos del autor. Cuatro órdenes, cada una `cd <raíz>/docs/thesis && …` con `timeout` de 300000: `mkdir -p build && pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build -jobname=coherencia main.tex`; `biber build/coherencia`; dos pasadas más de `pdflatex` iguales a la primera. Registra el código de salida de cada una; `grep -c "Infinite glue shrinkage" build/coherencia.log` y `grep -c "faked small caps" build/coherencia.log` (línea base: 4 y 18); otros avisos: `grep -nE "^(LaTeX|Package [a-z]+) Warning|^Overfull|^Underfull|^! " build/coherencia.log | grep -v -e Replacing -e "faked small caps"`; citas y referencias: `grep -E "Citation .* undefined|Reference .* undefined|There were undefined" build/coherencia.log`; `grep -cE "WARN|ERROR" build/coherencia.blg`. Si la compilación falla, anota «no evaluado» y sigue. Guarda también `build/coherencia.toc`.
11. **Extracciones de la memoria**: `node <raíz>/docs/coherencia/scripts/thesis.cjs docs/thesis`.
12. **Documentos de riesgos** modificados en los últimos 7 días: unión de `git log --since="7 days ago" --name-only -- docs/thesis/plan-riesgos docs/thesis/seguimiento-riesgos` y `git status --short` de esas carpetas; compílalos con `mkdir -p build && pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build <archivo>.tex`, dos veces, sin biber. Lista los archivos de ambas carpetas y las filas de la tabla de seguimiento del cap. 7 (`grep -nF "plan-riesgos-v" docs/thesis/chapters/07-analisis-riesgos.tex`).
13. **Apariciones de EP, RF, RNF, US y R**: `git grep --untracked -hoE "(EP[0-9]{2}|RF-[0-9]{2}|RNF-[0-9]{2}|US-[0-9]{2}|R1[0-9]|R[1-9])" -- CLAUDE.md docs/thesis/chapters docs/dev-journal | sort | uniq -c | sort -rn`. Aviso: `R2` casa también con Cloudflare R2.
14. **Diario**: `node <raíz>/docs/coherencia/scripts/journal.cjs --today=<fecha fijada>`. Añade el texto íntegro de «Qué falta por hacer» de la última entrada completa y, si existen, las secciones de planificación y retrospectiva de la semana en curso y la anterior.
15. **Decisiones fechadas**: `node <raíz>/docs/coherencia/scripts/decisions.cjs --today=<fecha fijada>`.
16. **Registro de cifras**: `node <raíz>/docs/coherencia/scripts/numbers.cjs --since=<fecha fijada menos 28 días> CLAUDE.md README.md COMMANDS.md apps/api/README.md docs/diagramas/README.md docs/dev-journal docs/thesis/chapters/03-objetivos-alcance.tex docs/thesis/chapters/07-analisis-riesgos.tex docs/thesis/chapters/10-tareas-fases-procedimientos.tex docs/thesis/chapters/13-gantt-tfg.tex docs/thesis/chapters/14-presupuesto.tex`. Para las fechas con día de la semana, `node <raíz>/docs/coherencia/scripts/calendar.cjs <fechas…>` y anota las que no coinciden.
17. **Diagramas**: `node <raíz>/docs/coherencia/scripts/drawio.cjs docs/diagramas/bukit.drawio`.
18. **Enlaces y árboles**: para cada `.md` de contexto, los enlaces Markdown relativos `[x](ruta)` cuya ruta no exista; los árboles de `README.md` y `docs/thesis/README.md` frente a `ls` (el del README raíz es parcial a propósito).
19. **Informe anterior**: el más reciente de `docs/coherencia/[0-9]*.md` distinto del que se va a escribir; copia su «Hallazgos» (títulos, severidad, archivos, estado) y sus «Decisiones pendientes del autor». Si no hay, «primer informe».
20. **Indicadores de la semana**: commits de los últimos 7 días, entradas del diario de la semana y horas registradas, número de pruebas, vulnerabilidades de producción y de desarrollo (árbol y `main`), `\todonote` y `% TODO`, PRs de Dependabot abiertas, estado de la CI de `main` y último despliegue, días hasta la próxima entrega al tutor (días 1 y 15; en octubre de 2026, 5 y 15).
21. Con la herramienta Write, junta todo en `<carpeta temporal>/coherencia/hechos.md`: cabecera (fecha, día, sprint, nombre del informe, hora de inicio, commit, rama, `git status`) y, debajo, el contenido de cada archivo que generaste arriba (puedes concatenarlos con `cat archivo1 archivo2 … > hechos.md` en vez de reescribirlos a mano).

## Paso 1: las 6 lentes

Lanza las 6 (o las que pidan los argumentos) **en un único mensaje, varias llamadas a la herramienta Agent**, para que corran en paralelo. Cada una recibe: las reglas comunes de abajo (con `<FECHA>` y `<RUTA_HECHOS>` ya sustituidos), su encargo copiado **literalmente** del apartado correspondiente, y el modelo indicado. Pide a cada una que devuelva sus hallazgos en el formato de abajo.

**Modelo por lente** (lo fija el `model` del Agent tool): `version-modelo`, `arquitectura-fuentes`, `producto-metodo` y `riesgos-presupuesto` → `haiku` (comprobaciones mecánicas de hechos). `memoria` y `diario-privacidad-codigo` → `sonnet` (requieren juicio: tono de la prosa, qué cuenta como dato personal).

### Formato de salida que debe pedir cada lente

```
### H1. <título corto>
- Severidad: critico|alto|medio|bajo
- Fuente A: archivo:línea — "cita literal"
- Fuente B: archivo:línea — "cita literal" (o "regla: ..." o "realidad: salida de `comando`")
- Prevalece: ... (número de la regla de precedencia)
- Propuesta: de "..." a "..."
- Esfuerzo: N min
- Requiere decisión del autor: sí/no
- Ya registrado en: ... (si aplica; si no, omite la línea)

## Revisado sin hallazgos
- archivo o par de fuentes revisado y coherente (uno por línea)

## Incidencias
- lo que no se pudo comprobar y por qué (si no hay ninguna, "ninguna")
```

### Lente `version-modelo`

Tecnologías, versiones y modelo de datos/API. Compara la tabla real de versiones y de la máquina (resumen de hechos, `versions.cjs`) con CLAUDE.md §1.3, README raíz, `apps/api/README.md`, el inventario de `docs/diagramas/README.md` (fila a fila), los comentarios de los Dockerfiles, `action.yml` y `ci.yml`, y las tecnologías que nombran los caps. 6, 8 y 9. Compara también `schema.prisma` y las migraciones con el cap. 9 (campos, restricciones, finalidad de cada dato, criterio de cascada), CLAUDE.md §1.4.1, la página de clases de `bukit.drawio` (atributos, multiplicidades, notas de correspondencia con la base), los esquemas Zod de `packages/core` (mismas longitudes y reglas) y las rutas reales de la API frente a `apps/api/README.md`. Comprueba: cada versión que un documento afirme como estado presente coincide con la instalada (coincidencia por prefijo si el documento solo da la versión mayor o menor); la versión de Node de la máquina frente a la fijada en `volta`/CI/Dockerfile; dependencias compartidas con versiones distintas; lockfile sincronizado; el **estado** de cada tecnología (decidida, en consideración, descartada, futura, objetivo secundario) igual en todas las fuentes; que el último `migration.sql` cree exactamente lo que declara el esquema; que las migraciones ya aplicadas en producción no hayan cambiado; que toda migración nueva sea compatible con el código anterior; y que los comentarios de `schema.prisma` y `apps/api/src/**` que afirmen una decisión con fecha sigan siendo ciertos.

### Lente `arquitectura-fuentes`

CI/CD, despliegue, comandos y documentos entre sí. Compara los jobs, condiciones, secretos y concurrencia reales de `ci.yml`, `action.yml`, `render.yaml`, `docker-compose.yml`, los Dockerfiles y `dependabot.yml` con CLAUDE.md §1.3, §1.4.3 y §1.4.4, `apps/api/README.md`, README raíz, los caps. 6 y 8, y las páginas de despliegue y actividad del drawio. Compara también COMMANDS.md con los `scripts` reales de cada `package.json`, `.claude/commands/*.md` (nombres, `description`, lo que hacen), `graphify --help`, CLAUDE.md §2.1 y §3, `.claude/settings.json` y `.claude/coherencia.settings.json` (lo que permite y deniega frente a lo que este comando necesita), y `.vscode/settings.json` (recetas LaTeX). Y el mapa de `docs/coherencia/README.md` frente al árbol real, enlaces rotos, árboles de carpetas, y que `docs/thesis/README.md` contenga las mismas reglas que CLAUDE.md §2.4. Comprueba: producción frente a `main` (el último despliegue de Render es el HEAD de `main`, o la causa está registrada en el diario); vulnerabilidades altas o críticas en `main` sin registrar; las reglas de migraciones y la paridad de versiones con Neon tal como las documentan las fuentes (no puedes consultar Neon); lo que CLAUDE.md y el diario afirman de GitHub frente a la API (PRs de Dependabot, issues, milestones, alertas, ramas); que los comentarios de la configuración sigan describiendo lo que el archivo hace; cada comando que un documento diga que existe, existe con ese nombre; terminología uniforme (Fráncfort, no Frankfurt; «Día N», «Sx», «US-xx», «EPxx»; nombres de los jobs de la CI).

### Lente `producto-metodo`

Reglas de producto y metodología. Compara CLAUDE.md §1.1, §1.2 y §1.5 con los caps. 2, 3 (objetivos, alcance, requisitos RF y RNF, criterios de éxito, ideas pospuestas), 8 y 9, y con los esquemas de `packages/core/src` (listas, metas, usuario: límites numéricos, qué entidad lleva la fecha límite). Compara CLAUDE.md §2.5 con el cap. 10 (tablas del método, de fases, de sprints, de épicas e historias; apartados de herramienta, tutor y holgura), el cap. 13 (Gantt, hitos, previsto frente a real), el cap. 1, `riesgos-preamble.tex`, `docs/dev-journal/TEMPLATE.md`, `docs/dev-journal/README.md`, `.claude/commands/journal.md`. Las remisiones a `BUKIT - Propuesta TFG.docx` son inverificables y no se reportan; si CLAUDE.md y la propuesta difieren, prevalece CLAUDE.md. Comprueba: dos tipos de usuario y sus reglas; límite de 3 listas en curso; fecha límite en la meta y no en la lista; retraso registrado; publicaciones a 60 días con la última siempre visible; historias a 24 h; verificación de identidad y 18+; vídeos TOP fuera del límite del perfil; clasificación de cada idea (comprometida, objetivo secundario, pospuesta, futura) igual en todas partes; numeración de EP, RF y RNF (resumen de hechos; `R2` también es Cloudflare R2); fechas de fases y pausas y numeración de sprints frente a la fórmula; horas por fase y por semana; equivalencia h/punto; holgura sobre el plan completo y sobre lo que queda; límite de trabajo en curso; ceremonias y dónde viven; entregas al tutor (días 1 y 15, excepción de octubre); horas reales por fase del cap. 13 frente a la suma del diario (resumen de hechos; el «Día 0» cuenta en F0).

### Lente `riesgos-presupuesto`

Compara el cap. 7 (tabla de riesgos, cadencias, tabla de seguimiento) con los archivos reales de `plan-riesgos/` y `seguimiento-riesgos/` (lee solo el plan vigente, el último seguimiento y lo nuevo de la semana, no las diez versiones), las entradas del diario que deberían enlazarlos, CLAUDE.md §2.5 («plan vigente vN») y las mitigaciones que CLAUDE.md o el diario den por incorporadas. Cada riesgo citado (Rx) debe existir en la tabla del cap. 7 **o en el plan vigente** (R14 nació en la v3; `R2` también es Cloudflare R2). Compara el cap. 14 (tabla mensual, matices, totales, horas) con las decisiones del diario y CLAUDE.md, con el preliminar «Empleo de IA» (regla de dimensionamiento de planes, usos declarados frente a la práctica real: agentes, grafo, comandos propios, esta auditoría) y con la aritmética de la propia tabla.

### Lente `memoria`

La memoria frente a sus reglas y frente a sí misma. Con el resumen de hechos (`thesis.cjs` y el log de compilación): orden de los `\input` de `main.tex` frente a `docs/referencias/indice-oficial-TFG.md` (la omisión del índice de gráficas y de los agradecimientos está decidida en `main.tex` y no es hallazgo); citas (toda clave citada existe en el `.bib`; `url` sin `urldate` salvo normativa oficial; autores corporativos con dobles llaves; tipos con plantilla en `PLANTILLAS.md`); acrónimos (todo `\ac` definido); `\todonote` ya resolubles (compara su texto con el diario y CLAUDE.md); `% TODO`; saltos de página manuales fuera de `main.tex`; `\includegraphics` de archivos existentes; datos globales escritos a mano en vez de con las macros de `metadata.tex`; avisos de compilación frente a la línea base (4 y 18). Y, leyendo los capítulos: cifras, fechas y nombres iguales en todos ellos (apóyate en el registro de cifras: toda fecha con día de la semana escrito se recalcula; toda fecha «desde el DD-MM-YYYY» debe ser anterior o igual a hoy; los rangos de sprints cuadran con la fórmula); remisiones «capítulo \ref{ch:…}» que apunten al tema correcto; andamiaje temporal en la prosa («pendiente de», «se describirá», «actualmente», «todavía no»… valora el contexto); jerga sin parafrasear (MoSCoW, stub, spike; `sprint`, `pipeline`, `deploy` sin `\eng`); términos en inglés sin `\eng{}`; una frase por línea (las celdas de tabla son una excepción aceptada); afirmaciones de hechos del proyecto que el código o el diario contradigan.

### Lente `diario-privacidad-codigo`

El dev-journal de las últimas dos semanas (y las anomalías de `journal.cjs` sobre todas las entradas): numeración «Día N» consecutiva (las `-b` repiten el número con «(sesión b)»); día de la semana y sprint correctos; planificación en la entrada del lunes (o la primera de la semana) y retrospectiva más riesgos en la del domingo (o la primera de la siguiente); una sola línea de «Horas invertidas»; casillas marcadas como hechas que lo están de verdad (git log, archivos); pendientes de «Qué falta» ya resueltos; decisiones del diario sin reflejo en CLAUDE.md o la memoria cuando deberían tenerlo; y, con `decisions.cjs`, toda fecha de decisión de CLAUDE.md o de los caps. 7, 10, 13 y 14 debe constar en el diario (entrada propia o que declare cubrirla); si no, «decisión sin evidencia». Las entradas pasadas son históricas: solo contradicciones internas de la misma fecha, errores de forma y privacidad, no su desfase con el presente. **Privacidad y secretos**, con prioridad sobre lo demás de esta lente: en `git ls-files --cached --others --exclude-standard` y en los commits recientes — ninguna cadena de conexión con contraseña a un host que no sea localhost; ningún token (`npg_`, `eyJ`, `ghp_`, `gho_`, `sk-`, `-----BEGIN`); ningún `.env` versionado salvo `.env.example`; ningún dato de la vida privada del autor que excluye CLAUDE.md §2.2 (empleadores, personas no públicas, localidades, importes ajenos); los correos de las pruebas, la semilla y los ejemplos usan solo dominios reservados (`example.com`, `.test`, `.invalid`; regla de CLAUDE.md §2.3). En el informe, archivo, línea y nombre de la variable; **jamás el valor**. Y, en `apps/api/**`, `packages/*/src`, `e2e/**`, `docker/**`, `eslint.config.mjs` y config afines: comentarios que afirmen un hecho (fecha, historia, «desde la US-xx», «pendiente») comprobado contra el código, el diario y CLAUDE.md; `console.log` o restos de depuración; mensajes al usuario en otro idioma; comentarios en inglés. Identificadores en español: la regla de CLAUDE.md §0 es inglés sin excepción (también pruebas, scripts, claves JSON e IDs de jobs de la CI); repórtalos agrupados por archivo, con severidad baja. Los textos que lee una persona (mensajes de error, descripciones de pruebas) y los nombres de comandos y lentes no son identificadores.

## Paso 2: verificación (una sola pasada agrupada)

Reúne todos los hallazgos `critico` o `alto` que devolvieron las 6 lentes. Si no hay ninguno, salta este paso. Si hay más de 30, quédate con los 30 primeros por orden de aparición y anota en Incidencias cuántos quedaron fuera. Lanza **un único** Agent (modelo `sonnet`) con las reglas comunes y este encargo:

> VERIFICACIÓN EN CONTRA. Para cada uno de estos hallazgos, releé las dos fuentes citadas (y la realidad, si procede) en los archivos actuales y decide: CONFIRMADO, DESCARTADO (no hay contradicción, es histórico, está en las excepciones aceptadas, o no lo respalda una regla escrita) o REBAJADO (existe, con menor severidad). Si no puedes citar ambas fuentes, DESCARTADO. Para un desfase con la realidad, la fuente B es la regla escrita o la salida del comando que muestra la realidad. Responde **un bloque por hallazgo**, en el mismo orden, con: número del hallazgo, veredicto, severidad final, cita literal de A, cita literal de B, motivo en una frase. Hallazgos:
> `<pega aquí la lista, con su lente y su archivo:línea>`

Aplica las respuestas a los hallazgos: los `DESCARTADO` no entran en el informe; los `REBAJADO` cambian de severidad. Los hallazgos `medio` y `bajo` no se verifican: entran directamente, sin marca de verificación.

### Reglas comunes para cada agente (sustituye `<FECHA>` y `<RUTA_HECHOS>`)

- La fecha de hoy es `<FECHA>`. El resumen de hechos está en `<RUTA_HECHOS>` (ruta absoluta): léelo primero y entero. Después, `docs/coherencia/README.md` (mapa de fuentes, precedencia y excepciones aceptadas). La raíz del repositorio es `C:/Users/Liviu/Desktop/webdev/bukit`. Si el hook de graphify te pide consultar el grafo antes de leer código, hazlo.
- No modifiques ningún archivo. No preguntes nada. Usa la herramienta Bash, nunca PowerShell; cada orden empieza por `cd <ruta absoluta> && …`; `git grep --untracked`, nunca `grep -r`; nada de barras invertidas, asignaciones ni `$(…)` en las órdenes. No leas `apps/api/.env*` ni la memoria automática de Claude. No imprimas secretos.
- Un hallazgo es una **contradicción entre dos fuentes**, un **desfase de una fuente respecto a la realidad** o el **incumplimiento de una regla escrita** (CLAUDE.md, `docs/thesis/README.md`, los README de riesgos, `docs/referencias/`). Cita siempre **archivo y línea** de cada fuente y lo que dice literalmente. Di qué fuente prevalece y por qué (número de la regla de precedencia). Propón la corrección como texto concreto (de → a). Marca «requiere decisión del autor» cuando la precedencia no baste o la corrección sea una decisión de contenido.
- Severidad. **Crítico**: lo que llega al PDF que ven el tutor o el tribunal (contradicción de hechos o cifras dentro de la memoria; incumplimiento de la normativa de la EIB; andamiaje temporal; salto de página manual; diagrama que no sea UML; cita, figura o referencia rota) o lo que afecta a producción, seguridad o privacidad. **Alto**: dos fuentes que guían el trabajo se contradicen en algo que cambiaría una decisión o una acción. **Medio**: desfase factual sin consecuencia inmediata. **Bajo**: terminología, orden, reglas que no cambian el PDF.
- Distingue las **afirmaciones históricas fechadas** (no se desfasan) de las **de estado presente** (sí).
- Comprueba si el asunto **ya está registrado** como pendiente en «Qué falta» de la última entrada del diario, en la planificación vigente o en el informe anterior (resumen de hechos): si lo está, repórtalo igual con «Ya registrado en: …». Si coincide con una excepción aceptada del README, no lo reportes.
- Sé concreto y breve; nada de opiniones de estilo ni propuestas de funcionalidad.

## Paso 3: consolidación y verificación (tú, directamente)

1. **Agrupa los repetidos**: hallazgos de lentes distintas que describan la misma contradicción (mismos archivos sin línea, mismo hecho). Conserva el más completo y anota las lentes que lo vieron.
2. Aplica el resultado del Paso 2 (descarta, rebaja severidad).
3. **Compara con el informe anterior** (resumen de hechos): persistente (lleva «desde DD-MM-YYYY»), nuevo, o resuelto (estaba y ya no aparece).
4. Ordena: crítico → alto → medio → bajo; dentro de cada nivel, primero los que requieren decisión del autor.

## Paso 4: el informe

Escribe el archivo con el nombre fijado en el Paso 0 (en modo `rapido`, en la carpeta temporal), en castellano llano:

```markdown
# Informe de coherencia — DD-MM-YYYY (cierre del Sx | semana del Sx)

**Commit auditado:** `abc1234` (rama `main`; árbol limpio | N archivos sin commit: lista) · **Inicio/fin:** HH:MM–HH:MM · **Lentes:** N de 6 (cuáles faltaron y por qué) · **Agentes:** N · **Modo:** completo | rápido (sin verificar)

## Resumen

- N hallazgos: N críticos, N altos, N medios, N bajos (N nuevos, N persistentes, N ya registrados); N resueltos desde el informe anterior (o «primer informe»).
- Los cinco más importantes, en una línea cada uno.
- Decisiones que necesita el autor: N.

## Indicadores de la semana

| Indicador | Valor | Semana anterior (— si no hay) |
(commits, entradas del diario y horas, pruebas, vulnerabilidades prod/dev en main y en disco, todonotes y % TODO, PRs de Dependabot abiertas, CI de main, último despliegue, días hasta la próxima entrega al tutor)

## Hallazgos

### Críticos

#### C1. Título corto

- **Lente:** … · **Estado:** nuevo | persistente desde … | ya registrado en … · **Decisión del autor:** sí/no
- **A** (`archivo:línea`): «cita literal»
- **B** (`archivo:línea`): «cita literal» · **Realidad** (si procede): …
- **Prevalece:** … porque … (regla de precedencia N)
- **Propuesta:** de «…» a «…»

### Altos … ### Medios … ### Bajos …

## Decisiones pendientes del autor

## Resueltos desde el informe anterior

## Revisado sin hallazgos

Por lente, lo que se encontró coherente (evidencia de cobertura).

## Incidencias de la ejecución

## Para la planificación del lunes

Lista corta (`- [ ]`) con los hallazgos que conviene corregir, agrupados por archivo.

## Ideas (sin contar)
```

Ejecuta `cd <raíz> && pnpm exec prettier --write docs/coherencia/<archivo>.md` (exactamente ese archivo; `pnpm format` está prohibido). No lo commitees.

## Paso 5: cierre

En el chat, solo un resumen corto: ruta del informe, los cinco hallazgos principales, las decisiones que necesita el autor y las incidencias. Recuerda que el informe no está commiteado. No hagas `/journal` ni toques el diario: el lunes, al planificar, el autor incorpora el informe.

## Qué NO es un hallazgo

- Los `\todonote` y `% TODO` existentes, salvo los que ya sean resolubles.
- Las afirmaciones históricas fechadas que eran ciertas en su fecha.
- Las entradas pasadas del diario desfasadas respecto al presente: son históricas.
- Las diferencias de redacción entre la memoria (prosa atemporal) y CLAUDE.md (operativo): solo cuentan si los **hechos** difieren.
- Los `\clearpage` estructurales de `main.tex`; la omisión del índice de gráficas y de los agradecimientos decidida en `main.tex`; el formato de fecha DD/MM/YYYY en la memoria frente a DD-MM-YYYY en los documentos.
- Las remisiones a `BUKIT - Propuesta TFG.docx`: inverificables.
- Lo que está en la tabla «Excepciones aceptadas por el autor» de `docs/coherencia/README.md`.
- Preferencias de estilo no respaldadas por una regla escrita, propuestas de mejora o de funcionalidad, y reorganizaciones. Si alguna idea merece la pena, una línea bajo «Ideas (sin contar)».
- Los comentarios del código o de la configuración que describen una decisión con fecha y siguen siendo ciertos.
- Las versiones que Dependabot propone subir: eso es triaje, no incoherencia.
