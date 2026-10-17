import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { apiErrorSchema, refreshResponseSchema, type TokenPair } from "@bukit/core";

import { account, registerAccount } from "../helpers.js";
import { createApp } from "../../src/app.js";
import { getPrisma } from "../../src/platform/prisma.js";
import { config } from "../../src/config.js";
import { hashToken } from "../../src/auth/sessions.js";

// App nueva en cada caso (beforeEach): desde la US-07 lleva contadores de
// limitación de peticiones, y una sola por fichero los acumularía entre casos.
let app = createApp();
const prisma = getPrisma();

/** Alta + inicio de sesión: cada llamada a login abre una sesión (familia) nueva. */
const register = () => registerAccount(app);
async function login(): Promise<TokenPair> {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: account.email, password: account.password })
    .expect(200);
  return res.body.tokens;
}
function refresh(refreshToken: unknown) {
  return request(app).post("/auth/refresh").send({ refreshToken });
}
function logout(refreshToken: unknown) {
  return request(app).post("/auth/logout").send({ refreshToken });
}
function findRow(refreshToken: string) {
  return prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
}

beforeEach(async () => {
  // Las sesiones caen en cascada con sus cuentas (onDelete: Cascade).
  await prisma.user.deleteMany();
  app = createApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Sesiones persistidas (US-06)", () => {
  it("el inicio de sesión guarda solo la huella del token de refresco, en una familia nueva", async () => {
    await register();
    const a = await login();
    const b = await login();

    const rows = await prisma.refreshToken.findMany();
    expect(rows).toHaveLength(2);
    // Nunca el token en claro: solo su SHA-256.
    expect(rows.map((f) => f.tokenHash).sort()).toEqual(
      [hashToken(a.refreshToken), hashToken(b.refreshToken)].sort(),
    );
    expect(rows.some((f) => f.tokenHash === a.refreshToken)).toBe(false);
    // Cada inicio de sesión es una sesión (familia) distinta.
    expect(new Set(rows.map((f) => f.familyId)).size).toBe(2);
    // La caducidad guardada es la del JWT.
    const { exp } = jwt.decode(a.refreshToken) as jwt.JwtPayload;
    expect((await findRow(a.refreshToken))?.expiresAt.getTime()).toBe((exp ?? 0) * 1000);
  });

  it("renovar devuelve un par nuevo, anula el anterior y lo enlaza con su sucesor", async () => {
    await register();
    const original = await login();

    const res = await refresh(original.refreshToken);
    expect(res.status).toBe(200);
    expect(refreshResponseSchema.safeParse(res.body).success).toBe(true);
    const renewed: TokenPair = res.body.tokens;
    expect(renewed.refreshToken).not.toBe(original.refreshToken);

    const previous = await findRow(original.refreshToken);
    const successor = await findRow(renewed.refreshToken);
    expect(previous?.revokedAt).not.toBeNull();
    expect(previous?.replacedById).toBe(successor?.id);
    expect(successor?.revokedAt).toBeNull();
    // La renovación pertenece a la misma sesión.
    expect(successor?.familyId).toBe(previous?.familyId);

    // El token de acceso nuevo funciona.
    await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${renewed.accessToken}`)
      .expect(200);
  });

  it("la cadena de renovaciones puede seguir: el sucesor también se renueva", async () => {
    await register();
    const t0 = await login();
    const t1 = (await refresh(t0.refreshToken).expect(200)).body.tokens as TokenPair;
    const t2 = (await refresh(t1.refreshToken).expect(200)).body.tokens as TokenPair;
    expect((await findRow(t2.refreshToken))?.familyId).toBe(
      (await findRow(t0.refreshToken))?.familyId,
    );
  });

  it("cerrar sesión anula la sesión (204) y su token ya no renueva", async () => {
    await register();
    const t = await login();

    await logout(t.refreshToken).expect(204);
    expect((await findRow(t.refreshToken))?.revokedAt).not.toBeNull();
    expect((await refresh(t.refreshToken)).status).toBe(401);
  });

  it("al iniciar sesión se borran los tokens caducados del propio usuario, y solo esos (opción A)", async () => {
    await register();
    await login();
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
    const otherUser = await prisma.user.create({
      data: { email: "otra@example.com", username: "otra.persona", passwordHash: "x" },
    });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredRow = { familyId: crypto.randomUUID(), expiresAt: yesterday };
    await prisma.refreshToken.create({
      data: { ...expiredRow, userId: owner.id, tokenHash: "a".repeat(64) },
    });
    await prisma.refreshToken.create({
      data: { ...expiredRow, userId: otherUser.id, tokenHash: "b".repeat(64) },
    });

    await login();

    const ownRows = await prisma.refreshToken.findMany({ where: { userId: owner.id } });
    // Se fue la caducada; quedan las dos sesiones vigentes.
    expect(ownRows).toHaveLength(2);
    expect(ownRows.every((f) => f.expiresAt > new Date())).toBe(true);
    // La caducada de OTRO usuario no se toca: la purga es de quien entra.
    expect(await prisma.refreshToken.count({ where: { userId: otherUser.id } })).toBe(1);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  describe("casos de abuso", () => {
    it("reutilizar un token ya renovado anula SOLO esa sesión; las demás siguen vivas", async () => {
      await register();
      const stolen = await login();
      const otherDevice = await login();
      // El cliente legítimo renueva; el atacante se quedó con la copia vieja.
      const legitimate = (await refresh(stolen.refreshToken).expect(200)).body.tokens as TokenPair;

      // El atacante presenta la copia: posible robo.
      expect((await refresh(stolen.refreshToken)).status).toBe(401);
      // Toda la familia queda anulada, también el token que tenía el cliente
      // legítimo: deberá volver a iniciar sesión, y el atacante pierde la suya.
      expect((await findRow(legitimate.refreshToken))?.revokedAt).not.toBeNull();
      expect((await refresh(legitimate.refreshToken)).status).toBe(401);
      // La sesión del otro dispositivo (otra familia) no se ve afectada.
      expect((await refresh(otherDevice.refreshToken)).status).toBe(200);
    });

    it("dos renovaciones simultáneas con el mismo token: como mucho una prospera y la sesión se anula", async () => {
      await register();
      const t = await login();

      const [r1, r2] = await Promise.all([refresh(t.refreshToken), refresh(t.refreshToken)]);
      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([200, 401]);
      // El par que prosperó nace ya anulado: dos usos a la vez son
      // indistinguibles de un robo.
      const winner = (r1.status === 200 ? r1 : r2).body.tokens as TokenPair;
      expect((await refresh(winner.refreshToken)).status).toBe(401);
    });

    it("rechaza renovar con un token de ACCESO", async () => {
      await register();
      const t = await login();
      expect((await refresh(t.accessToken)).status).toBe(401);
    });

    it("rechaza un token caducado, manipulado, con firma ajena o sin firma", async () => {
      await register();
      const t = await login();
      const { sub } = jwt.decode(t.refreshToken) as jwt.JwtPayload;
      const signOptions = { issuer: config.jwt.issuer };

      const expired = jwt.sign({ sub, typ: "refresh" }, config.jwt.secret, {
        ...signOptions,
        expiresIn: -10,
      });
      const foreignSignature = jwt.sign(
        { sub, typ: "refresh" },
        "otro-secreto-cualquiera",
        signOptions,
      );
      const unsigned = jwt.sign({ sub, typ: "refresh" }, "", { ...signOptions, algorithm: "none" });
      // Un carácter de la firma cambiado.
      const lastChar = t.refreshToken.at(-1) === "A" ? "B" : "A";
      const tampered = t.refreshToken.slice(0, -1) + lastChar;

      for (const token of [expired, foreignSignature, unsigned, tampered]) {
        expect((await refresh(token)).status).toBe(401);
      }
    });

    it("rechaza un token bien firmado que esta base nunca emitió", async () => {
      await register();
      const t = await login();
      const { sub } = jwt.decode(t.refreshToken) as jwt.JwtPayload;
      // Firmado con el secreto real (p. ej., si se filtrara): sin su fila, no vale.
      const neverIssued = jwt.sign({ sub, typ: "refresh" }, config.jwt.secret, {
        issuer: config.jwt.issuer,
        expiresIn: 60,
      });
      expect((await refresh(neverIssued)).status).toBe(401);
    });

    it("rechaza el token de una cuenta borrada, cuyas sesiones se van en cascada", async () => {
      await register();
      const t = await login();
      await prisma.user.deleteMany();

      expect(await prisma.refreshToken.count()).toBe(0);
      expect((await refresh(t.refreshToken)).status).toBe(401);
    });

    it("cerrar sesión dos veces no es un error (idempotente) y no afecta a otras sesiones", async () => {
      await register();
      const t = await login();
      const otherSession = await login();

      await logout(t.refreshToken).expect(204);
      await logout(t.refreshToken).expect(204);
      expect((await refresh(otherSession.refreshToken)).status).toBe(200);
    });

    it("cerrar sesión exige un token de refresco válido", async () => {
      await register();
      const t = await login();
      expect((await logout(t.accessToken)).status).toBe(401);
      expect((await logout("no-es-un-token")).status).toBe(401);
    });

    it("todos los rechazos son idénticos: no delatan si el token caducó, se anuló o se reutilizó", async () => {
      await register();
      const reused = await login();
      await refresh(reused.refreshToken).expect(200);
      const closed = await login();
      await logout(closed.refreshToken).expect(204);
      const access = (await login()).accessToken;

      const errorBodies = [];
      for (const token of [reused.refreshToken, closed.refreshToken, access, "basura"]) {
        const res = await refresh(token);
        expect(res.status).toBe(401);
        expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
        errorBodies.push(res.body);
      }
      for (const errorBody of errorBodies) expect(errorBody).toEqual(errorBodies[0]);
    });

    it("valida el cuerpo con el contrato compartido (400 sin token o con uno desmesurado)", async () => {
      for (const errorBody of [
        {},
        { refreshToken: "" },
        { refreshToken: 123 },
        { refreshToken: "x".repeat(5000) },
      ]) {
        const res = await request(app).post("/auth/refresh").send(errorBody);
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
