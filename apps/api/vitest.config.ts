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
    // Se ejecuta antes de cada fichero de prueba: aborta si DATABASE_URL no es
    // local (ver tests/setup.ts), para que las pruebas nunca vacíen producción.
    setupFiles: ["./tests/setup.ts"],
    // Coste bcrypt bajo SOLO en pruebas: a 12 rondas, bcryptjs pagaría ~1 s de
    // CPU por cada alta. Aquí llega antes que cualquier import de la API.
    env: { BCRYPT_ROUNDS: "4" },
  },
});
