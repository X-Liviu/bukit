import { PrismaClient } from "@prisma/client";

// Singleton del cliente Prisma. En dev se reutiliza entre recargas de tsx watch
// para no agotar el pool de conexiones.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
