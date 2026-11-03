import { describe, expect, it } from "vitest";

import {
  PASSWORDS_MISMATCH,
  orderShippingSchema,
  registerCompanySchema,
  registerUserSchema,
  returnRequestSchema,
} from "./schemas";
import { NIT_DV_MISMATCH } from "./rules";
import { getFieldErrors } from "./useFormValidation";

const validUser = {
  full_name: "Ana Pérez",
  email: "ana@example.com",
  password: "Secreto123",
  confirmPassword: "Secreto123",
  tell: "3001234567",
};

// NIT de la DIAN con su DV publicado.
const validCompany = {
  ...validUser,
  company_name: "Tienda Ana SAS",
  company_address: "Calle 10 # 20-30",
  company_nit: "800197268",
  company_nit_dv: "4",
};

describe("registerUserSchema", () => {
  it("acepta un registro válido", () => {
    expect(getFieldErrors(registerUserSchema, validUser)).toEqual({});
  });

  it("informa un error por campo, con el mensaje del backend", () => {
    const errors = getFieldErrors(registerUserSchema, {
      ...validUser,
      full_name: "A",
      tell: "123",
      password: "secreto",
      confirmPassword: "secreto",
    });

    expect(errors).toEqual({
      full_name: "El nombre completo debe tener al menos 3 caracteres.",
      tell: "El número de teléfono debe tener exactamente 10 dígitos.",
      password: "La contraseña debe tener al menos 8 caracteres.",
    });
  });

  it("marca la confirmación cuando no coincide", () => {
    expect(
      getFieldErrors(registerUserSchema, { ...validUser, confirmPassword: "Secreto124" }),
    ).toEqual({ confirmPassword: PASSWORDS_MISMATCH });
  });
});

describe("registerCompanySchema", () => {
  it("acepta un registro con NIT y DV reales", () => {
    expect(getFieldErrors(registerCompanySchema, validCompany)).toEqual({});
  });

  it("rechaza un DV que no corresponde al NIT", () => {
    expect(getFieldErrors(registerCompanySchema, { ...validCompany, company_nit_dv: "5" })).toEqual({
      company_nit_dv: NIT_DV_MISMATCH,
    });
  });

  it("no compara el DV mientras otro campo de la empresa sea inválido (como el model_validator)", () => {
    const errors = getFieldErrors(registerCompanySchema, {
      ...validCompany,
      company_address: "Cl 1",
      company_nit_dv: "5",
    });

    expect(errors).toEqual({ company_address: "La dirección debe tener al menos 5 caracteres." });
  });

  it("sí compara el DV aunque fallen campos del usuario (el backend valida modelos separados)", () => {
    const errors = getFieldErrors(registerCompanySchema, {
      ...validCompany,
      tell: "12",
      company_nit_dv: "5",
    });

    expect(errors.company_nit_dv).toBe(NIT_DV_MISMATCH);
    expect(errors.tell).toBe("El número de teléfono debe tener exactamente 10 dígitos.");
  });

  it("acepta los NIT cuyo DV sale de los residuos 0 y 1", () => {
    for (const [nit, dv] of [["10001", "0"], ["10005", "1"]]) {
      expect(
        getFieldErrors(registerCompanySchema, { ...validCompany, company_nit: nit, company_nit_dv: dv }),
      ).toEqual({});
    }
  });
});

describe("returnRequestSchema", () => {
  it("valida el motivo", () => {
    expect(getFieldErrors(returnRequestSchema, { reason: "Llegó con la talla equivocada" })).toEqual({});
    expect(getFieldErrors(returnRequestSchema, { reason: "mal" })).toEqual({
      reason: "Cuéntanos el motivo de la devolución (mínimo 5 caracteres).",
    });
  });
});

describe("orderShippingSchema", () => {
  it("exige transportadora y una guía válida", () => {
    expect(
      getFieldErrors(orderShippingSchema, { shippingCarrierId: "c-1", trackingNumber: "ABC123" }),
    ).toEqual({});
    expect(getFieldErrors(orderShippingSchema, { shippingCarrierId: "", trackingNumber: "1" })).toEqual({
      shippingCarrierId: "Selecciona una transportadora.",
      trackingNumber: "El número de guía debe tener al menos 3 caracteres.",
    });
  });
});
