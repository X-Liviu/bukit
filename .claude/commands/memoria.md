---
description: Actualiza la memoria del TFG (docs/thesis) con los cambios recientes del proyecto
---

Actualiza la memoria del TFG en `docs/thesis/` para que refleje los cambios recientes del proyecto:

1. Averigua qué ha cambiado desde la última actualización: revisa la conversación actual, el `git log` reciente y la última entrada de `docs/dev-journal/`.
2. Identifica qué capítulos se ven afectados por esos cambios (p. ej. decisiones de tecnología → caps. 6/8/9; riesgos nuevos → cap. 7; planificación/horas → caps. 10/13; presupuesto → cap. 14) y actualízalos.
3. Respeta las reglas de la memoria del CLAUDE.md (§2.4): una frase por línea, citas APA con `\parencite`/`\textcite`, acrónimos con `\ac{}`, labels con prefijo, `\todonote{}` para lo pendiente, datos globales solo en `config/metadata.tex`.
4. Recompila con la receta sin Perl y verifica exit 0 sin warnings nuevos.
5. Termina resumiendo qué capítulos han cambiado y por qué; si algún cambio del proyecto no encaja aún en ningún capítulo, dilo en vez de forzarlo.
