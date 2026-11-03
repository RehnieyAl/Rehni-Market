// Reglas de campo espejo del backend. Cada regla cita su origen; los mensajes
// son los mismos que devuelve el backend para que el usuario vea un solo texto.
//
// Como en los field_validator de Pydantic, se informa solo el PRIMER fallo de
// cada campo y en el mismo orden en que el backend lo comprueba.

import { z } from "zod";

type Check = [ok: (value: string) => boolean, message: string];

/** Longitud en puntos de código, como len() de Python (no en unidades UTF-16). */
export const charLength = (value: string) => [...value].length;

const ASCII_DIGITS = /^[0-9]+$/;

function field(checks: Check[]) {
  return z.string().superRefine((value, ctx) => {
    const failed = checks.find(([ok]) => !ok(value));
    if (failed) ctx.addIssue({ code: "custom", message: failed[1] });
  });
}

// SchemaRegister.py:29 (CreateUserRequest.validate_full_name)
export const fullNameRule = field([
  [(v) => charLength(v.trim()) >= 3, "El nombre completo debe tener al menos 3 caracteres."],
  [(v) => charLength(v) <= 60, "El nombre completo no debe exceder los 60 caracteres."],
]);

// SchemaRegister.py:44 (validate_password); igual en SchemaResetPassword.py.
// \p{Nd} reproduce \d de Python, que acepta cualquier dígito decimal Unicode.
export const passwordRule = field([
  [(v) => charLength(v) >= 8, "La contraseña debe tener al menos 8 caracteres."],
  [(v) => /[A-Z]/.test(v), "La contraseña debe contener al menos una letra mayúscula."],
  [(v) => /[a-z]/.test(v), "La contraseña debe contener al menos una letra minúscula."],
  [(v) => /\p{Nd}/u.test(v), "La contraseña debe contener al menos un número."],
]);

// SchemaRegister.py:69 (validate_tell). Solo dígitos ASCII: el backend usa
// str.isdigit(), que también acepta "３" o "²" (hallazgo H-03).
export const phoneRule = field([
  [(v) => ASCII_DIGITS.test(v), "El número de teléfono solo puede contener números."],
  [(v) => v.length === 10, "El número de teléfono debe tener exactamente 10 dígitos."],
]);

// EmailStr (email-validator 2.3.0): recorta espacios y rechaza dominios de
// uso especial. Paridad parcial: el backend sigue siendo la autoridad.
const SPECIAL_USE_DOMAINS = ["arpa", "invalid", "local", "localhost", "onion", "test"];

export const emailRule = z
  .string()
  .trim()
  .pipe(
    z
      .email("Ingresa un correo electrónico válido.")
      .refine(
        (v) => !SPECIAL_USE_DOMAINS.includes(v.split(".").pop()!.toLowerCase()),
        "Ingresa un correo electrónico válido.",
      ),
  );

// SchemaRegister.py:106 (CreateCompanyRequest.validate_company_name)
export const companyNameRule = field([
  [(v) => charLength(v.trim()) >= 3, "El nombre de la empresa debe tener al menos 3 caracteres."],
  [(v) => charLength(v) <= 50, "El nombre de la empresa no debe exceder los 50 caracteres."],
]);

// SchemaRegister.py:121 (validate_company_address)
export const companyAddressRule = field([
  [(v) => charLength(v.trim()) >= 5, "La dirección debe tener al menos 5 caracteres."],
]);

// SchemaRegister.py:131 (validate_company_nit). Sin máximo, como el backend (H-02).
export const nitRule = field([
  [(v) => ASCII_DIGITS.test(v), "El NIT solo puede contener números."],
  [(v) => v.length >= 5, "El NIT debe tener al menos 5 caracteres."],
]);

// SchemaRegister.py:146 (validate_company_nit_dv)
export const nitDvRule = field([
  [(v) => ASCII_DIGITS.test(v), "El dígito de verificación solo puede contener números."],
  [(v) => v.length === 1, "El dígito de verificación debe tener exactamente un dígito."],
]);

// SchemaRegister.py:161 (model_validator validate_nit_check_digit)
export const NIT_DV_MISMATCH = "El dígito de verificación no coincide con el NIT ingresado.";

// SchemaReturn.py:16 (CreateReturnRequest.validate_reason)
export const RETURN_REASON_MIN = 5;
export const RETURN_REASON_MAX = 500;
export const returnReasonRule = field([
  [
    (v) => charLength(v.trim()) >= RETURN_REASON_MIN,
    "Cuéntanos el motivo de la devolución (mínimo 5 caracteres).",
  ],
  [
    (v) => charLength(v.trim()) <= RETURN_REASON_MAX,
    "El motivo no debe exceder los 500 caracteres.",
  ],
]);

// SchemaOrder.py:95 (SetOrderShippingRequest.validate_tracking_number)
export const TRACKING_NUMBER_MAX = 80;
export const trackingNumberRule = field([
  [(v) => charLength(v.trim()) >= 3, "El número de guía debe tener al menos 3 caracteres."],
  [
    (v) => charLength(v.trim()) <= TRACKING_NUMBER_MAX,
    "El número de guía no debe exceder los 80 caracteres.",
  ],
]);
