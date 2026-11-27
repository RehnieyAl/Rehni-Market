/** Patrón de correo de contacto: acepta y rechaza lo mismo que antes y en tiempo lineal. */
import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL_PATTERN } from "./emailPattern";

describe("CONTACT_EMAIL_PATTERN", () => {
  it.each(["ventas@tienda.co", "a@b.c", "a.b@sub.dominio.com", "x@.b.c", "x@b..c", "x@b.c."])("acepta %s", (email) => {
    expect(CONTACT_EMAIL_PATTERN.test(email)).toBe(true);
  });

  it.each(["", "sin-arroba", "@b.c", "a@b", "a@.b", "a@b.", "a@@b.c", "a@b c.d", "a b@c.d", "a@b.c@d"])(
    "rechaza %j",
    (email) => {
      expect(CONTACT_EMAIL_PATTERN.test(email)).toBe(false);
    },
  );

  it("rechaza una entrada larga malformada sin retroceso cuadrático", () => {
    const start = performance.now();
    expect(CONTACT_EMAIL_PATTERN.test(`a@${".".repeat(50_000)}@`)).toBe(false);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
