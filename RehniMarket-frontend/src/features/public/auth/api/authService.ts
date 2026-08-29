import { api } from "@/api/Client"

import type {
  RegisterUserRequest,
  RegisterCompanyRequest,
  VerifyEmailRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangeEmailRequest,
  ResendVerificationCodeRequest,
  UpdateMeRequest
} from "../types/request";

import type {
  MeResponse,
  TokenResponse,
  VerificationCodeState
} from "../types/response";


export const registerUser = async (data: RegisterUserRequest) => {
  const res = await api.post("/auth/register-user",data);
  return res.data;
};


export const registerCompany = async (
  data: RegisterCompanyRequest
) => {

  const formData = new FormData();

  formData.append("certificate",data.certificate);
  formData.append("full_name",data.full_name);
  formData.append("email",data.email);
  formData.append("password",data.password);
  formData.append("tell",data.tell);
  formData.append("company_name",data.company_name);
  formData.append("company_address",data.company_address);
  formData.append("company_nit",data.company_nit);
  formData.append("company_nit_dv",data.company_nit_dv);

  const res = await api.post("/auth/register-company",formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const verifyEmail = async (data: VerifyEmailRequest) => {
  const res = await api.post("/auth/verify-email-user",data);
  return res.data;
};

export const changeEmail = async (data: ChangeEmailRequest) => {
  const res = await api.post("/auth/change-email",data);
  return res.data;
};

// Botón "Reenviar código" de la pantalla de verificación. El backend
// aplica el cooldown de 60 s (responde 429 RESEND_COOLDOWN_ACTIVE con
// `retry_after` si aún no pasa) e invalida el código anterior.
export const resendVerificationCode = async (
  data: ResendVerificationCodeRequest,
): Promise<VerificationCodeState & { message: string }> => {
  const res = await api.post("/auth/resend-verification-code", data);
  return res.data;
};


export const loginUser = async (data: LoginRequest): Promise<TokenResponse> => {
  const res = await api.post("/auth/login-user",data);
  return res.data;
};

export const forgotPassword = async (data: ForgotPasswordRequest) => {
  const res = await api.post("/auth/forgot-password-user",data);
  return res.data;
};



export const resetPassword = async (data: ResetPasswordRequest) => {
  const res = await api.post("/auth/reset-password-user",data);
  return res.data;
};

export const getProfile = async (): Promise<MeResponse> => {
  const res = await api.get("/auth/me");
  return res.data;

};

// Actualiza nombre y/o correo de la propia cuenta - funciona igual para
// cualquier rol (ver "Configuración de cuenta").
export const updateMe = async (data: UpdateMeRequest): Promise<MeResponse> => {
  const res = await api.patch("/auth/me", data);
  return res.data;
};

// Foto de perfil de la CUENTA - común a cualquier rol.
export const updateMePhoto = async (photo: File): Promise<MeResponse> => {
  const formData = new FormData();
  formData.append("photo", photo);

  const res = await api.patch("/auth/me/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};