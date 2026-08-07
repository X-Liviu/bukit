import { describe, expect, it } from "vitest";

import { createListSchema, goalSchema } from "../src/list";

// Protege las dos reglas de producto decididas por el autor que el esquema
// compartido debe hacer cumplir desde ya (RF-03): la fecha límite vive en cada
// meta (28-07-2026) y toda lista nace con al menos una meta.
describe("goalSchema", () => {
  it("exige fecha límite en cada meta", () => {
    expect(goalSchema.safeParse({ title: "Aprender euskera" }).success).toBe(false);
    const result = goalSchema.safeParse({ title: "Aprender euskera", deadline: "2027-06-01" });
    expect(result.success).toBe(true);
  });

  it("rechaza los valores que new Date() convertiría en el epoch de 1970", () => {
    for (const deadline of [null, 0, false, ""]) {
      expect(goalSchema.safeParse({ title: "Meta", deadline }).success).toBe(false);
    }
  });
});

describe("createListSchema", () => {
  it("rechaza una lista sin metas", () => {
    expect(createListSchema.safeParse({ title: "Verano 2027", goals: [] }).success).toBe(false);
  });

  it("acepta una lista con metas fechadas y coacciona las fechas a Date", () => {
    const result = createListSchema.parse({
      title: "Verano 2027",
      goals: [{ title: "Ruta del Flysch", deadline: "2027-08-15" }],
    });
    expect(result.goals[0]?.deadline).toBeInstanceOf(Date);
  });
});
