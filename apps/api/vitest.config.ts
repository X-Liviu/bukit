import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Los ficheros de prueba de la API se ejecutan de UNO EN UNO, no en
    // paralelo: todos comparten la misma base de datos real y cada uno la
    // limpia en su beforeEach, así que en paralelo se borran las filas unos a
    // otros (fallo observado en la US-05: las suites pasan por separado y
    // fallan juntas). La deuda quedó anotada en la US-04 y aquí se paga con la
    // opción más honesta: si el recurso es compartido, el acceso se serializa.
    // Alternativa descartada: un esquema de base de datos por trabajador —
    // más rápido, pero añade infraestructura de pruebas que hoy no compensa
    // con suites de segundos.
    fileParallelism: false,
  },
});
