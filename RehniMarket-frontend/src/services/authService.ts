import { api } from "../api/Client";
import type { 
  RegisterUserPayload,
  RegisterCompanyPayloadFormData,
  VerifyEmail, 
  LoginUser,
  MeResponse,
  ForgotPassword,
  ResetPassword
} from "../types/auth";


export const registerUser = async (data: RegisterUserPayload) => {
  const res = await api.post("/auth/register-user", data);
  return res.data;
};

export const registerCompany = async (data: RegisterCompanyPayloadFormData) => {
  const res = await api.post("/auth/register-company",data);
  return res.data;
};

export const verifyEmail = async(data: VerifyEmail) => {
  const res = await api.post("/auth/verify-email-user", data)
  return res.data;
}

export const loginUser = async(data: LoginUser) => {
  const res= await api.post("/auth/login-user", data)
  return res.data
}

export const forgotPassword = async(data: ForgotPassword) => {
  const res = await api.post("/auth/forgot-password-user", data)
  return res.data
}

export const resetPassword = async(data: ResetPassword) => {
  const res = await api.post("/auth/reset-password-user", data)
  return res.data
}

export const getProfile = async (): Promise<MeResponse> => {
  const res = await api.get("/auth/me");

  return res.data;
};