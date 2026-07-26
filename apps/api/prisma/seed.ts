// Datos de ejemplo para desarrollo (idempotente).
// Aún NO hay modelos definidos: el modelo de datos se diseñará de forma incremental.
// Sin modelos tampoco hay cliente generado: instanciar PrismaClient aquí hacía el
// typecheck no determinista en CI (mismo motivo que en src/prisma.ts). Con el
// primer modelo (US-04), restaurar la instancia y los upserts de datos de ejemplo.
function main(): void {
  console.log("[seed] No hay modelos que poblar todavía.");
}

main();
