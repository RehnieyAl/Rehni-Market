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
  UpdateMeRequest,
  VerificationCodeState,
  VerifyEmailRequest,
} from "@/types/auth";

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

export async function updateMe(data: UpdateMeRequest): Promise<MeResponse> {
  const res = await api.patch<MeResponse>("/auth/me", data);
  return res.data;
}
