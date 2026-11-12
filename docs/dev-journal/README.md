# Diario de desarrollo (dev journal)

Registro diario del TFG. Cumple tres funciones:

1. **Retomar el hilo**: cada sesión empieza leyendo la última entrada (es la «daily» del método).
2. **Planificar y seguir el sprint**: desde el 03-10-2026 sustituye al tablero Kanban de GitHub Projects (decisión del autor; el tablero, las issues #1–#10 y los milestones F1–F4 quedan cerrados como evidencia de F1). La planificación de cada tanda es una lista de casillas en la entrada del día en que se hace, el control mensual va en la primera entrada de cada mes, y la trazabilidad entre historias y código, en el mensaje de cada commit (`US-06: …`). No se crean issues, tableros ni milestones.
3. **Materia prima para la memoria**: las horas, los problemas y las decisiones reales alimentan los capítulos 10 y 13.

## Extensión: diez minutos de lectura como máximo

Regla del autor (11-10-2026): una entrada se lee en 10 minutos como máximo, es decir, **hasta 1.800 palabras** contadas con `wc -w docs/dev-journal/DD-MM-YYYY.md` (un texto técnico se lee a unas 180-200 palabras por minuto); lo normal, entre 800 y 1.500. El detalle ya vive en otros sitios (commits, código, CLAUDE.md, memoria, informes de coherencia) y el diario remite a ellos en vez de copiarlo. Motivo: las entradas del 04-10 y del 10-10 llegaron a 4.000-4.500 palabras (unos 20 minutos), y un diario que cuesta leer deja de servir para retomar el hilo. _Alternativa descartada_: extensión libre con un resumen al principio; _porqué_: el resumen es una sección más que mantener y el resto sigue sin leerse.

Cómo se consigue:

- **Una línea por hecho**: qué se hizo y con qué resultado; el cómo, en el commit.
- **Decisiones**: una viñeta con la decisión, la alternativa descartada y el porqué en una frase. Sin tablas de pros y contras: de las opciones comparadas, la elegida y las descartadas con su motivo.
- **Triajes** (revisiones de código, informes de coherencia, PRs de Dependabot): el recuento y solo las excepciones (lo que no se aplica y por qué).
- **Sin repeticiones**: lo planificado se marca `[x]` en la planificación y no se vuelve a contar en «Qué he hecho»; ahí va lo no planificado o un resultado que merezca una línea.
- **Problemas**: una línea cada uno, causa y solución; los menores, juntos en una.
- **Sin secciones vacías**: se quitan las que no aplican ese día.

`/coherencia` lo comprueba cuando se lanza: `docs/coherencia/scripts/journal.cjs` cuenta las palabras de las entradas desde el 11-10-2026 (las anteriores son históricas y no se recortan).

## Convención

- **Un archivo por sesión**, `DD-MM-YYYY.md` (formato fijado al inicio; el explorador los ordena por día y no por fecha, así que la cronología se sigue por la cabecera «Día N» o por el `git log`). Cabecera: `# Día N - Día de la semana, DD-MM-YYYY`, con N consecutivo.
- Si un día hay dos sesiones muy distintas, vale `DD-MM-YYYY-b.md`, cuya cabecera repite el número: `# Día N (sesión b) - Día de la semana, DD-MM-YYYY`.
- Se escribe con el comando `/journal` **antes de cerrar la sesión**, a partir de [`TEMPLATE.md`](TEMPLATE.md). La excepción es la planificación, que se escribe **al empezar** la sesión en que se hace.
- **Secciones del método** (desde el 12-11-2026; cap. 10). El sprint es una **tanda de trabajo**, no una semana: se abre con su planificación y se cierra con su historia, y se numera de forma consecutiva (la primera tras el cambio es el S12). **Las semanas sin sesiones no se declaran ni se recuperan**: no hay semana a cero, modo mínimo ni ceremonias pendientes.
  - **«Planificación (Sx)»**, en la entrada del día en que se abre la tanda: la historia que toca según el backlog del cap. 10, con sus subtareas como casillas, las horas que se le van a dar y las decisiones. Las casillas se marcan `[x]` mientras dure la tanda.
  - **«Control mensual»**, en la primera entrada de cada mes: avance acumulado frente al calendario del cap. 13, horas y puntos del mes, equivalencia horas/punto y qué cambia. La sigue **«Revisión de riesgos»**, que enlaza el seguimiento fechado de `docs/thesis/seguimiento-riesgos/`. El resto de entradas no llevan estas secciones.
  - Hasta el 25-10-2026 el método fue semanal (planificación cada semana, retrospectiva y seguimiento cada domingo): las entradas de entonces siguen ese formato y no se reescriben.
- **Las entradas pasadas no se reescriben**: son históricas. Solo se tocan para marcar `[x]` en la planificación de la semana en curso, para corregir un error objetivo de forma (día de la semana, «Día N», un enlace) dejando constancia en la entrada del día, o para retirar un dato personal (regla de privacidad de CLAUDE.md, «Nunca»).
- **Horas invertidas**: una sola línea, al final; la rellena el autor, y en una entrada reciente puede hacerlo a posteriori.
- Ser concreto: «configurado ESLint autofix al guardar» sí; «tocado config» no.
- Las **decisiones** son la parte más valiosa: anotar siempre la alternativa descartada y el porqué.
