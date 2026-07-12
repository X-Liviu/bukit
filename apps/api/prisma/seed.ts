import { PrismaClient } from "@prisma/client";

// Datos de ejemplo para desarrollo (idempotente).
// Aún NO hay modelos definidos: el modelo de datos se diseñará de forma incremental.
// Cuando existan entidades, aquí irán los upserts de datos de ejemplo.
const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("[seed] No hay modelos que poblar todavía.");
}

main()
  .catch((err: unknown) => {
    console.error("[seed] Error:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
