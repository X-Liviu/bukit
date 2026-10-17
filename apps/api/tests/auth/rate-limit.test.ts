import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { apiErrorSchema } from "@bukit/core";

import { account, registerAccount } from "../helpers.js";
import { createApp } from "../../src/app.js";
import { getPrisma } from "../../src/platform/prisma.js";

// Casos de abuso de la doble capa de limitación de peticiones (US-07). Se
// prueban los umbrales reales (20 por origen y 5 por cuenta y origen cada
// 15 min) con una app nueva por caso, que trae contadores nuevos. Las IP son de
// los rangos reservados para documentación (RFC 5737 y RFC 3849).

const prisma = getPrisma();
let app = createApp();

const A = "203.0.113.10";
const B = "198.51.100.20";
const REGISTRAR = "192.0.2.1";

const login = (ip: string, email: string, password = "contraseña-mala") =>
  request(app).post("/auth/login").set("CF-Connecting-IP", ip).send({ email, password });

/** Alta de la cuenta desde un origen propio, para no gastar el cupo de A ni de B. */
const register = () => registerAccount(app, REGISTRAR);

/** n inicios de sesión fallidos desde ip, cada uno con un email distinto (no toca la capa 2). */
async function exhaustOrigin(ip: string, n = 20): Promise<void> {
  for (let i = 0; i < n; i++) {
    await login(ip, `nadie${i}@example.com`).expect(401);
  }
}

/** Comprueba un 429 con el contrato de errores y un Retry-After dentro de la ventana. */
function expectRejected(res: request.Response, code: string): void {
  expect(res.status).toBe(429);
  expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  expect(res.body.error.code).toBe(code);
  const retryAfter = Number(res.headers["retry-after"]);
  expect(Number.isInteger(retryAfter)).toBe(true);
  expect(retryAfter).toBeGreaterThanOrEqual(1);
  expect(retryAfter).toBeLessThanOrEqual(900);
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  // Como en Render: la IP del cliente sale de CF-Connecting-IP.
  vi.stubEnv("CLIENT_IP_HEADER", "cf-connecting-ip");
  app = createApp();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("capa 1: por origen, en el alta y el inicio de sesión", () => {
  it("la petición 21 desde un mismo origen recibe 429 con el contrato de errores", async () => {
    await exhaustOrigin(A);
    expectRejected(await login(A, "otra@example.com"), "TOO_MANY_REQUESTS");
  });

  it("el alta y el inicio de sesión comparten cupo, y un alta bloqueada no crea la cuenta", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post("/auth/register")
        .set("CF-Connecting-IP", A)
        .send({
          email: `persona${i}@example.com`,
          username: `persona${i}`,
          password: "contraseña-larga",
        })
        .expect(201);
    }
    await exhaustOrigin(A, 10);

    const res = await request(app)
      .post("/auth/register")
      .set("CF-Connecting-IP", A)
      .send({ email: "extra@example.com", username: "extra", password: "contraseña-larga" });

    expectRejected(res, "TOO_MANY_REQUESTS");
    expect(await prisma.user.count()).toBe(10);
  });

  it("otro origen no hereda el bloqueo", async () => {
    await exhaustOrigin(A);
    await login(A, "otra@example.com").expect(429);
    await login(B, "otra@example.com").expect(401);
  });

  it("falsificar X-Forwarded-For no abre un cupo nuevo", async () => {
    for (let i = 0; i < 20; i++) {
      await login(A, `nadie${i}@example.com`)
        .set("X-Forwarded-For", `192.0.2.${i + 100}`)
        .expect(401);
    }
    const res = await login(A, "otra@example.com").set("X-Forwarded-For", "192.0.2.250");
    expectRejected(res, "TOO_MANY_REQUESTS");
  });

  it("un CF-Connecting-IP que no es una IP cae en el cupo del socket", async () => {
    for (let i = 0; i < 20; i++) {
      await login(`no-es-una-ip-${i}`, `nadie${i}@example.com`).expect(401);
    }
    expectRejected(await login("tampoco", "otra@example.com"), "TOO_MANY_REQUESTS");
  });

  it("sin CLIENT_IP_HEADER (local y CI), la cabecera se ignora", async () => {
    vi.unstubAllEnvs();
    app = createApp();
    for (let i = 0; i < 20; i++) {
      await login(`192.0.2.${i + 1}`, `nadie${i}@example.com`).expect(401);
    }
    expectRejected(await login("192.0.2.99", "otra@example.com"), "TOO_MANY_REQUESTS");
  });

  it("una CLIENT_IP_HEADER no admitida impide arrancar la app", () => {
    vi.stubEnv("CLIENT_IP_HEADER", "x-forwarded-for");
    expect(() => createApp()).toThrow(/CLIENT_IP_HEADER/);
  });

  it("las IPv6 de la misma red /56 comparten cupo y las de otra red no", async () => {
    await exhaustOrigin("2001:db8:0:1::1");
    await login("2001:db8:0:ff::2", "otra@example.com").expect(429);
    await login("2001:db8:0:100::1", "otra@example.com").expect(401);
  });

  it("/health y las rutas de sesión no se limitan", async () => {
    await exhaustOrigin(A);
    await login(A, "otra@example.com").expect(429);

    // Con el cupo agotado, ninguna responde 429: van fuera del router de
    // credenciales (y antes que él), así que la capa 1 no las cuenta.
    await request(app).get("/health").set("CF-Connecting-IP", A).expect(200);
    for (const path of ["/auth/refresh", "/auth/logout"]) {
      await request(app)
        .post(path)
        .set("CF-Connecting-IP", A)
        .send({ refreshToken: "token-falso" })
        .expect(401);
    }
    await request(app).get("/auth/me").set("CF-Connecting-IP", A).expect(401);
  });

  it("el navegador puede leer Retry-After (CORS)", async () => {
    await exhaustOrigin(A);
    const res = await login(A, "otra@example.com").set("Origin", "http://localhost:5173");

    expect(res.status).toBe(429);
    expect(res.headers["access-control-expose-headers"]).toContain("Retry-After");
  });
});

