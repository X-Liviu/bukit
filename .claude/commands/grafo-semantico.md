---
description: Reconstruye el grafo de graphify con el pase semántico (LLM) para aristas inferidas y comunidades bien nombradas
---

Ejecuta el pase **semántico** de graphify sobre el proyecto. A diferencia del `graphify update .` habitual (solo AST, sin coste, que corre en cada commit y en `/journal`), este pase usa el LLM para añadir aristas inferidas entre símbolos y nombres de comunidad reales. Reserva su uso para cuando el código haya crecido de forma notable: no aporta valor sobre stubs y sí consume tokens.

1. Comprueba antes que hay código real que merezca el pase (más allá de READMEs y stubs): mira `git log` reciente y el tamaño de `apps/`/`packages/`. Si el proyecto sigue casi vacío, avísalo y **no** lo ejecutes salvo que el autor insista.
2. Lanza el pase con el backend `claude` (usa el CLI de Claude ya instalado, sin necesidad de `ANTHROPIC_API_KEY` aparte):
   ```
   graphify extract . --backend claude
   ```
   Si en el futuro hay una `GEMINI_API_KEY`/`GOOGLE_API_KEY` en el entorno, `graphify extract .` (sin `--backend`) usará Gemini, que suele ser más rápido y barato para esto.
3. Al terminar, verifica que `graphify-out/graph.json` se ha regenerado y resume cuántos nodos, aristas y comunidades tiene ahora (aparece en la salida del comando) y si el conteo ha subido respecto al grafo AST-only previo.
4. Si el pase falla o produce **menos** nodos que antes, no machaques el grafo bueno: `graphify extract` no sobrescribe a la baja sin `--force`. Reporta el error en vez de forzar.
5. Recuérdale al autor que este pase no hace falta en cada sesión: el grafo AST se mantiene solo; esto es un enriquecimiento ocasional.
