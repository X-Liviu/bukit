# Comandos útiles — BUKIT

Chuleta de referencia rápida. Cuatro bloques: **comandos propios** (los que hemos creado para este TFG), **graphify** (grafo de código), **scripts del proyecto** (pnpm) y **Claude Code** (la propia herramienta).

---

## 1. Comandos propios (slash de Claude Code, en `.claude/commands/`)

Se escriben con `/` dentro de una sesión de Claude Code.

| Comando            | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/journal`         | Crea **o actualiza** la entrada del dev-journal de hoy (`docs/dev-journal/DD-MM-YYYY.md`) a partir de la conversación y el `git log`. Si ya existe una de hoy, **pregunta** si añadir a ella o crear una nueva (`-b`). Añade las secciones de ceremonia cuando tocan («Planificación (Sx)» al abrir cada tanda de trabajo; «Control mensual» y «Revisión de riesgos» en la primera sesión de cada mes) y marca `[x]` lo completado en la planificación de la tanda en curso. Al terminar refresca el grafo con `graphify update .`. Úsalo **al cerrar cada sesión**.                                                                                                                                                    |
| `/memoria`         | Actualiza la memoria LaTeX del TFG (`docs/thesis/`) con los cambios recientes, respetando las reglas de la memoria (`docs/thesis/README.md`), y recompila verificando exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/grafo-semantico` | Lanza el **pase semántico** de graphify (`graphify extract . --backend claude`): aristas inferidas + comunidades bien nombradas. Solo cuando el código haya crecido; consume tokens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/coherencia`      | Auditoría de coherencia documental **sin supervisión** (a demanda y antes de cada cierre de fase, 10-20 min, 6-8 agentes en Haiku 5.5 y Sonnet 5.5, fijados por configuración): 6 lentes en paralelo comparan todos los documentos de contexto y la memoria entre sí y con el código; los hallazgos críticos o altos se verifican en una pasada agrupada; deja un informe en `docs/coherencia/YYYY-MM-DD-SN.md`. **La auditoría no corrige nada ni pregunta**; el autor no lee el informe: se aplica después con `/coherencia aplicar`, que solo le pregunta las decisiones. Argumentos: `aplicar`, claves de lente (`/coherencia memoria riesgos-presupuesto`) o `rapido`. Cómo lanzarlo: `docs/coherencia/README.md`. |

---

## 2. graphify (grafo de código)

El grafo vive en `graphify-out/graph.json`. Los hooks de `.claude/settings.json` obligan a Claude a consultarlo antes de leer código; los git hooks `post-commit`/`post-checkout` lo actualizan solos.

### Consultar (orientarse antes de leer código)

| Comando                         | Para qué                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `graphify query "<pregunta>"`   | Subgrafo acotado a una pregunta ("¿dónde se valida el login?"). |
| `graphify explain "<concepto>"` | Explica un nodo y sus vecinos.                                  |
| `graphify path "<A>" "<B>"`     | Camino más corto / relación entre dos nodos.                    |
| `graphify affected "<X>"`       | Qué nodos dependen de X (qué se rompe si lo cambias).           |

### Mantener el grafo

| Comando                               | Para qué                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `graphify update .`                   | Re-extrae solo AST. Rápido, **sin coste de API**. Lo normal tras tocar código (y ya lo hacen los git hooks y `/journal`).                  |
| `graphify extract . --backend claude` | Pase **semántico** completo (usa el CLI de Claude, sin API key aparte). Ocasional, cuando haya código real. Equivale a `/grafo-semantico`. |
| `graphify watch .`                    | Vigila la carpeta y reconstruye el grafo al guardar cambios.                                                                               |

### Instalación / estado (ya configurado, referencia)

| Comando                                                      | Para qué                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `graphify claude install`                                    | Escribe la sección graphify en CLAUDE.md + hook `PreToolUse`.  |
| `graphify hook install` \| `hook status` \| `hook uninstall` | Git hooks de auto-actualización (post-commit / post-checkout). |
| `graphify tree` / `graphify export callflow-html`            | Genera visualizaciones HTML del grafo.                         |

> Nota: el `.sql` de PostGIS no entra al grafo hasta instalar el parser: `pip install "graphifyy[sql]"`.

---

## 3. Scripts del proyecto (pnpm, desde la raíz)

| Comando                                     | Qué hace                                                                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` / `pnpm lint:fix`               | ESLint (comprobar / autofix).                                                                                                                   |
| `pnpm format` / `pnpm format:check`         | Prettier (escribir / comprobar).                                                                                                                |
| `pnpm typecheck`                            | Typecheck de todos los paquetes (`pnpm -r`).                                                                                                    |
| `pnpm test` / `pnpm test:e2e`               | Vitest en todos los paquetes salvo e2e (la API necesita `pnpm db:up` antes y se niega a correr contra una base remota) / Playwright en `e2e`.   |
| `pnpm db:up` / `db:down` / `db:reset`       | Postgres en Docker: levantar / parar / **borrar volúmenes** (destructivo).                                                                      |
| `pnpm db:migrate` / `db:studio` / `db:seed` | Prisma en `apps/api`: migrar / abrir Studio / seed.                                                                                             |
| `pnpm docs:pdf` / `docs:clean`              | LaTeX vía `latexmk` — **⚠ no funciona en tu Windows sin Perl**. Compila la memoria con la receta sin Perl (CLAUDE.md, «Comandos»), no con esto. |

**Antes de dar algo por terminado:** `pnpm lint` y `pnpm typecheck` en verde (CLAUDE.md, «Reglas de código»).

---

## 4. Claude Code (la herramienta)

Slash commands y atajos más útiles del día a día.

| Comando            | Qué hace                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `/model <id>`      | Cambia de modelo (p. ej. `opus[1m]`).                                                                                    |
| `/clear`           | Limpia el contexto de la conversación (empezar de cero).                                                                 |
| `/compact`         | Resume y comprime el contexto para seguir sin perder el hilo.                                                            |
| `/rewind`          | Vuelve a un punto anterior de la conversación / cambios.                                                                 |
| `/config`          | Ajustes de la sesión (tema, etc.).                                                                                       |
| `/mcp`             | Estado y autorización de servidores MCP.                                                                                 |
| `/agents`          | Gestiona subagentes disponibles.                                                                                         |
| `/init`            | Genera/actualiza un `CLAUDE.md` del repo.                                                                                |
| `/code-review`     | Revisa el diff actual (o una PR) buscando errores; con `--fix` aplica los arreglos. Usado por primera vez el 04-10-2026. |
| `/security-review` | Revisión de seguridad de los cambios pendientes de la rama.                                                              |
| `/help`            | Lista todos los comandos disponibles.                                                                                    |

**Atajos:** `Esc` interrumpe a Claude; doble `Esc` abre el historial para editar/rebobinar; `Shift+Tab` alterna el modo de permisos (incluido plan mode); arrastrar/pegar imágenes funciona en el prompt.

> Para dudas concretas de Claude Code (hooks, MCP, skills, SDK), pregunta en la sesión: "¿Cómo hago X con Claude Code?".
