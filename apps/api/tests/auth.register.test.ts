import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { apiErrorSchema, ownUserSchema } from "@bukit/core";

import { createApp } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

// Coste bcrypt bajo SOLO en pruebas (la ruta lo lee por petición): a 12 rondas,
// bcryptjs pagaría ~1 s de CPU por cada alta de esta suite.
process.env.BCRYPT_ROUNDS = "4";

// Pruebas de INTEGRACIÓN del alta (US-04): contra el Postgres real de
// desarrollo (docker compose en local; el mismo compose en la CI), nunca
// contra un doble — el criterio de aceptación pide integración de verdad.
// App nueva en cada caso (beforeEach): desde la US-07 lleva contadores de
// limitación de peticiones, y una sola por fichero los acumularía entre casos.
let app = createApp();
const prisma = getPrisma();

const validSignup = {
  email: "persona@example.com",
  username: "persona.ejemplo",
  password: "contraseña-larga",
};

beforeEach(async () => {
  // Aislamiento entre casos: la tabla empieza vacía en cada test.
  await prisma.user.deleteMany();
  app = createApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("da de alta una cuenta y devuelve el contrato público sin el hash", async () => {
    const res = await request(app).post("/auth/register").send(validSignup);

    expect(res.status).toBe(201);
    // La forma de la respuesta se valida contra el MISMO contrato compartido
    // que produce la ruta: una sola fuente de verdad también en el test.
    expect(ownUserSchema.safeParse(res.body.user).success).toBe(true);
    expect(res.body.user).toMatchObject({
      email: "persona@example.com",
      username: "persona.ejemplo",
      tier: "NORMAL",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("cifra la contraseña con bcrypt y jamás la guarda en claro", async () => {
    await request(app).post("/auth/register").send(validSignup);

    const stored = await prisma.user.findUniqueOrThrow({
      where: { email: validSignup.email },
    });
    expect(stored.passwordHash).not.toBe(validSignup.password);
    expect(stored.passwordHash.startsWith("$2")).toBe(true);
    await expect(bcrypt.compare(validSignup.password, stored.passwordHash)).resolves.toBe(true);
  });

  it("normaliza email y username: la unicidad no distingue mayúsculas", async () => {
    await request(app).post("/auth/register").send(validSignup);

    const res = await request(app).post("/auth/register").send({
      email: "  PERSONA@Example.com ",
      username: "otra.persona",
      password: "contraseña-larga",
    });

    expect(res.status).toBe(409);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("responde 409 con mensaje propio si el username ya está en uso", async () => {
    await request(app).post("/auth/register").send(validSignup);

    const res = await request(app).post("/auth/register").send({
      email: "distinta@example.com",
      username: validSignup.username,
      password: "contraseña-larga",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("nombre de usuario");
  });

  it("responde 400 con el contrato de error compartido ante datos inválidos", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "no-es-un-email",
      username: "ab",
      password: "corta",
    });

    expect(res.status).toBe(400);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // Ningún usuario debe haberse creado por el camino.
    expect(await prisma.user.count()).toBe(0);
  });
});