describe("capa 2: intentos de inicio de sesión por cuenta y origen", () => {
  it("tras cinco fallos, el sexto intento recibe 429 aunque traiga la contraseña correcta", async () => {
    await register();
    for (let i = 0; i < 5; i++) await login(A, account.email).expect(401);

    const res = await login(A, account.email, account.password);

    expectRejected(res, "TOO_MANY_LOGIN_ATTEMPTS");
    // Sin oráculo ni sesión: el bloqueo corta antes de comprobar la contraseña.
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it("un email inexistente se bloquea igual y con el mismo cuerpo (sin enumeración)", async () => {
    await register();
    for (let i = 0; i < 5; i++) await login(A, account.email).expect(401);
    const real = await login(A, account.email);
    for (let i = 0; i < 5; i++) await login(A, "nadie@example.com").expect(401);
    const unknown = await login(A, "nadie@example.com");

    expect(real.status).toBe(429);
    expect(unknown.status).toBe(429);
    expect(unknown.body).toEqual(real.body);
  });

  it("nadie puede bloquear desde fuera la cuenta de otra persona", async () => {
    await register();
    for (let i = 0; i < 5; i++) await login(A, account.email).expect(401);
    await login(A, account.email).expect(429);

    await login(B, account.email, account.password).expect(200);
  });

  it("las variantes de mayúsculas y espacios del mismo email comparten contador", async () => {
    await register();
    const variants = [
      " Persona@Example.com ",
      "PERSONA@EXAMPLE.COM",
      "persona@example.com",
      "Persona@example.COM",
      " persona@EXAMPLE.com",
    ];
    for (const email of variants) await login(A, email).expect(401);

    await login(A, "PeRsOnA@eXaMpLe.CoM").expect(429);
  });

  it("un acierto pone el contador a cero", async () => {
    await register();
    for (let i = 0; i < 4; i++) await login(A, account.email).expect(401);
    await login(A, account.email, account.password).expect(200);
    for (let i = 0; i < 5; i++) await login(A, account.email).expect(401);

    await login(A, account.email).expect(429);
  });

  it("las peticiones mal formadas no gastan intentos de la cuenta", async () => {
    await register();
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post("/auth/login")
        .set("CF-Connecting-IP", A)
        .send({ email: account.email })
        .expect(400);
    }

    await login(A, account.email).expect(401);
  });

  it("diez fallos simultáneos dan exactamente cinco 401 y cinco 429", async () => {
    await register();
    const responses = await Promise.all(Array.from({ length: 10 }, () => login(A, account.email)));
    const statuses = responses.map((res) => res.status);

    expect(statuses.filter((s) => s === 401)).toHaveLength(5);
    expect(statuses.filter((s) => s === 429)).toHaveLength(5);
  });

  it("al terminar la ventana, la cuenta vuelve a admitir intentos", async () => {
    await register();
    for (let i = 0; i < 5; i++) await login(A, account.email).expect(401);
    await login(A, account.email).expect(429);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 15 * 60 * 1000 + 1000);

    await login(A, account.email).expect(401);
  });
});
