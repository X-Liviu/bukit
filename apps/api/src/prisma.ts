import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Cliente Prisma como singleton PEREZOSO: se crea en el primer uso real, no al
// importar el módulo. Perezoso por dos razones: (1) el despliegue del esqueleto
// (US-03) aún no tiene base de datos gestionada, y un cliente construido al
// importar tiraría el proceso en el arranque por la DATABASE_URL ausente —
// /health debe vivir sin BD; (2) en desarrollo, tsx watch recarga los módulos y
// un cliente nuevo por recarga agotaría el pool de conexiones, así que el
// singleton se conserva en globalThis entre recargas.
// El import de dotenv garantiza la DATABASE_URL también fuera de index.ts
// (p. ej. en las pruebas, que importan la app sin pasar por el arranque).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
