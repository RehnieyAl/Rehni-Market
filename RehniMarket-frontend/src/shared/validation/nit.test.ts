import { describe, expect, it } from "vitest";

import { calculateNitDv, cleanNit, isValidNitDv } from "./nit";

// NIT publicados por cada entidad junto con su DV.
const PUBLISHED_NITS: Array<[entidad: string, nit: string, dv: string]> = [
  ["DIAN", "800197268", "4"],
  ["Ecopetrol", "899999068", "1"],
  ["Bancolombia", "890903938", "8"],
  ["Almacenes Éxito", "890900608", "9"],
  ["SENA", "899999034", "1"],
];

// DV calculados con app/utils/NitValidator.py (backend) el 2026-11-03.
const BACKEND_COMPUTED: Array<[nit: string, dv: number]> = [
  ["10001", 0], // residuo 0 -> DV 0 (menor NIT de 5 dígitos con DV 0)
  ["10005", 1], // residuo 1 -> DV 1 (menor NIT de 5 dígitos con DV 1)
  ["12345", 8],
  ["811000000", 2],
  ["1020304050", 8], // 10 dígitos
  ["999999999999999", 2], // 15 dígitos: longitud máxima ponderada
];

describe("calculateNitDv", () => {
  it.each(PUBLISHED_NITS)("%s: %s-%s", (_entidad, nit, dv) => {
    expect(calculateNitDv(nit)).toBe(Number(dv));
  });

  it.each(BACKEND_COMPUTED)("coincide con el backend para %s -> %i", (nit, dv) => {
    expect(calculateNitDv(nit)).toBe(dv);
  });

  it("los ceros a la izquierda no cambian el DV", () => {
    expect(calculateNitDv("000800197268")).toBe(calculateNitDv("800197268"));
  });

  it.todo(
    "H-02: un NIT de más de 15 dígitos debería rechazarse; hoy solo se ponderan los 15 primeros, igual que en el backend",
  );
});

describe("isValidNitDv", () => {
  it.each(PUBLISHED_NITS)("acepta el DV publicado de %s", (_entidad, nit, dv) => {
    expect(isValidNitDv(nit, dv)).toBe(true);
  });

  it("rechaza los otros nueve dígitos para un NIT real", () => {
    const wrong = "0123456789".split("").filter((d) => d !== "4");
    for (const dv of wrong) expect(isValidNitDv("800197268", dv)).toBe(false);
  });

  it("ignora separadores en el NIT, como clean_nit del backend", () => {
    expect(cleanNit("800.197.268")).toBe("800197268");
    expect(isValidNitDv("800.197.268", "4")).toBe(true);
  });

  it("rechaza NIT vacío o DV no numérico", () => {
    expect(isValidNitDv("", "0")).toBe(false);
    expect(isValidNitDv("...", "0")).toBe(false);
    expect(isValidNitDv("800197268", "")).toBe(false);
    expect(isValidNitDv("800197268", "x")).toBe(false);
  });
});
