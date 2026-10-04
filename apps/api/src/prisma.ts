import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Cliente Prisma como singleton PEREZOSO: se crea en el primer uso real, no al
// importar el módulo. Perezoso por dos razones: (1) /health debe vivir sin
// depender de la base: el proceso arranca y responde aunque la base no esté
// accesible o falte la DATABASE_URL (así fue el esqueleto de la US-03, antes de
// conectar Neon), y solo las rutas que la usan fallan; (2) en desarrollo, tsx
// watch recarga los módulos y un cliente nuevo por recarga agotaría el pool de
// conexiones, así que el singleton se conserva en globalThis entre recargas.
// El import de dotenv garantiza la DATABASE_URL también fuera de index.ts
// (p. ej. en las pruebas, que importan la app sin pasar por el arranque).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
