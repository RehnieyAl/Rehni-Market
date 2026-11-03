import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  charLength,
  companyAddressRule,
  companyNameRule,
  emailRule,
  fullNameRule,
  nitDvRule,
  nitRule,
  passwordRule,
  phoneRule,
  returnReasonRule,
  trackingNumberRule,
} from "./rules";

/** Mensaje del primer fallo, o undefined si el valor es válido. */
function errorOf(rule: z.ZodType, value: string) {
  const result = rule.safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
}

const text = (n: number, ch = "a") => ch.repeat(n);

describe("charLength", () => {
  it("cuenta puntos de código como len() de Python", () => {
    expect("😀".length).toBe(2);
    expect(charLength("😀")).toBe(1);
  });
});

describe("fullNameRule (SchemaRegister.py:29)", () => {
  const MIN = "El nombre completo debe tener al menos 3 caracteres.";
  const MAX = "El nombre completo no debe exceder los 60 caracteres.";

  it.each(["Ana", "Ana María Pérez", text(60)])("acepta %j", (v) => {
    expect(errorOf(fullNameRule, v)).toBeUndefined();
  });

  it("límite inferior: 2 caracteres, o 3 rodeados de espacios que no cuentan", () => {
    expect(errorOf(fullNameRule, "An")).toBe(MIN);
    expect(errorOf(fullNameRule, "  An  ")).toBe(MIN);
    expect(errorOf(fullNameRule, "")).toBe(MIN);
  });

  it("límite superior: 61 caracteres", () => {
    expect(errorOf(fullNameRule, text(61))).toBe(MAX);
  });

  it("el máximo se mide sobre el valor sin recortar, como el backend", () => {
    expect(errorOf(fullNameRule, ` ${text(59)} `)).toBe(MAX);
  });

  it("60 emojis son 60 caracteres, no 120", () => {
    expect(errorOf(fullNameRule, text(60, "😀"))).toBeUndefined();
  });
});

