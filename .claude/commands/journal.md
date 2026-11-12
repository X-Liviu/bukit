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

3. **Secciones del método** (desde el 12-11-2026; formato en el TEMPLATE y reglas en el README del diario). El sprint es una tanda de trabajo, no una semana; las semanas sin sesiones no se declaran ni se recuperan:
   - **«Planificación (Sx)»**: solo si en esta sesión se abre una tanda nueva (se elige la siguiente historia del backlog). Si no se abrió, quita la sección; **no la inventes**.
   - **«Control mensual»** y **«Revisión de riesgos»**: solo si es la primera entrada del mes (o si se cierra una fase, o se observó un disparador, para la revisión de riesgos). Prepara un borrador con los datos objetivos (puntos entregados frente al calendario del cap. 13, horas del mes según el diario), pero **las valoraciones son del autor**. En el resto de entradas, quita ambas secciones.
   - Si hay una planificación abierta en una entrada anterior, **marca `[x]`** en sus casillas lo que se haya completado en esta sesión.
   - **Si en esta sesión se ejecutó `/coherencia aplicar`**: anota en «Qué he hecho» cuántos hallazgos se aplicaron, las decisiones del autor y lo pendiente.
4. Rellena, **una línea por hecho**, a partir de la conversación de esta sesión y del `git log`/`git status`: qué se ha hecho (por área: global/frontend/backend), problemas encontrados y cómo se resolvieron, qué falta para la próxima sesión e ideas futuras. Lo que ya está en la planificación de la semana se marca `[x]` allí y no se repite en «Qué he hecho».
5. Las decisiones son la parte más valiosa: anota siempre la alternativa descartada y el porqué.
6. Sé concreto ("configurado ESLint autofix al guardar" sí; "tocado config" no).
7. **Extensión máxima: 10 minutos de lectura** (regla del autor del 11-10-2026; cómo conseguirlo, en `docs/dev-journal/README.md`): hasta 1.800 palabras con `wc -w`; lo normal, 800-1.500. Al terminar, cuenta con `wc -w docs/dev-journal/DD-MM-YYYY.md` y, si se pasa, recorta lo que escribiste tú (decisiones en una línea, triajes como recuento más excepciones, nada repetido de la planificación). Nunca recortes la prosa del autor: si lo suyo ya pasa del límite, avísale.
8. Deja **Horas invertidas** como `X h` para que las rellene el autor (si es una entrada nueva), y recuérdaselo al final.
9. Refresca el grafo de código al cerrar la sesión: ejecuta `graphify update .` (solo AST, sin coste de API). Así el grafo queda al día aunque la sesión termine sin commit (los git hooks solo lo actualizan al commitear/checkout).
