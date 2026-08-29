import { api } from "./client";

import type {
  ChangeEmailRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  ResendVerificationCodeRequest,
  ResetPasswordRequest,
  TokenResponse,
  VerificationCodeState,
  VerifyEmailRequest,
} from "@/types/auth";

// Mismos endpoints exactos que RehniMarket-frontend/src/features/public/
// auth/api/authService.ts (solo la porción de comprador - se deja afuera
// registerCompany, exclusivo del rol company/owner).
export async function registerUser(data: RegisterUserRequest): Promise<RegisterUserResponse> {
  const res = await api.post<RegisterUserResponse>("/auth/register-user", data);
  return res.data;
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<MessageResponse> {
  const res = await api.post<MessageResponse>("/auth/verify-email-user", data);
  return res.data;
}

export async function changeEmail(
  data: ChangeEmailRequest,
): Promise<MessageResponse & Partial<VerificationCodeState>> {
  const res = await api.post<MessageResponse & Partial<VerificationCodeState>>(
    "/auth/change-email",
    data,
  );
  return res.data;
}

// Boton "Reenviar codigo". El backend aplica el cooldown de 60 s (responde
// 429 RESEND_COOLDOWN_ACTIVE con `retry_after`) e invalida el codigo anterior.
export async function resendVerificationCode(
  data: ResendVerificationCodeRequest,
): Promise<MessageResponse & VerificationCodeState> {
  const res = await api.post<MessageResponse & VerificationCodeState>(
    "/auth/resend-verification-code",
    data,
  );
  return res.data;
}

export async function loginUser(data: LoginRequest): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/login-user", data);
  return res.data;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const res = await api.post<MessageResponse>("/auth/forgot-password-user", data);
  return res.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const res = await api.post<MessageResponse>("/auth/reset-password-user", data);
  return res.data;
}

export async function getProfile(): Promise<MeResponse> {
  const res = await api.get<MeResponse>("/auth/me");
  return res.data;
}
