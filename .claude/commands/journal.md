---
description: Crea la entrada del dev-journal de la sesión de hoy
---

Crea la entrada del diario de desarrollo de esta sesión:

1. Archivo nuevo `docs/dev-journal/DD-MM-YYYY.md` con la fecha de hoy (si ya existe una entrada de hoy, usa el sufijo `-b` según la convención del README del diario).
2. Copia la estructura de `docs/dev-journal/TEMPLATE.md` y rellénala a partir de la conversación de hoy y del `git log`/`git status`: qué se ha hecho (por área: global/frontend/backend), problemas encontrados y cómo se resolvieron, qué falta para la próxima sesión e ideas futuras.
3. Las decisiones son la parte más valiosa: anota siempre la alternativa descartada y el porqué.
4. Sé concreto ("configurado ESLint autofix al guardar" sí; "tocado config" no).
5. Deja **Horas invertidas** como `X h` para que las rellene el autor, y recuérdaselo al final.
6. Refresca el grafo de código al cerrar la sesión: ejecuta `graphify update .` (solo AST, sin coste de API). Así el grafo queda al día aunque la sesión termine sin commit (los git hooks solo lo actualizan al commitear/checkout).
