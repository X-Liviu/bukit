# Plan de riesgos — versiones

Versiones del plan de riesgos del TFG como **documentos independientes**.

## Convención

- **v0 = el capítulo 7 de la memoria** (estado a 16-07-2026). Es la línea base y **no se duplica aquí ni se reescribe**: la memoria conserva siempre lo que se previó al inicio, para poder justificar las desviaciones al cierre.
- Cuando una revisión de riesgos (retrospectiva dominical o disparador observado) exija **modificar** el plan (reevaluación de P/I, riesgo nuevo, materialización o cierre), se emite aquí una versión nueva: `plan-riesgos-vN-DD-MM-YYYY.md`.
- Cada versión es un **documento completo e íntegro** (todas las tablas re-emitidas, no un diff), encabezado por una **NOTA** que resume qué cambió respecto a la versión anterior y por qué.
- Cada emisión se registra además en dos sitios: la **tabla de seguimiento del cap. 7** (fila con fecha, sprint, riesgo, estado, versión y acción) y la entrada del **dev-journal** de ese día.
- Formato Markdown por defecto (diffs limpios en git); si alguna versión se necesita como PDF entregable, se genera aparte a partir del Markdown.
- Los seguimientos que originan (o no) cada nueva versión viven en [`../seguimiento-riesgos/`](../seguimiento-riesgos/), un documento fechado por revisión.
