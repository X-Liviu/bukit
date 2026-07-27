import { describe, expect, it } from "vitest";

import { apiErrorSchema } from "./api-error";

// El contrato de error es la garantía de RNF-03 (formato uniforme): estas
// pruebas fijan la forma para que la API y el futuro cliente no diverjan.
describe("apiErrorSchema", () => {
  it("acepta un error mínimo con código y mensaje", () => {
    expect(
      apiErrorSchema.safeParse({
        error: { code: "NOT_FOUND", message: "Recurso no encontrado." },
      }).success,
    ).toBe(true);
  });

  it("acepta el detalle campo a campo de los errores de validación", () => {
    expect(
      apiErrorSchema.safeParse({
        error: {
          code: "VALIDATION_ERROR",
          message: "Los datos recibidos no son válidos.",
          details: [{ path: "email", message: "Email mal formado" }],
        },
      }).success,
    ).toBe(true);
  });

  it("rechaza errores sin código o con detalle mal formado", () => {
    expect(apiErrorSchema.safeParse({ error: { message: "sin código" } }).success).toBe(false);
    expect(
      apiErrorSchema.safeParse({
        error: { code: "X", message: "detalle no es lista", details: "stack..." },
      }).success,
    ).toBe(false);
  });
});
