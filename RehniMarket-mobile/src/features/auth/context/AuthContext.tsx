import { createContext } from "react";

import type {
  AuthUser,
  LoginRequest,
  RegisterUserRequest,
  RegisterUserResponse,
} from "@/types/auth";

export interface AuthContextType {
  user: AuthUser | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  isUser: boolean;

  login(data: LoginRequest): Promise<AuthUser>;

  register(data: RegisterUserRequest): Promise<RegisterUserResponse>;

  logout(): Promise<void>;

  refreshSession(): Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
