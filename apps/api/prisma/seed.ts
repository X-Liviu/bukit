// Datos de ejemplo para desarrollo (idempotente): restaurado en la US-04 con la
// primera entidad del modelo, tal y como quedó previsto en el marcador anterior.
// Se ejecuta suelto (tsx prisma/seed.ts), así que instancia su propio cliente y
// cierra la conexión al terminar.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { registerUserSchema } from "@bukit/core";

import { hashPassword } from "../src/auth/passwords.js";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // TODA escritura pasa por el Zod compartido, también el seed: la garantía de
  // normalización (cap. 9) debe cumplirse por construcción, no de casualidad.
  const input = registerUserSchema.parse({
    email: "demo@example.com",
    username: "demo",
    // Contraseña de ejemplo SOLO para desarrollo local.
    password: "demo-password-1234",
  });
  // upsert = idempotente: sembrar dos veces no duplica ni falla.
  const demo = await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      email: input.email,
      username: input.username,
      // El mismo hash que la API, con el coste de BCRYPT_ROUNDS.
      passwordHash: await hashPassword(input.password),
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
