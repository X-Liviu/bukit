import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { apiErrorSchema, refreshResponseSchema, type TokenPair } from "@bukit/core";

import { createApp } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";
import { config } from "../src/utils/config.js";
import { hashToken } from "../src/utils/sessions.js";

// Coste bcrypt bajo SOLO en pruebas (la ruta lo lee por petición).
process.env.BCRYPT_ROUNDS = "4";

const app = createApp();
const prisma = getPrisma();

const cuenta = {
  email: "sesion@ejemplo.com",
  username: "sesion.ejemplo",
  password: "contraseña-larga",
};

/** Alta + inicio de sesión: cada llamada a iniciarSesion abre una sesión (familia) nueva. */
async function registrar(): Promise<void> {
  await request(app).post("/auth/register").send(cuenta).expect(201);
}
async function iniciarSesion(): Promise<TokenPair> {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: cuenta.email, password: cuenta.password })
    .expect(200);
  return res.body.tokens;
}
function renovar(refreshToken: unknown) {
  return request(app).post("/auth/refresh").send({ refreshToken });
}
function cerrarSesion(refreshToken: unknown) {
  return request(app).post("/auth/logout").send({ refreshToken });
}
function fila(refreshToken: string) {
  return prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
}

beforeEach(async () => {
  // Las sesiones caen en cascada con sus cuentas (onDelete: Cascade).
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Sesiones persistidas (US-06)", () => {
  it("el inicio de sesión guarda solo la huella del token de refresco, en una familia nueva", async () => {
    await registrar();
    const a = await iniciarSesion();
    const b = await iniciarSesion();

    const filas = await prisma.refreshToken.findMany();
    expect(filas).toHaveLength(2);
    // Nunca el token en claro: solo su SHA-256.
    expect(filas.map((f) => f.tokenHash).sort()).toEqual(
      [hashToken(a.refreshToken), hashToken(b.refreshToken)].sort(),
    );
    expect(filas.some((f) => f.tokenHash === a.refreshToken)).toBe(false);
    // Cada inicio de sesión es una sesión (familia) distinta.
    expect(new Set(filas.map((f) => f.familyId)).size).toBe(2);
    // La caducidad guardada es la del JWT.
    const { exp } = jwt.decode(a.refreshToken) as jwt.JwtPayload;
    expect((await fila(a.refreshToken))?.expiresAt.getTime()).toBe((exp ?? 0) * 1000);
  });

  it("renovar devuelve un par nuevo, anula el anterior y lo enlaza con su sucesor", async () => {
    await registrar();
    const viejo = await iniciarSesion();

    const res = await renovar(viejo.refreshToken);
    expect(res.status).toBe(200);
    expect(refreshResponseSchema.safeParse(res.body).success).toBe(true);
    const nuevo: TokenPair = res.body.tokens;
    expect(nuevo.refreshToken).not.toBe(viejo.refreshToken);

    const anterior = await fila(viejo.refreshToken);
    const sucesor = await fila(nuevo.refreshToken);
    expect(anterior?.revokedAt).not.toBeNull();
    expect(anterior?.replacedById).toBe(sucesor?.id);
    expect(sucesor?.revokedAt).toBeNull();
    // La renovación pertenece a la misma sesión.
    expect(sucesor?.familyId).toBe(anterior?.familyId);

    // El token de acceso nuevo funciona.
    await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${nuevo.accessToken}`)
      .expect(200);
  });

  it("la cadena de renovaciones puede seguir: el sucesor también se renueva", async () => {
    await registrar();
    const t0 = await iniciarSesion();
    const t1 = (await renovar(t0.refreshToken).expect(200)).body.tokens as TokenPair;
    const t2 = (await renovar(t1.refreshToken).expect(200)).body.tokens as TokenPair;
    expect((await fila(t2.refreshToken))?.familyId).toBe((await fila(t0.refreshToken))?.familyId);
  });

  it("cerrar sesión anula la sesión (204) y su token ya no renueva", async () => {
    await registrar();
    const t = await iniciarSesion();

    await cerrarSesion(t.refreshToken).expect(204);
    expect((await fila(t.refreshToken))?.revokedAt).not.toBeNull();
    expect((await renovar(t.refreshToken)).status).toBe(401);
  });

  it("al iniciar sesión se borran los tokens caducados del propio usuario, y solo esos (opción A)", async () => {
    await registrar();
    await iniciarSesion();
    const usuario = await prisma.user.findUniqueOrThrow({ where: { email: cuenta.email } });
    const otro = await prisma.user.create({
      data: { email: "otra@ejemplo.com", username: "otra.persona", passwordHash: "x" },
    });
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const caducada = { familyId: crypto.randomUUID(), expiresAt: ayer };
    await prisma.refreshToken.create({
      data: { ...caducada, userId: usuario.id, tokenHash: "a".repeat(64) },
    });
    await prisma.refreshToken.create({
      data: { ...caducada, userId: otro.id, tokenHash: "b".repeat(64) },
    });

    await iniciarSesion();

    const propias = await prisma.refreshToken.findMany({ where: { userId: usuario.id } });
    // Se fue la caducada; quedan las dos sesiones vigentes.
    expect(propias).toHaveLength(2);
    expect(propias.every((f) => f.expiresAt > new Date())).toBe(true);
    // La caducada de OTRO usuario no se toca: la purga es de quien entra.
    expect(await prisma.refreshToken.count({ where: { userId: otro.id } })).toBe(1);
  });

  // ── Casos de abuso (Definición de Hecho ampliada, riesgo R14) ────────────
  describe("casos de abuso", () => {
    it("reutilizar un token ya renovado anula SOLO esa sesión; las demás siguen vivas", async () => {
      await registrar();
      const robada = await iniciarSesion();
      const otroDispositivo = await iniciarSesion();
      // El cliente legítimo renueva; el atacante se quedó con la copia vieja.
      const legitimo = (await renovar(robada.refreshToken).expect(200)).body.tokens as TokenPair;

      // El atacante presenta la copia: posible robo.
      expect((await renovar(robada.refreshToken)).status).toBe(401);
      // Toda la familia queda anulada, también el token que tenía el cliente
      // legítimo: deberá volver a iniciar sesión, y el atacante pierde la suya.
      expect((await fila(legitimo.refreshToken))?.revokedAt).not.toBeNull();
      expect((await renovar(legitimo.refreshToken)).status).toBe(401);
      // La sesión del otro dispositivo (otra familia) no se ve afectada.
      expect((await renovar(otroDispositivo.refreshToken)).status).toBe(200);
    });

    it("dos renovaciones simultáneas con el mismo token: como mucho una prospera y la sesión se anula", async () => {
      await registrar();
      const t = await iniciarSesion();

      const [r1, r2] = await Promise.all([renovar(t.refreshToken), renovar(t.refreshToken)]);
      const estados = [r1.status, r2.status].sort();
      expect(estados).toEqual([200, 401]);
      // El par que prosperó nace ya anulado: dos usos a la vez son
      // indistinguibles de un robo.
      const ganador = (r1.status === 200 ? r1 : r2).body.tokens as TokenPair;
      expect((await renovar(ganador.refreshToken)).status).toBe(401);
    });

    it("rechaza renovar con un token de ACCESO", async () => {
      await registrar();
      const t = await iniciarSesion();
      expect((await renovar(t.accessToken)).status).toBe(401);
    });

    it("rechaza un token caducado, manipulado, con firma ajena o sin firma", async () => {
      await registrar();
      const t = await iniciarSesion();
      const { sub } = jwt.decode(t.refreshToken) as jwt.JwtPayload;
      const opciones = { issuer: config.jwt.issuer };

      const caducado = jwt.sign({ sub, typ: "refresh" }, config.jwt.secret, {
        ...opciones,
        expiresIn: -10,
      });
      const firmaAjena = jwt.sign({ sub, typ: "refresh" }, "otro-secreto-cualquiera", opciones);
      const sinFirma = jwt.sign({ sub, typ: "refresh" }, "", { ...opciones, algorithm: "none" });
      // Un carácter de la firma cambiado.
      const ultimo = t.refreshToken.at(-1) === "A" ? "B" : "A";
      const manipulado = t.refreshToken.slice(0, -1) + ultimo;

      for (const token of [caducado, firmaAjena, sinFirma, manipulado]) {
        expect((await renovar(token)).status).toBe(401);
      }
    });

    it("rechaza un token bien firmado que esta base nunca emitió", async () => {
      await registrar();
      const t = await iniciarSesion();
      const { sub } = jwt.decode(t.refreshToken) as jwt.JwtPayload;
      // Firmado con el secreto real (p. ej., si se filtrara): sin su fila, no vale.
      const nuncaEmitido = jwt.sign({ sub, typ: "refresh" }, config.jwt.secret, {
        issuer: config.jwt.issuer,
        expiresIn: 60,
      });
      expect((await renovar(nuncaEmitido)).status).toBe(401);
    });

    it("rechaza el token de una cuenta borrada, cuyas sesiones se van en cascada", async () => {
      await registrar();
      const t = await iniciarSesion();
      await prisma.user.deleteMany();

      expect(await prisma.refreshToken.count()).toBe(0);
      expect((await renovar(t.refreshToken)).status).toBe(401);
    });

    it("cerrar sesión dos veces no es un error (idempotente) y no afecta a otras sesiones", async () => {
      await registrar();
      const t = await iniciarSesion();
      const otra = await iniciarSesion();

      await cerrarSesion(t.refreshToken).expect(204);
      await cerrarSesion(t.refreshToken).expect(204);
      expect((await renovar(otra.refreshToken)).status).toBe(200);
    });

    it("cerrar sesión exige un token de refresco válido", async () => {
      await registrar();
      const t = await iniciarSesion();
      expect((await cerrarSesion(t.accessToken)).status).toBe(401);
      expect((await cerrarSesion("no-es-un-token")).status).toBe(401);
    });

    it("todos los rechazos son idénticos: no delatan si el token caducó, se anuló o se reutilizó", async () => {
      await registrar();
      const reutilizado = await iniciarSesion();
      await renovar(reutilizado.refreshToken).expect(200);
      const cerrado = await iniciarSesion();
      await cerrarSesion(cerrado.refreshToken).expect(204);
      const acceso = (await iniciarSesion()).accessToken;

      const cuerpos = [];
      for (const token of [reutilizado.refreshToken, cerrado.refreshToken, acceso, "basura"]) {
        const res = await renovar(token);
        expect(res.status).toBe(401);
        expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
        cuerpos.push(res.body);
      }
      for (const cuerpo of cuerpos) expect(cuerpo).toEqual(cuerpos[0]);
    });

    it("valida el cuerpo con el contrato compartido (400 sin token o con uno desmesurado)", async () => {
      for (const cuerpo of [
        {},
        { refreshToken: "" },
        { refreshToken: 123 },
        { refreshToken: "x".repeat(5000) },
      ]) {
        const res = await request(app).post("/auth/refresh").send(cuerpo);
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
