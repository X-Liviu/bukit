import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { apiErrorSchema, loginResponseSchema } from "@bukit/core";

import { account, registerAccount } from "../helpers.js";
import { createApp } from "../../src/app.js";
import { getPrisma } from "../../src/platform/prisma.js";
import { config } from "../../src/config.js";

// App nueva en cada caso (beforeEach): desde la US-07 lleva contadores de
// limitación de peticiones, y una sola por fichero los acumularía entre casos.
let app = createApp();
const prisma = getPrisma();

/** Alta previa: el login se prueba contra una cuenta creada por la propia API. */
const register = () => registerAccount(app);

beforeEach(async () => {
  await prisma.user.deleteMany();
  app = createApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/login", () => {
  it("devuelve el par de tokens y el usuario con credenciales correctas", async () => {
    await register();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: account.email, password: account.password });

    expect(res.status).toBe(200);
    // La respuesta se valida contra el contrato compartido, igual que el alta.
    expect(loginResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.tokens.expiresIn).toBe(config.jwt.accessTtlSeconds);
  });

  it("emite tokens firmados, con el usuario dentro y vidas distintas", async () => {
    await register();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: account.email, password: account.password });

    const access = jwt.verify(res.body.tokens.accessToken, config.jwt.secret) as jwt.JwtPayload;
    const refresh = jwt.verify(res.body.tokens.refreshToken, config.jwt.secret) as jwt.JwtPayload;

    expect(access.sub).toBe(res.body.user.id);
    expect(access.typ).toBe("access");
    expect(refresh.typ).toBe("refresh");
    // El de refresco vive mucho más que el de acceso (15 min frente a 30 días).
    expect((refresh.exp ?? 0) - (access.exp ?? 0)).toBeGreaterThan(0);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  it("no distingue entre email inexistente y contraseña incorrecta", async () => {
    await register();

    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nadie@example.com", password: account.password });
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: account.email, password: "otra-contraseña" });

    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    // Misma respuesta exacta: el login no debe servir para averiguar qué
    // emails están registrados.
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(apiErrorSchema.safeParse(unknownEmail.body).success).toBe(true);
  });

  it("rechaza el login sin credenciales con el contrato de error", async () => {
    const res = await request(app).post("/auth/login").send({ email: "no-es-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /auth/me (ruta privada)", () => {
  async function login(): Promise<{ accessToken: string; refreshToken: string }> {
    await register();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: account.email, password: account.password });
    return res.body.tokens;
  }

  it("devuelve el usuario autenticado con un token válido", async () => {
    const { accessToken } = await login();
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(account.email);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  it("rechaza sin cabecera, con esquema erróneo o con token vacío", async () => {
    await login();
    for (const header of [undefined, "Bearer", "Basic abc", "abc"]) {
      const req = request(app).get("/auth/me");
      if (header) req.set("Authorization", header);
      const res = await req;
      expect(res.status).toBe(401);
      expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    }
  });

  it("rechaza un token con firma ajena (falsificado)", async () => {
    const { accessToken } = await login();
    const payload = jwt.decode(accessToken) as jwt.JwtPayload;
    const forged = jwt.sign({ sub: payload.sub, typ: "access" }, "otro-secreto-cualquiera", {
      issuer: config.jwt.issuer,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${forged}`);
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
    const expired = jwt.sign({ sub: payload.sub, typ: "access" }, config.jwt.secret, {
      issuer: config.jwt.issuer,
      expiresIn: -10,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${expired}`);
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
    const unsigned = jwt.sign({ sub: payload.sub, typ: "access" }, "", {
      algorithm: "none",
      issuer: config.jwt.issuer,
    });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });
});
