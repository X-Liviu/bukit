import { describe, expect, it } from "vitest";

import { loginSchema, registerUserSchema, userTierSchema } from "./user";

// Primer test del monorepo. Cubre los esquemas compartidos de usuario por un
// motivo doble: son la validación única front ↔ back (RNF-01) y dan contenido
// real a la etapa de pruebas de la CI (US-01), que sin ningún test pasaría en
// vacío sin demostrar nada.
describe("registerUserSchema", () => {
  it("acepta un registro válido", () => {
    const result = registerUserSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "contraseña-larga",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un email mal formado", () => {
    const result = registerUserSchema.safeParse({
      email: "no-es-un-email",
      password: "contraseña-larga",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    const result = registerUserSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "corta",
    });
    expect(result.success).toBe(false);
  });
});

describe("userTierSchema", () => {
  it("solo admite los dos niveles de usuario definidos en la propuesta", () => {
    expect(userTierSchema.safeParse("NORMAL").success).toBe(true);
    expect(userTierSchema.safeParse("TOP").success).toBe(true);
    expect(userTierSchema.safeParse("PREMIUM").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("exige una contraseña no vacía", () => {
    const result = loginSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
