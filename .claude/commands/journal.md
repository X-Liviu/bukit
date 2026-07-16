---
description: Crea o actualiza la entrada del dev-journal de la sesión de hoy
---

Registra en el dev-journal (`docs/dev-journal/`) el trabajo de esta sesión.

1. **Comprueba si ya existe una entrada de hoy** (`docs/dev-journal/DD-MM-YYYY.md` con la fecha de hoy):
   - **Si NO existe**: créala copiando la estructura de `docs/dev-journal/TEMPLATE.md` y ve al paso 3.
   - **Si YA existe** (puede haberla escrito el autor a mano, o un `/journal` de una sesión anterior del mismo día): **no** la sobrescribas ni crees un `-b` por tu cuenta. **Pregunta al autor** con una pregunta de opción (herramienta de preguntas) qué quiere hacer:
     - **Añadir a la entrada de hoy** (recomendado): conservar íntegro lo que ya hay e integrar lo de esta sesión. Es lo normal cuando hay varias sesiones de Claude en el mismo día, ya que cada sesión es independiente y no ve a las demás.
     - **Crear una entrada nueva** con sufijo `-b`/`-c`… (según la convención del README del diario): solo si esta sesión es un trabajo muy distinto que merece archivo aparte.
   Actúa según su respuesta.

2. **Si el autor elige añadir a la entrada existente**: respeta literalmente lo que ya está escrito —no reformatees su prosa, no borres viñetas ni secciones— e **integra** lo nuevo bajo los encabezados que correspondan (Global/Frontend/Backend, Problemas, Qué falta, Ideas…). Si su archivo no sigue el TEMPLATE al pie de la letra, adáptate a su estructura en vez de imponerla. Debe quedar **una sola** línea de **Horas invertidas** al final (suma o deja el `X h` para que lo ajuste el autor; no la dupliques).

3. Rellena a partir de la conversación de esta sesión y del `git log`/`git status`: qué se ha hecho (por área: global/frontend/backend), problemas encontrados y cómo se resolvieron, qué falta para la próxima sesión e ideas futuras.
4. Las decisiones son la parte más valiosa: anota siempre la alternativa descartada y el porqué.
5. Sé concreto ("configurado ESLint autofix al guardar" sí; "tocado config" no).
6. Deja **Horas invertidas** como `X h` para que las rellene el autor (si es una entrada nueva), y recuérdaselo al final.
7. Refresca el grafo de código al cerrar la sesión: ejecuta `graphify update .` (solo AST, sin coste de API). Así el grafo queda al día aunque la sesión termine sin commit (los git hooks solo lo actualizan al commitear/checkout).
