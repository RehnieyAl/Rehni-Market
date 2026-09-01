export interface RegisterUserRequest {
  full_name: string;
  email: string;
  password: string;
  tell: string;
}


export interface RegisterCompanyRequest {
  certificate: File;

  full_name: string;
  email: string;
  password: string;
  tell: string;

  company_name: string;
  company_address: string;
  company_nit: string;
  company_nit_dv: string;
}


export interface VerifyEmailRequest {
  email: string;
  code: string;
}


export interface ChangeEmailRequest {
  old_email: string;
  new_email: string;
}


export interface ResendVerificationCodeRequest {
  email: string;
}


export interface ForgotPasswordRequest {
  email: string;
}


export interface UpdateMeRequest {
  fullName?: string;
  email?: string;
  tell?: string;
}


export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}


export interface RefreshTokenRequest {
  old_refresh_token: string;
}