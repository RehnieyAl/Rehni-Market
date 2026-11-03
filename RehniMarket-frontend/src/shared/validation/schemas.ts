// Esquemas de formulario compuestos a partir de las reglas espejo (rules.ts).

import { z } from "zod";

import { isValidNitDv } from "./nit";
import {
  NIT_DV_MISMATCH,
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

// Solo cliente: el backend no recibe la confirmación.
export const PASSWORDS_MISMATCH = "Las contraseñas no coinciden.";

const userFields = {
  full_name: fullNameRule,
  email: emailRule,
  password: passwordRule,
  tell: phoneRule,
};

// SchemaRegister.py: CreateUserRequest
export const registerUserSchema = z
  .object({ ...userFields, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: PASSWORDS_MISMATCH,
  });

const companyFields = {
  company_name: companyNameRule,
  company_address: companyAddressRule,
  company_nit: nitRule,
  company_nit_dv: nitDvRule,
};

const companyModel = z.object(companyFields);

// POST /auth/register/company: CreateUserRequest + CreateCompanyRequest
export const registerCompanySchema = z
  .object({ ...userFields, confirmPassword: z.string(), ...companyFields })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: PASSWORDS_MISMATCH,
  })
  .superRefine((v, ctx) => {
    // Como el model_validator(mode="after") de CreateCompanyRequest: solo se
    // compara el DV cuando los campos de la empresa ya son válidos.
    if (!companyModel.safeParse(v).success) return;

    if (!isValidNitDv(v.company_nit, v.company_nit_dv)) {
      ctx.addIssue({ code: "custom", path: ["company_nit_dv"], message: NIT_DV_MISMATCH });
    }
  });

// SchemaReturn.py: CreateReturnRequest (orderItemId lo pone la pantalla)
export const returnRequestSchema = z.object({ reason: returnReasonRule });

// SchemaOrder.py: SetOrderShippingRequest
export const orderShippingSchema = z.object({
  shippingCarrierId: z.string().min(1, "Selecciona una transportadora."),
  trackingNumber: trackingNumberRule,
});

export type RegisterUserValues = z.input<typeof registerUserSchema>;
export type RegisterCompanyValues = z.input<typeof registerCompanySchema>;
