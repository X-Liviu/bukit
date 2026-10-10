# Diario de desarrollo (dev journal)

Registro de seguimiento del TFG. Sirve para dos cosas:

1. **Retomar el hilo**: cada sesión empieza leyendo la última entrada ("qué falta por hacer").
2. **Materia prima para la memoria**: la planificación _real_ (horas, problemas, decisiones y su porqué)
   sale de aquí, no de la memoria histórica de nadie. El capítulo de planificación/seguimiento del TFG
   prácticamente se escribe solo si el diario está al día.

## Convención

- **Un archivo por sesión de trabajo**, con el nombre `DD-MM-YYYY.md` (formato fijado al inicio; el explorador los ordena por día y no por fecha, así que para seguir la cronología se mira la cabecera «Día N» o el `git log`).
- Copiar [`TEMPLATE.md`](TEMPLATE.md) y rellenarlo **antes de cerrar la sesión**, con la cabeza aún caliente, cuando lo indique el comando "/journal". La excepción es la planificación de la semana, que se escribe **al empezar** la sesión del lunes.
- Si un día hay dos sesiones muy distintas, vale `DD-MM-YYYY-b.md`; su cabecera repite el número del día: `# Día N (sesión b) - Día de la semana, DD-MM-YYYY`.
- **Secciones de las ceremonias** (las ceremonias rigen desde el 05-10-2026; su formato en el diario se fijó el 10-10-2026): la entrada del **lunes** abre con «Planificación de la semana» y la del **domingo** lleva «Retrospectiva» seguida de «Revisión de riesgos». Sin sesión ese día, la planificación va en la primera entrada de la semana y la retro en la primera de la semana siguiente, antes de su planificación. El resto de entradas no las llevan. La planificación incluye además el triaje del informe de coherencia del domingo (`docs/coherencia/`, comando `/coherencia`): qué hallazgos se corrigen esa semana.
- **Las entradas pasadas no se reescriben**: son históricas. Solo se tocan para marcar `[x]` en la planificación de la semana en curso, para corregir un error objetivo de forma (día de la semana, «Día N», un enlace) dejando constancia en la entrada del día, o para retirar un dato personal (regla de privacidad de CLAUDE.md §2.2). Las horas de una entrada reciente sí pueden rellenarse a posteriori.
- Ser concreto: "configurado ESLint autofix al guardar" sí; "tocado config" no.
- Las **decisiones** son la parte más valiosa: anotar siempre la alternativa descartada y el porqué.
