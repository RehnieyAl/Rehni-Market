export type Role = "admin" | "company" | "user";

export interface RegisterUserPayload {
  fullName: string;
  email: string;
  password: string;
  tell: string;
}

export interface RegisterCompanyPayload {
  fullName: string;
  email: string;
  password: string;
  tell: string;
  companyName: string;
  companyAddress: string;
  companyNIT: string;
  companyNITDV: string;
  certificate: File;
}

export type RegisterCompanyPayloadFormData = FormData;

export interface VerifyEmail {
  email: string;
  code: string;
}

export interface ChangeEmail {
  old_email: string;
  new_email:string;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  email: string;
  code: string;
  newPassword: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: Role;
}

export interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;

  user: AuthUser | null;

  login: (data: LoginResponse) => void;
  logout: () => void;
}

export interface MeResponse {
  email: string;
  name: string;
  role: Role;
}

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
}