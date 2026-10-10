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

3. **Secciones de las ceremonias** (las ceremonias rigen desde el lunes 05-10-2026; el formato de las secciones se fijó el 10-10-2026 y está en el TEMPLATE). Mira el día de la semana de hoy y las entradas ya existentes de la semana (lunes–domingo):
   - **«Planificación de la semana»**: solo si hoy es lunes o si es la primera entrada de la semana. Si en esta sesión se hizo la planificación, recógela ahí; si no se hizo, **no la inventes**: pregunta al autor si quiere hacerla ahora o dejar la sección pendiente. En el resto de entradas, quita la sección.
   - **«Retrospectiva (Sx)»** y **«Revisión de riesgos»**: solo si hoy es domingo o si es la primera entrada de una semana cuyo sprint anterior se quedó sin retrospectiva (en ese caso van **antes** de la planificación, con el número del sprint que cierran). Prepara un borrador con los datos objetivos (lo planificado frente a lo hecho, según las entradas de la semana y el `git log`), pero **las horas reales y las valoraciones son del autor**: déjalas marcadas para que las complete. En el resto de entradas, quita ambas secciones.
   - Si ya existe una planificación de esta semana (en una entrada anterior), **marca `[x]`** en sus casillas lo que se haya completado en esta sesión.
   - **«Informe de coherencia»** (solo junto a la planificación): si en `docs/coherencia/` hay un informe posterior a la última planificación, copia su lista «Para la planificación del lunes» en esa sección y **pregunta al autor** qué hallazgos entran esta semana y qué decide sobre los marcados «decisión del autor»; no los resuelvas tú. Si no hay informe, escribe «sin informe esta semana» y el motivo si se conoce.
4. Rellena a partir de la conversación de esta sesión y del `git log`/`git status`: qué se ha hecho (por área: global/frontend/backend), problemas encontrados y cómo se resolvieron, qué falta para la próxima sesión e ideas futuras.
5. Las decisiones son la parte más valiosa: anota siempre la alternativa descartada y el porqué.
6. Sé concreto ("configurado ESLint autofix al guardar" sí; "tocado config" no).
7. Deja **Horas invertidas** como `X h` para que las rellene el autor (si es una entrada nueva), y recuérdaselo al final.
8. Refresca el grafo de código al cerrar la sesión: ejecuta `graphify update .` (solo AST, sin coste de API). Así el grafo queda al día aunque la sesión termine sin commit (los git hooks solo lo actualizan al commitear/checkout).
