import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { apiErrorSchema, loginResponseSchema } from "@bukit/core";

import { createApp } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";
import { config } from "../src/utils/config.js";

// Coste bcrypt bajo SOLO en pruebas (la ruta lo lee por petición).
process.env.BCRYPT_ROUNDS = "4";

const app = createApp();
const prisma = getPrisma();

const cuenta = {
  email: "persona@ejemplo.com",
  username: "persona.ejemplo",
  password: "contraseña-larga",
};

/** Alta previa: el login se prueba contra una cuenta creada por la propia API. */
async function registrar(): Promise<void> {
  await request(app).post("/auth/register").send(cuenta).expect(201);
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/login", () => {
  it("devuelve el par de tokens y el usuario con credenciales correctas", async () => {
    await registrar();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: cuenta.email, password: cuenta.password });

    expect(res.status).toBe(200);
    // La respuesta se valida contra el contrato compartido, igual que el alta.
    expect(loginResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.tokens.expiresIn).toBe(config.jwt.accessTtlSeconds);
  });

  it("emite tokens firmados, con el usuario dentro y vidas distintas", async () => {
    await registrar();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: cuenta.email, password: cuenta.password });

    const acceso = jwt.verify(res.body.tokens.accessToken, config.jwt.secret) as jwt.JwtPayload;
    const refresco = jwt.verify(res.body.tokens.refreshToken, config.jwt.secret) as jwt.JwtPayload;

    expect(acceso.sub).toBe(res.body.user.id);
    expect(acceso.typ).toBe("access");
    expect(refresco.typ).toBe("refresh");
    // El de refresco vive mucho más que el de acceso (15 min frente a 30 días).
    expect((refresco.exp ?? 0) - (acceso.exp ?? 0)).toBeGreaterThan(0);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  it("no distingue entre email inexistente y contraseña incorrecta", async () => {
    await registrar();

    const inexistente = await request(app)
      .post("/auth/login")
      .send({ email: "nadie@ejemplo.com", password: cuenta.password });
    const incorrecta = await request(app)
      .post("/auth/login")
      .send({ email: cuenta.email, password: "otra-contraseña" });

    expect(inexistente.status).toBe(401);
    expect(incorrecta.status).toBe(401);
    // Misma respuesta exacta: el login no debe servir para averiguar qué
    // emails están registrados.
    expect(inexistente.body).toEqual(incorrecta.body);
    expect(apiErrorSchema.safeParse(inexistente.body).success).toBe(true);
  });

  it("rechaza el login sin credenciales con el contrato de error", async () => {
    const res = await request(app).post("/auth/login").send({ email: "no-es-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /auth/me (ruta privada)", () => {
  async function login(): Promise<{ accessToken: string; refreshToken: string }> {
    await registrar();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: cuenta.email, password: cuenta.password });
    return res.body.tokens;
  }

  it("devuelve el usuario autenticado con un token válido", async () => {
    const { accessToken } = await login();
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(cuenta.email);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  it("rechaza sin cabecera, con esquema erróneo o con token vacío", async () => {
    await login();
    for (const cabecera of [undefined, "Bearer", "Basic abc", "abc"]) {
      const req = request(app).get("/auth/me");
      if (cabecera) req.set("Authorization", cabecera);
      const res = await req;
      expect(res.status).toBe(401);
      expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    }
  });

  it("rechaza un token con firma ajena (falsificado)", async () => {
    const { accessToken } = await login();
    const payload = jwt.decode(accessToken) as jwt.JwtPayload;
    const falsificado = jwt.sign({ sub: payload.sub, typ: "access" }, "otro-secreto-cualquiera", {
      issuer: config.jwt.issuer,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${falsificado}`);
    expect(res.status).toBe(401);
  });

  it("rechaza el token de REFRESCO como si fuera de acceso", async () => {
    const { refreshToken } = await login();
    // Sin la marca de tipo, un refresco robado daría 30 días de acceso.
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${refreshToken}`);
    expect(res.status).toBe(401);
  });

  it("rechaza un token caducado", async () => {
    const { accessToken } = await login();
    const payload = jwt.decode(accessToken) as jwt.JwtPayload;
    const caducado = jwt.sign({ sub: payload.sub, typ: "access" }, config.jwt.secret, {
      issuer: config.jwt.issuer,
      expiresIn: -10,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${caducado}`);
    expect(res.status).toBe(401);
  });

  it("rechaza un token válido cuya cuenta ya no existe", async () => {
    const { accessToken } = await login();
    await prisma.user.deleteMany();

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });

  it("rechaza un token con algoritmo «none» (ataque clásico de JWT)", async () => {
    const { accessToken } = await login();
    const payload = jwt.decode(accessToken) as jwt.JwtPayload;
    // Token sin firma: la verificación fija HS256, así que no puede colarse.
    const sinFirma = jwt.sign({ sub: payload.sub, typ: "access" }, "", {
      algorithm: "none",
      issuer: config.jwt.issuer,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${sinFirma}`);
    expect(res.status).toBe(401);
  });
});
