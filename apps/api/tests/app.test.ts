import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiErrorSchema } from "@bukit/core";

import { createApp } from "../src/app";
import { badRequest } from "../src/http/errors";

// Pruebas de integración del flujo de error (US-02): el contrato es que TODA
// respuesta de error —404, negocio, validación, framework o fallo interno—
// cumple el esquema compartido apiErrorSchema y nunca filtra detalles internos.
// Las rutas que fallan se inyectan vía la factoría, porque deben registrarse
// antes de los manejadores finales que cierran la cadena.
const appWithFailingRoutes = createApp((app) => {
  app.get("/casos/sincrono", () => {
    throw new Error("detalle interno que no debe filtrarse");
  });
  app.get("/casos/asincrono", async () => {
    throw new Error("detalle interno que no debe filtrarse");
  });
  app.get("/casos/negocio", () => {
    throw badRequest("La lista no admite más metas.");
  });
  app.get("/casos/negocio-con-detalle", () => {
    throw badRequest("La meta es inválida.", [{ path: "goal", message: "obligatorio" }]);
  });
  app.get("/casos/validacion", () => {
    z.object({ email: z.string().email() }).parse({ email: "no-es-un-email" });
  });
});

describe("GET /health", () => {
  it("responde 200 con el estado del servicio", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("manejo centralizado de errores", () => {
  it("responde un 404 uniforme y sin delatar el framework", async () => {
    const res = await request(createApp()).get("/no-existe");
    expect(res.status).toBe(404);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("traduce un error síncrono no controlado a 500 sin filtrar detalles", async () => {
    const res = await request(appWithFailingRoutes).get("/casos/sincrono");
    expect(res.status).toBe(500);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toContain("detalle interno");
  });

  it("traduce un error asíncrono a 500 (Express 5 lo propaga sin envoltorios)", async () => {
    const res = await request(appWithFailingRoutes).get("/casos/asincrono");
    expect(res.status).toBe(500);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toContain("detalle interno");
  });

  it("responde un AppError de negocio con su estado y su código", async () => {
    const res = await request(appWithFailingRoutes).get("/casos/negocio");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toBe("La lista no admite más metas.");
  });

  it("conserva los details de un AppError de negocio", async () => {
    const res = await request(appWithFailingRoutes).get("/casos/negocio-con-detalle");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.details).toEqual([{ path: "goal", message: "obligatorio" }]);
  });

  it("traduce un ZodError a 400 con el detalle campo a campo", async () => {
    const res = await request(appWithFailingRoutes).get("/casos/validacion");
    expect(res.status).toBe(400);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].path).toBe("email");
  });

  it("responde 400 (no 500) al JSON malformado del body-parser, sin eco del cuerpo", async () => {
    const res = await request(createApp())
      .post("/no-existe")
      .set("Content-Type", "application/json")
      .send('{"password":"hunter2"');
    expect(res.status).toBe(400);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(JSON.stringify(res.body)).not.toContain("hunter2");
  });

  it("responde 413 cuando el cuerpo supera el límite del body-parser", async () => {
    const res = await request(createApp())
      .post("/no-existe")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ data: "a".repeat(120_000) }));
    expect(res.status).toBe(413);
    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
});
