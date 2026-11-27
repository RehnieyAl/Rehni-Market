// Número de WhatsApp institucional: solo formato internacional explícito y mensaje fijo bien codificado.
import { describe, expect, it } from "vitest";

import { buildRechargeWhatsappUrl, RECHARGE_MESSAGE, toWhatsappNumber } from "./rechargeWhatsapp";

describe("toWhatsappNumber", () => {
  it.each([
    ["+57 300 111 2233", "573001112233"],
    ["+57 (601) 555-0101", "576015550101"],
    ["+1 415 555 2671", "14155552671"],
  ])("normaliza %s", (input, expected) => {
    expect(toWhatsappNumber(input)).toBe(expected);
  });

  it.each([null, undefined, "", "3001112233", "573001112233", "+0 300 111", "+57 300", "+57 300 111 2233 4455 66", "+57abc3001112233"])(
    "rechaza %j sin suponer un indicativo",
    (input) => {
      expect(toWhatsappNumber(input)).toBeNull();
    },
  );
});

describe("buildRechargeWhatsappUrl", () => {
  it("arma wa.me con el mensaje codificado", () => {
    const url = buildRechargeWhatsappUrl("+57 300 111 2233");
    expect(url).toBe(`https://wa.me/573001112233?text=${encodeURIComponent(RECHARGE_MESSAGE)}`);
    expect(url).not.toMatch(/[ ¿,]/);
  });

  it("sin número válido no hay enlace", () => {
    expect(buildRechargeWhatsappUrl("3001112233")).toBeNull();
  });
});
