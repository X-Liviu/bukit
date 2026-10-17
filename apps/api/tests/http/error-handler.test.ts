import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { badRequest } from "../../src/http/errors";
import { logger } from "../../src/platform/logger";
import { errorHandler } from "../../src/http/error-handler";

// Pruebas unitarias del manejador final para lo que la integración no puede
// observar: los NIVELES de registro (criterio 3 de la US-02) y la guarda de
// headersSent. El logger va apagado en test (sus métodos son noops), pero
// sigue siendo espiable con vi.spyOn sin ensuciar la salida.
function fakeRes(headersSent = false) {
  return {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}
const req = {} as Request;

describe("errorHandler (unitario)", () => {
  it("registra los AppError a nivel warn y responde su estado", () => {
    const warn = vi.spyOn(logger, "warn");
    const res = fakeRes();
    const next = vi.fn();
    errorHandler(badRequest("inválido"), req, res as unknown as Response, next as NextFunction);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("registra la validación fallida a nivel warn", () => {
    const warn = vi.spyOn(logger, "warn");
    const res = fakeRes();
    const parsed = z.object({ email: z.string().email() }).safeParse({ email: "x" });
    errorHandler(
      parsed.success ? new Error("el fixture debería fallar") : parsed.error,
      req,
      res as unknown as Response,
      vi.fn() as NextFunction,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    warn.mockRestore();
  });

  it("registra los errores no controlados a nivel error", () => {
    const error = vi.spyOn(logger, "error");
    const res = fakeRes();
    errorHandler(new Error("boom"), req, res as unknown as Response, vi.fn() as NextFunction);
    expect(error).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    error.mockRestore();
  });

  it("delega en next(err) sin tocar la respuesta si ya se enviaron cabeceras", () => {
    const res = fakeRes(true);
    const next = vi.fn();
    const err = new Error("respuesta a medias");
    errorHandler(err, req, res as unknown as Response, next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
