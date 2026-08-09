// Datos de ejemplo para desarrollo (idempotente): restaurado en la US-04 con la
// primera entidad del modelo, tal y como quedó previsto en el marcador anterior.
// Se ejecuta suelto (tsx prisma/seed.ts), así que instancia su propio cliente y
// cierra la conexión al terminar.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { registerUserSchema } from "@bukit/core";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // TODA escritura pasa por el Zod compartido, también el seed: la garantía de
  // normalización (cap. 9) debe cumplirse por construcción, no de casualidad.
  const datos = registerUserSchema.parse({
    email: "demo@bukit.dev",
    username: "demo",
    // Contraseña de ejemplo SOLO para desarrollo local.
    password: "demo-password-1234",
  });
  // upsert = idempotente: sembrar dos veces no duplica ni falla.
  const demo = await prisma.user.upsert({
    where: { email: datos.email },
    update: {},
    create: {
      email: datos.email,
      username: datos.username,
      passwordHash: await bcrypt.hash(datos.password, 12),
    },
  });
  console.log(`[seed] Usuario de ejemplo listo: ${demo.username} <${demo.email}>`);
}

main()
  .catch((err) => {
    console.error("[seed] Error:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