describe("passwordRule (SchemaRegister.py:44)", () => {
  it.each(["Abcdefg1", "Secreto123", "Contraseña9"])("acepta %j", (v) => {
    expect(errorOf(passwordRule, v)).toBeUndefined();
  });

  it.each([
    ["Abcde1x", "La contraseña debe tener al menos 8 caracteres."],
    ["abcdefg1", "La contraseña debe contener al menos una letra mayúscula."],
    ["ABCDEFG1", "La contraseña debe contener al menos una letra minúscula."],
    ["Abcdefgh", "La contraseña debe contener al menos un número."],
  ])("rechaza %j: %s", (v, message) => {
    expect(errorOf(passwordRule, v)).toBe(message);
  });

  it("informa el primer fallo en el orden del backend (longitud antes que mayúscula)", () => {
    expect(errorOf(passwordRule, "abc")).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("acepta cualquier dígito decimal Unicode, igual que \\d de Python", () => {
    expect(errorOf(passwordRule, "Abcdefg١")).toBeUndefined();
  });
});

describe("phoneRule (SchemaRegister.py:69)", () => {
  const DIGITS = "El número de teléfono solo puede contener números.";
  const LENGTH = "El número de teléfono debe tener exactamente 10 dígitos.";

  it("acepta exactamente 10 dígitos", () => {
    expect(errorOf(phoneRule, "3001234567")).toBeUndefined();
  });

  it.each([
    ["300123456", LENGTH],
    ["30012345678", LENGTH],
    ["300-123-45", DIGITS],
    ["300 1234567", DIGITS],
    ["+573001234", DIGITS],
    ["", DIGITS],
  ])("rechaza %j", (v, message) => {
    expect(errorOf(phoneRule, v)).toBe(message);
  });

  it("solo dígitos ASCII: rechaza dígitos de ancho completo que el backend acepta (H-03)", () => {
    expect(errorOf(phoneRule, "３００１２３４５６７")).toBe(DIGITS);
  });
});

describe("emailRule (EmailStr)", () => {
  it.each(["ana@example.com", "ana.perez+tienda@empresa.com.co", " ana@example.com "])(
    "acepta %j",
    (v) => {
      expect(errorOf(emailRule, v)).toBeUndefined();
    },
  );

  it.each(["ana", "ana@", "@example.com", "ana@@example.com", "a..b@example.com"])(
    "rechaza formato inválido %j",
    (v) => {
      expect(errorOf(emailRule, v)).toBe("Ingresa un correo electrónico válido.");
    },
  );

  it.each(["ana@test.local", "ana@a.test", "ana@x.onion", "ana@x.invalid", "ana@home.arpa"])(
    "rechaza dominios de uso especial como email-validator: %j",
    (v) => {
      expect(errorOf(emailRule, v)).toBe("Ingresa un correo electrónico válido.");
    },
  );
});

describe("companyNameRule (SchemaRegister.py:106)", () => {
  it("acepta de 3 a 50 caracteres", () => {
    expect(errorOf(companyNameRule, "ABC")).toBeUndefined();
    expect(errorOf(companyNameRule, text(50))).toBeUndefined();
  });

  it("rechaza los límites exteriores", () => {
    expect(errorOf(companyNameRule, "  AB ")).toBe(
      "El nombre de la empresa debe tener al menos 3 caracteres.",
    );
    expect(errorOf(companyNameRule, text(51))).toBe(
      "El nombre de la empresa no debe exceder los 50 caracteres.",
    );
  });
});

describe("companyAddressRule (SchemaRegister.py:121)", () => {
  const MIN = "La dirección debe tener al menos 5 caracteres.";

  it("acepta 5 caracteres y direcciones largas (no hay máximo)", () => {
    expect(errorOf(companyAddressRule, "Cl 12")).toBeUndefined();
    expect(errorOf(companyAddressRule, text(300))).toBeUndefined();
  });

  it("rechaza 4 caracteres, también si vienen con espacios", () => {
    expect(errorOf(companyAddressRule, "Cl 1")).toBe(MIN);
    expect(errorOf(companyAddressRule, "   Cl 1   ")).toBe(MIN);
  });
});

describe("nitRule (SchemaRegister.py:131)", () => {
  const DIGITS = "El NIT solo puede contener números.";
  const MIN = "El NIT debe tener al menos 5 caracteres.";

  it.each(["12345", "800197268", "1020304050"])("acepta %j", (v) => {
    expect(errorOf(nitRule, v)).toBeUndefined();
  });

  it.each([
    ["1234", MIN],
    ["", DIGITS],
    ["800.197.268", DIGITS],
    ["800197268-4", DIGITS],
    ["90012345a", DIGITS],
  ])("rechaza %j", (v, message) => {
    expect(errorOf(nitRule, v)).toBe(message);
  });
});

describe("nitDvRule (SchemaRegister.py:146)", () => {
  it.each("0123456789".split(""))("acepta el dígito %s", (v) => {
    expect(errorOf(nitDvRule, v)).toBeUndefined();
  });

  it.each([
    ["10", "El dígito de verificación debe tener exactamente un dígito."],
    ["a", "El dígito de verificación solo puede contener números."],
    ["", "El dígito de verificación solo puede contener números."],
    ["-1", "El dígito de verificación solo puede contener números."],
  ])("rechaza %j", (v, message) => {
    expect(errorOf(nitDvRule, v)).toBe(message);
  });
});

describe("returnReasonRule (SchemaReturn.py:16)", () => {
  const MIN = "Cuéntanos el motivo de la devolución (mínimo 5 caracteres).";
  const MAX = "El motivo no debe exceder los 500 caracteres.";

  it("acepta 5 y 500 caracteres", () => {
    expect(errorOf(returnReasonRule, "Talla")).toBeUndefined();
    expect(errorOf(returnReasonRule, text(500))).toBeUndefined();
  });

  it("rechaza 4 y 501 caracteres", () => {
    expect(errorOf(returnReasonRule, "Roto")).toBe(MIN);
    expect(errorOf(returnReasonRule, text(501))).toBe(MAX);
  });

  it("ambos límites se miden sobre el texto recortado", () => {
    expect(errorOf(returnReasonRule, "   Roto   ")).toBe(MIN);
    expect(errorOf(returnReasonRule, `  ${text(500)}  `)).toBeUndefined();
  });
});

describe("trackingNumberRule (SchemaOrder.py:95)", () => {
  const MIN = "El número de guía debe tener al menos 3 caracteres.";
  const MAX = "El número de guía no debe exceder los 80 caracteres.";

  it("acepta 3 y 80 caracteres", () => {
    expect(errorOf(trackingNumberRule, "A12")).toBeUndefined();
    expect(errorOf(trackingNumberRule, text(80, "9"))).toBeUndefined();
  });

  it("rechaza 2 y 81 caracteres, medidos sin espacios", () => {
    expect(errorOf(trackingNumberRule, " 12 ")).toBe(MIN);
    expect(errorOf(trackingNumberRule, text(81, "9"))).toBe(MAX);
    expect(errorOf(trackingNumberRule, ` ${text(80, "9")} `)).toBeUndefined();
  });
});
